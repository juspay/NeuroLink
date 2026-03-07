<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { generateNeuronDendrites } from "$lib/lsystem.js";
  import {
    activeSection,
    scrollProgress,
    scrollVelocity,
    canvasConfig,
  } from "$lib/stores/canvasState.js";

  type Phase =
    | "hero"
    | "streams"
    | "pipe"
    | "connectors"
    | "observe"
    | "ecosystem"
    | "cta";

  type Neuron = {
    id: string;
    seed: number;
    xFrac: number;
    pageFrac: number;
    side: "left" | "right";
    phase: Phase;
    label?: string;
    color?: string;
  };

  type AxonSig = {
    kind: "axon";
    neuronIdx: number;
    t: number;
    speed: number;
    color: string;
    direction: "to-cord" | "from-cord";
  };

  type SpinalSig = {
    kind: "spinal";
    py: number;
    direction: 1 | -1;
    speed: number;
    color: string;
    trailDist: number;
    distTraveled: number;
    maxDist: number;
    spawnedAxon: boolean;
  };

  type Signal = AxonSig | SpinalSig;

  type AmbientCell = {
    ox: number;
    oy: number;
    x: number;
    y: number;
    ph: number;
    spd: number;
    r: number;
    op: number;
  };

  let mouseX = $state(-9999);
  let mouseY = $state(-9999);
  let reduced = $state(false);

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let raf: number;
  let W = 0;
  let H = 0;
  let DPR = 1;

  let scrollY = 0;
  let prevScrollY = 0;
  let pageHeight = 3000;
  let smoothedVelocity = 0;
  let spineBiasX = 0;

  let neurons: Neuron[] = [];
  let signals: Signal[] = [];
  let ambient: AmbientCell[] = [];
  let sectionObservers: IntersectionObserver[] = [];
  let onMouseMove: ((e: MouseEvent) => void) | null = null;

  let phaseCenters: Record<Phase, number> = {
    hero: 0.06,
    streams: 0.22,
    pipe: 0.36,
    connectors: 0.5,
    observe: 0.66,
    ecosystem: 0.8,
    cta: 0.93,
  };

  const C = {
    pipe: "#0190e0",
    sky: "#a8d8ff",
    signal: "#e8f4ff",
    warm: "#ff9505",
    rust: "#ec4e20",
    cyan: "#4deeea",
    violet: "#f038ff",
    green: "#74ee15",
    amber: "#ffe66d",
    red: "#ff6b6b",
    dim: "rgba(168, 216, 255, 0.20)",
  };

  const PHASES: Phase[] = [
    "hero",
    "streams",
    "pipe",
    "connectors",
    "observe",
    "ecosystem",
    "cta",
  ];

  const LEFT_X = [0.055, 0.08, 0.105, 0.07, 0.095, 0.065];
  const RIGHT_X = [0.945, 0.92, 0.895, 0.93, 0.905, 0.935];

  const STREAM_ROWS: Array<{
    phaseOffset: number;
    left?: string;
    right?: string;
    leftColor?: string;
    rightColor?: string;
  }> = [
    { phaseOffset: -0.065, left: "TOKENS", leftColor: C.signal },
    { phaseOffset: -0.035, right: "TOOLS", rightColor: C.cyan },
    { phaseOffset: -0.005, left: "MEMORY", leftColor: C.green },
    { phaseOffset: 0.025, right: "KNOWLEDGE", rightColor: C.amber },
    { phaseOffset: 0.055, left: "VOICE", leftColor: C.violet },
    { phaseOffset: 0.085, right: "REASONING", rightColor: C.red },
  ];

  const PIPE_ROWS: Array<{
    phaseOffset: number;
    left?: string;
    right?: string;
  }> = [
    { phaseOffset: -0.05, left: "CONTEXT" },
    { phaseOffset: -0.022, right: "BUDGET" },
    { phaseOffset: 0.006, left: "DISPATCH" },
    { phaseOffset: 0.034, right: "STREAM" },
    { phaseOffset: 0.062, left: "MCP" },
    { phaseOffset: 0.09, right: "OBSERVE" },
  ];

  function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  function spinalCordX(py: number): number {
    const cfg = get(canvasConfig);
    const amplitude =
      (reduced ? 16 : 34) * clamp(cfg.spinalActivity ?? 1, 0.8, 1.8);
    return W / 2 + spineBiasX + Math.sin((py / 700) * Math.PI * 2) * amplitude;
  }

  function axonAttachPageY(n: Neuron): number {
    return n.pageFrac * pageHeight + Math.sin(n.seed * 0.17) * 24;
  }

  function depthFog(x: number, y: number): number {
    const dx = Math.abs(x / W - 0.5) * 2;
    const dy = Math.abs(y / H - 0.5) * 2;
    return 1 - Math.min(1, Math.max(dx, dy)) * 0.42;
  }

  function proximity(x: number, y: number): number {
    const dx = x - mouseX;
    const dy = y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 140 ? 1 + (1 - dist / 140) * 1.6 : 1;
  }

  function resolveSectionCenters(): Record<Phase, number> {
    const defaults: Record<Phase, number> = {
      hero: 0.06,
      streams: 0.22,
      pipe: 0.36,
      connectors: 0.5,
      observe: 0.66,
      ecosystem: 0.8,
      cta: 0.93,
    };

    const accum = new Map<Phase, { sum: number; count: number }>();

    document
      .querySelectorAll<HTMLElement>("[data-topology-phase]")
      .forEach((el) => {
        const phase = el.dataset.topologyPhase as Phase | undefined;
        if (!phase || !PHASES.includes(phase)) return;
        const rect = el.getBoundingClientRect();
        const centerY = scrollY + rect.top + rect.height / 2;
        const frac = centerY / Math.max(pageHeight, 1);
        const prev = accum.get(phase);
        if (prev)
          accum.set(phase, { sum: prev.sum + frac, count: prev.count + 1 });
        else accum.set(phase, { sum: frac, count: 1 });
      });

    for (const phase of PHASES) {
      const v = accum.get(phase);
      if (v && v.count > 0)
        defaults[phase] = clamp(v.sum / v.count, 0.04, 0.96);
    }

    defaults.streams = clamp(defaults.streams, defaults.hero + 0.08, 0.4);
    defaults.pipe = clamp(defaults.pipe, defaults.streams + 0.08, 0.55);
    defaults.connectors = clamp(defaults.connectors, defaults.pipe + 0.08, 0.7);
    defaults.observe = clamp(
      defaults.observe,
      defaults.connectors + 0.08,
      0.82,
    );
    defaults.ecosystem = clamp(
      defaults.ecosystem,
      defaults.observe + 0.06,
      0.9,
    );
    defaults.cta = clamp(defaults.cta, defaults.ecosystem + 0.05, 0.97);

    return defaults;
  }

  function phaseColor(phase: Phase): string {
    const cfg = get(canvasConfig);
    switch (phase) {
      case "streams":
        return C.signal;
      case "connectors":
        return C.warm;
      case "cta":
        return C.signal;
      default:
        return cfg.dominantColor ?? C.pipe;
    }
  }

  function buildNeuronLayout() {
    phaseCenters = resolveSectionCenters();

    const rows: Array<{
      frac: number;
      phase: Phase;
      leftLabel?: string;
      rightLabel?: string;
      leftColor?: string;
      rightColor?: string;
    }> = [];

    const pushRow = (
      frac: number,
      phase: Phase,
      leftLabel?: string,
      rightLabel?: string,
      leftColor?: string,
      rightColor?: string,
    ) => {
      rows.push({
        frac: clamp(frac, 0.035, 0.97),
        phase,
        leftLabel,
        rightLabel,
        leftColor,
        rightColor,
      });
    };

    pushRow(phaseCenters.hero - 0.02, "hero", "BRAIN", undefined, C.pipe);
    pushRow(phaseCenters.hero + 0.03, "hero");

    pushRow((phaseCenters.hero + phaseCenters.streams) / 2, "streams");

    for (const row of STREAM_ROWS) {
      pushRow(
        phaseCenters.streams + row.phaseOffset,
        "streams",
        row.left,
        row.right,
        row.leftColor,
        row.rightColor,
      );
    }

    pushRow((phaseCenters.streams + phaseCenters.pipe) / 2, "pipe");

    for (const row of PIPE_ROWS) {
      pushRow(phaseCenters.pipe + row.phaseOffset, "pipe", row.left, row.right);
    }

    pushRow((phaseCenters.pipe + phaseCenters.connectors) / 2, "connectors");
    pushRow(
      phaseCenters.connectors - 0.02,
      "connectors",
      "AUTOMATIC",
      undefined,
      C.warm,
    );
    pushRow(
      phaseCenters.connectors + 0.02,
      "connectors",
      undefined,
      "TARA",
      undefined,
      C.warm,
    );
    pushRow(
      phaseCenters.connectors + 0.06,
      "connectors",
      "YAMA",
      undefined,
      C.rust,
    );

    pushRow(
      (phaseCenters.connectors + phaseCenters.observe) / 2,
      "observe",
      "SDK",
      "TRACE",
    );
    pushRow(phaseCenters.observe + 0.02, "observe");

    pushRow(
      (phaseCenters.observe + phaseCenters.ecosystem) / 2,
      "ecosystem",
      "NETWORK",
      undefined,
    );
    pushRow(phaseCenters.ecosystem + 0.04, "ecosystem");

    pushRow((phaseCenters.ecosystem + phaseCenters.cta) / 2, "cta");
    pushRow(phaseCenters.cta - 0.015, "cta", "CONNECT", undefined, C.signal);

    rows.sort((a, b) => a.frac - b.frac);

    const next: Neuron[] = [];
    let id = 0;

    rows.forEach((row, rowIdx) => {
      const leftX = LEFT_X[rowIdx % LEFT_X.length];
      const rightX = RIGHT_X[rowIdx % RIGHT_X.length];
      const color = phaseColor(row.phase);
      const rowOffset = Math.sin((rowIdx + 1) * 2.13) * 0.022;

      next.push({
        id: `n-${id++}`,
        seed: 1200 + rowIdx * 73,
        xFrac: leftX,
        pageFrac: clamp(row.frac + rowOffset, 0.03, 0.98),
        side: "left",
        phase: row.phase,
        label: row.leftLabel,
        color: row.leftColor ?? color,
      });

      next.push({
        id: `n-${id++}`,
        seed: 2200 + rowIdx * 79,
        xFrac: rightX,
        pageFrac: clamp(row.frac - rowOffset * 1.05, 0.03, 0.98),
        side: "right",
        phase: row.phase,
        label: row.rightLabel,
        color: row.rightColor ?? color,
      });
    });

    neurons = next;
  }

  function initAmbient() {
    const count = reduced ? 10 : 28;
    ambient = Array.from({ length: count }, () => ({
      ox: Math.random() * W,
      oy: Math.random() * H,
      x: 0,
      y: 0,
      ph: Math.random() * Math.PI * 2,
      spd: 0.2 + Math.random() * 0.45,
      r: 0.5 + Math.random() * 1.6,
      op: 0.02 + Math.random() * 0.06,
    }));
  }

  function resize() {
    DPR = reduced ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    pageHeight = Math.max(document.documentElement.scrollHeight, 3000);
    buildNeuronLayout();
    preGenerateDendrites();
    initAmbient();
  }

  function preGenerateDendrites() {
    for (const n of neurons) {
      for (let iter = 2; iter <= 5; iter++) {
        generateNeuronDendrites({
          originX: 0,
          originY: 0,
          seed: n.seed,
          scale: 0.72,
          iterations: iter,
        });
      }
    }
  }

  function setupSectionObservers() {
    sectionObservers.forEach((io) => {
      io.disconnect();
    });
    sectionObservers = [];

    const phaseByElement = new Map<Element, Phase>();
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;

        const winner = visible.reduce((best, entry) =>
          entry.intersectionRatio > best.intersectionRatio ? entry : best,
        );
        activeSection.set(phaseByElement.get(winner.target) ?? "hero");
      },
      { threshold: [0.32, 0.5, 0.68] },
    );

    document
      .querySelectorAll<HTMLElement>("[data-topology-phase]")
      .forEach((el) => {
        const phase = (el.dataset.topologyPhase ?? "hero") as Phase;
        if (!PHASES.includes(phase)) return;
        phaseByElement.set(el, phase);
        io.observe(el);
      });

    sectionObservers.push(io);
  }

  function drawSpinalCord(sy: number) {
    const cfg = get(canvasConfig);
    const color = cfg.dominantColor ?? C.pipe;
    const activity = cfg.spinalActivity ?? 1;

    for (let layer = 0; layer < 4; layer++) {
      ctx.beginPath();
      const steps = 72;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const vy = t * H;
        const py = vy + sy;
        const x = spinalCordX(py);
        if (i === 0) ctx.moveTo(x, vy);
        else ctx.lineTo(x, vy);
      }

      if (layer === 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 13;
        ctx.globalAlpha = 0.05 * activity;
      } else if (layer === 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.22 * activity;
      } else if (layer === 2) {
        ctx.strokeStyle = C.signal;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.28;
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 0.6;
        ctx.globalAlpha = 0.2;
      }

      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  function drawAxons(sy: number) {
    const cfg = get(canvasConfig);

    for (const n of neurons) {
      const pageY = n.pageFrac * pageHeight;
      const vy = pageY - sy;
      if (vy < -260 || vy > H + 260) continue;

      const x = n.xFrac * W;
      const attachPageY = axonAttachPageY(n);
      const attachVY = attachPageY - sy;
      const cordX = spinalCordX(attachPageY);
      const cpX = lerp(x, cordX, 0.52);
      const cpY = lerp(vy, attachVY, 0.5) + (n.side === "left" ? -30 : 30);

      const p = proximity(x, vy);
      const baseColor = n.color ?? cfg.dominantColor ?? C.pipe;
      const centerLane = Math.abs(vy - H / 2) < H * 0.28 ? 0.35 : 1;

      ctx.beginPath();
      ctx.moveTo(x, vy);
      ctx.quadraticCurveTo(cpX, cpY, cordX, attachVY);
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 0.95;
      ctx.globalAlpha = 0.08 * p * centerLane;
      ctx.lineCap = "round";
      ctx.stroke();

      if (!reduced) {
        ctx.beginPath();
        ctx.moveTo(x, vy);
        ctx.quadraticCurveTo(cpX, cpY, cordX, attachVY);
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 3.4;
        ctx.globalAlpha = 0.012 * p * centerLane;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, vy, reduced ? 2.7 : 4.2, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(x, vy, 0, x, vy, reduced ? 10 : 16);
      grad.addColorStop(0, baseColor);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.75;
      ctx.fill();

      if (n.label) {
        ctx.font = "600 10px 'JetBrains Mono', monospace";
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 0.72;
        ctx.textAlign = n.side === "left" ? "right" : "left";
        ctx.fillText(n.label, x + (n.side === "left" ? -14 : 14), vy + 3);
      }
    }
  }

  function drawDendrites(sy: number) {
    const cfg = get(canvasConfig);

    for (const n of neurons) {
      const pageY = n.pageFrac * pageHeight;
      const vy = pageY - sy;
      if (vy < -420 || vy > H + 420) continue;

      const x = n.xFrac * W;
      const distFromCenter = Math.abs(vy - H / 2);
      const growthT = Math.max(0, 1 - distFromCenter / (H * 0.7));
      const iterMax = reduced ? 3 : 5;
      const iterations = Math.round(lerp(2, iterMax, growthT));

      const branches = generateNeuronDendrites({
        originX: 0,
        originY: 0,
        seed: n.seed,
        scale: 0.72,
        iterations,
      });

      const rotAngle = n.side === "left" ? -Math.PI / 2 : Math.PI / 2;
      const c = n.color ?? cfg.dominantColor ?? C.pipe;
      const localAlpha = clamp((cfg.branchGrowth ?? 3) / 5, 0.55, 1);

      ctx.save();
      ctx.beginPath();
      if (n.side === "left") ctx.rect(0, 0, W * 0.3, H);
      else ctx.rect(W * 0.7, 0, W * 0.3, H);
      ctx.clip();

      ctx.translate(x, vy);
      ctx.rotate(rotAngle);

      for (const b of branches) {
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.strokeStyle = c;
        ctx.lineWidth = Math.max(0.35, b.thickness * 2.7);
        ctx.lineCap = "round";
        ctx.globalAlpha = b.opacity * 0.34 * growthT * localAlpha;
        ctx.stroke();

        if (!reduced && b.isAxon) {
          ctx.globalAlpha = b.opacity * 0.14 * growthT * localAlpha;
          ctx.lineWidth = b.thickness * 5.2;
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }

  function drawSynapses(sy: number) {
    const cfg = get(canvasConfig);
    for (const n of neurons) {
      const attachPY = axonAttachPageY(n);
      const vy = attachPY - sy;
      if (vy < -70 || vy > H + 70) continue;

      const x = spinalCordX(attachPY);
      const c = n.color ?? cfg.dominantColor ?? C.pipe;
      const p = proximity(x, vy);

      ctx.beginPath();
      ctx.arc(x, vy, reduced ? 4 : 5.5, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.shadowBlur = 12;
      ctx.globalAlpha = 0.3 * p;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(x, vy, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.8;
      ctx.fill();
    }
  }

  function drawGatewayClusters(sy: number) {
    const providerY = (phaseCenters.hero - 0.03) * pageHeight;
    const providerVY = providerY - sy;
    const providerFracs = [0.16, 0.29, 0.42, 0.58, 0.71, 0.84];
    const providerLabels = [
      "anthropic",
      "openai",
      "gemini",
      "bedrock",
      "mistral",
      "···",
    ];

    if (providerVY > -160 && providerVY < H + 100) {
      const sx = spinalCordX(providerY);
      for (let i = 0; i < providerFracs.length; i++) {
        const ex = providerFracs[i] * W;
        const ey = providerVY - (38 + Math.sin(i * 1.6) * 12);
        const cpx = lerp(sx, ex, 0.45);
        const cpy = providerVY - 36;

        ctx.beginPath();
        ctx.moveTo(sx, providerVY);
        ctx.quadraticCurveTo(cpx, cpy, ex, ey);
        ctx.strokeStyle = C.sky;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = C.signal;
        ctx.globalAlpha = 0.65;
        ctx.fill();

        ctx.font = "500 10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = C.sky;
        ctx.globalAlpha = 0.68;
        ctx.fillText(providerLabels[i], ex, ey - 10);
      }
    }

    const connectorY = (phaseCenters.connectors + 0.065) * pageHeight;
    const connectorVY = connectorY - sy;
    const connectorFracs = [0.24, 0.5, 0.76];
    const connectorLabels = ["automatic", "tara", "yama"];
    const connectorColors = [C.warm, C.warm, C.rust];

    if (connectorVY > -120 && connectorVY < H + 180) {
      const sx = spinalCordX(connectorY);
      for (let i = 0; i < connectorFracs.length; i++) {
        const ex = connectorFracs[i] * W;
        const ey = connectorVY + (36 + Math.cos(i * 1.7) * 10);
        const cpx = lerp(sx, ex, 0.48);
        const cpy = connectorVY + 30;
        const color = connectorColors[i];

        ctx.beginPath();
        ctx.moveTo(sx, connectorVY);
        ctx.quadraticCurveTo(cpx, cpy, ex, ey);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.3;
        ctx.globalAlpha = 0.34;
        ctx.stroke();

        if (!reduced) {
          ctx.beginPath();
          ctx.moveTo(sx, connectorVY);
          ctx.quadraticCurveTo(cpx, cpy, ex, ey);
          ctx.strokeStyle = color;
          ctx.lineWidth = 4.2;
          ctx.globalAlpha = 0.08;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.globalAlpha = 0.72;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = "600 10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.78;
        ctx.fillText(connectorLabels[i], ex, ey + 16);
      }
    }
  }

  function evalAxonBezier(
    neuronIdx: number,
    actualT: number,
  ): {
    x: number;
    pageY: number;
  } {
    const n = neurons[neuronIdx];
    const somaX = n.xFrac * W;
    const somaPageY = n.pageFrac * pageHeight;
    const attachPageY = axonAttachPageY(n);
    const cordX = spinalCordX(attachPageY);
    const cpX = (somaX + cordX) / 2;
    const cpPageY =
      lerp(somaPageY, attachPageY, 0.5) + (n.side === "left" ? -30 : 30);
    const t = actualT;

    return {
      x: (1 - t) * (1 - t) * somaX + 2 * (1 - t) * t * cpX + t * t * cordX,
      pageY:
        (1 - t) * (1 - t) * somaPageY +
        2 * (1 - t) * t * cpPageY +
        t * t * attachPageY,
    };
  }

  function spawnAxonSig(neuronIdx: number, direction: "to-cord" | "from-cord") {
    if (
      signals.some(
        (s) =>
          s.kind === "axon" &&
          s.neuronIdx === neuronIdx &&
          s.direction === direction,
      )
    ) {
      return;
    }

    const n = neurons[neuronIdx];
    const cfg = get(canvasConfig);
    signals.push({
      kind: "axon",
      neuronIdx,
      t: 0,
      speed: 0.006 + Math.random() * 0.008,
      color: n.color ?? cfg.dominantColor ?? C.signal,
      direction,
    });
  }

  function spawnSpinalSig(startPY?: number) {
    const cfg = get(canvasConfig);
    const py = startPY ?? 0.08 * pageHeight + Math.random() * 0.84 * pageHeight;
    const direction = (Math.random() < 0.5 ? 1 : -1) as 1 | -1;

    signals.push({
      kind: "spinal",
      py,
      direction,
      speed: 0.95 + Math.random() * 1.6,
      color: cfg.dominantColor ?? C.signal,
      trailDist: 15 + Math.random() * 18,
      distTraveled: 0,
      maxDist: (0.08 + Math.random() * 0.14) * pageHeight,
      spawnedAxon: false,
    });
  }

  function renderAxonSig(sig: AxonSig, sy: number) {
    const n = neurons[sig.neuronIdx];
    if (!n) return;

    const somaVY = n.pageFrac * pageHeight - sy;
    if (somaVY < -300 || somaVY > H + 300) return;

    const actualT = sig.direction === "to-cord" ? sig.t : 1 - sig.t;
    const head = evalAxonBezier(sig.neuronIdx, actualT);
    const headVY = head.pageY - sy;
    if (headVY < -60 || headVY > H + 60) return;

    if (!reduced && sig.t > 0.05) {
      const trailActualT =
        sig.direction === "to-cord"
          ? Math.max(0, actualT - 0.09)
          : Math.min(1, actualT + 0.09);

      const steps = 8;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = trailActualT + (actualT - trailActualT) * (i / steps);
        const pt = evalAxonBezier(sig.neuronIdx, t);
        if (i === 0) ctx.moveTo(pt.x, pt.pageY - sy);
        else ctx.lineTo(pt.x, pt.pageY - sy);
      }
      ctx.strokeStyle = sig.color;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = 0.45;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(head.x, headVY, 3.1, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = sig.color;
    ctx.shadowBlur = 15;
    ctx.globalAlpha = 0.95;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function renderSpinalSig(sig: SpinalSig, sy: number) {
    const vy = sig.py - sy;
    if (vy < -60 || vy > H + 60) return;

    const x = spinalCordX(sig.py);

    if (!reduced) {
      const trailPY = sig.py - sig.direction * sig.trailDist;
      const steps = 11;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const py = trailPY + (sig.py - trailPY) * t;
        const vx = spinalCordX(py);
        const y = py - sy;
        if (i === 0) ctx.moveTo(vx, y);
        else ctx.lineTo(vx, y);
      }
      ctx.strokeStyle = sig.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.42;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(x, vy, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = sig.color;
    ctx.shadowBlur = 16;
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function renderSignals(sy: number) {
    const cfg = get(canvasConfig);
    const maxSig = reduced ? 5 : Math.round((cfg.signalDensity ?? 10) * 0.9);
    const spawnChance = reduced ? 0.012 : 0.05;

    if (signals.length < maxSig && Math.random() < spawnChance) {
      const candidates = neurons
        .map((n, i) => ({ idx: i, vy: n.pageFrac * pageHeight - sy }))
        .filter(({ vy }) => vy > -380 && vy < H + 380);

      if (candidates.length > 0 && Math.random() < 0.66) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        spawnAxonSig(pick.idx, "to-cord");
      } else {
        spawnSpinalSig();
      }
    }

    const speedMul =
      (cfg.particleSpeed ?? 1) * (1 + clamp(smoothedVelocity, 0, 28) * 0.004);

    const toSpawn: Array<
      | { type: "axon"; idx: number; dir: "to-cord" | "from-cord" }
      | { type: "spinal"; py: number }
    > = [];

    for (const sig of signals) {
      if (sig.kind === "axon") {
        sig.t = Math.min(1, sig.t + sig.speed * speedMul);

        if (sig.direction === "to-cord" && sig.t >= 1) {
          const n = neurons[sig.neuronIdx];
          if (n) toSpawn.push({ type: "spinal", py: axonAttachPageY(n) });
        }
      } else {
        const step = sig.speed * speedMul;
        sig.py += sig.direction * step;
        sig.distTraveled += step;

        if (!sig.spawnedAxon && sig.distTraveled > sig.maxDist * 0.42) {
          for (let i = 0; i < neurons.length; i++) {
            const nPY = axonAttachPageY(neurons[i]);
            if (Math.abs(nPY - sig.py) < 130 && Math.random() < 0.26) {
              toSpawn.push({ type: "axon", idx: i, dir: "from-cord" });
              sig.spawnedAxon = true;
              break;
            }
          }
        }
      }
    }

    for (const s of toSpawn) {
      if (s.type === "spinal") spawnSpinalSig(s.py);
      else spawnAxonSig(s.idx, s.dir);
    }

    signals = signals.filter((s) =>
      s.kind === "axon" ? s.t < 1 : s.distTraveled < s.maxDist,
    );

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";

    for (const sig of signals) {
      if (sig.kind === "axon") renderAxonSig(sig, sy);
      else renderSpinalSig(sig, sy);
    }

    ctx.restore();
  }

  function drawAmbient(sy: number) {
    const speedFactor = reduced ? 0.3 : 1;

    for (const a of ambient) {
      a.ph += 0.003 * a.spd * speedFactor;
      a.x = a.ox + Math.sin(a.ph) * 25;
      a.y = a.oy + Math.cos(a.ph * 0.8) * 18;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = C.sky;
      ctx.globalAlpha = a.op * depthFog(a.x, a.y + sy * 0.08);
      ctx.fill();
    }
  }

  function drawHeartbeat(sy: number, time: number) {
    const ctaY = phaseCenters.cta * pageHeight;
    const heroY = phaseCenters.hero * pageHeight;
    const pulseY = lerp(heroY, ctaY, (((time * 0.00008) % 1) + 1) % 1);
    const vy = pulseY - sy;
    if (vy < -120 || vy > H + 120) return;

    const x = spinalCordX(pulseY);
    const r = reduced ? 18 : 28;

    const grad = ctx.createRadialGradient(x, vy, 0, x, vy, r);
    grad.addColorStop(0, "rgba(232, 244, 255, 0.55)");
    grad.addColorStop(0.4, "rgba(1, 144, 224, 0.25)");
    grad.addColorStop(1, "transparent");

    ctx.beginPath();
    ctx.arc(x, vy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.45;
    ctx.fill();
  }

  function drawLegibilityVeil() {
    const section = get(activeSection) as Phase;
    if (section === "connectors" || section === "streams") return;
    ctx.save();
    ctx.globalAlpha = 1;

    const masks: Array<{
      x: number;
      y: number;
      rx: number;
      ry: number;
      alpha: number;
    }> = [];

    if (section === "hero") {
      masks.push({ x: 0.5, y: 0.44, rx: 0.34, ry: 0.22, alpha: 0.22 });
      masks.push({ x: 0.5, y: 0.6, rx: 0.26, ry: 0.14, alpha: 0.16 });
    } else if (section === "pipe" || section === "observe") {
      masks.push({ x: 0.5, y: 0.47, rx: 0.31, ry: 0.18, alpha: 0.16 });
    } else if (section === "ecosystem" || section === "cta") {
      masks.push({ x: 0.5, y: 0.42, rx: 0.3, ry: 0.17, alpha: 0.14 });
    } else {
      masks.push({ x: 0.5, y: 0.46, rx: 0.28, ry: 0.16, alpha: 0.12 });
    }

    for (const m of masks) {
      const cx = m.x * W;
      const cy = m.y * H;
      const rx = m.rx * W;
      const ry = m.ry * H;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      g.addColorStop(0, `rgba(9, 12, 18, ${m.alpha})`);
      g.addColorStop(0.62, `rgba(9, 12, 18, ${m.alpha * 0.36})`);
      g.addColorStop(1, "rgba(9, 12, 18, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
    }

    ctx.restore();
  }

  function render(time: number) {
    scrollY = window.scrollY;
    pageHeight = Math.max(document.documentElement.scrollHeight, 3000);
    const section = get(activeSection) as Phase;
    const heroBiasTarget = W >= 1024 && section === "hero" ? W * 0.05 : 0;
    spineBiasX = lerp(spineBiasX, heroBiasTarget, 0.08);

    const rawVel = Math.abs(scrollY - prevScrollY);
    smoothedVelocity = lerp(smoothedVelocity, rawVel, 0.13);
    prevScrollY = scrollY;

    scrollVelocity.set(smoothedVelocity);
    if (pageHeight > H) scrollProgress.set(scrollY / (pageHeight - H));

    if (Math.abs(pageHeight - lastKnownHeight) > 160) {
      lastKnownHeight = pageHeight;
      buildNeuronLayout();
      preGenerateDendrites();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(4, 8, 14, 0.17)";
    ctx.fillRect(0, 0, W, H);

    drawSpinalCord(scrollY);
    drawGatewayClusters(scrollY);
    drawAxons(scrollY);
    drawSynapses(scrollY);
    drawDendrites(scrollY);
    drawAmbient(scrollY);
    renderSignals(scrollY);
    drawHeartbeat(scrollY, time);
    drawLegibilityVeil();

    let near = false;
    for (const n of neurons) {
      const vy = n.pageFrac * pageHeight - scrollY;
      if (vy < -150 || vy > H + 150) continue;
      const x = n.xFrac * W;
      if (proximity(x, vy) > 1.1) {
        near = true;
        break;
      }
    }
    document.body.dataset.cursorNear = near ? "true" : "false";

    raf = requestAnimationFrame(render);
  }

  let lastKnownHeight = 0;

  onMount(() => {
    ctx = canvas.getContext("2d")!;
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollY = window.scrollY;
    prevScrollY = scrollY;

    resize();
    window.addEventListener("resize", resize);
    onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);

    setTimeout(setupSectionObservers, 120);

    lastKnownHeight = pageHeight;
    if (signals.length === 0) {
      for (let i = 0; i < (reduced ? 2 : 5); i++) spawnSpinalSig();
    }

    raf = requestAnimationFrame(render);
  });

  onDestroy(() => {
    if (typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(raf);
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", resize);
      if (onMouseMove) window.removeEventListener("mousemove", onMouseMove);
    }
    sectionObservers.forEach((io) => {
      io.disconnect();
    });
    document.body.dataset.cursorNear = "false";
  });
</script>

<canvas
  bind:this={canvas}
  class="fixed inset-0 pointer-events-none"
  style="z-index:-2"
  aria-hidden="true"
></canvas>
<div
  class="fixed inset-0 pointer-events-none"
  style="z-index:-1; background: radial-gradient(ellipse 92% 74% at 50% 50%, transparent 0%, rgba(16, 20, 26, 0.86) 100%);"
></div>
