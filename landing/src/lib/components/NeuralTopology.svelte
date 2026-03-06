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

  // --- Reactive state (Svelte 5 runes) ---
  let mouseX = $state(-9999);
  let mouseY = $state(-9999);
  let reduced = $state(false);

  // --- Canvas ---
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let raf: number;
  let W = 0,
    H = 0,
    DPR = 1;

  // --- Scroll state ---
  let scrollY = 0;
  let prevScrollY = 0;
  let pageHeight = 3000;
  let smoothedVelocity = 0;
  let sectionObservers: IntersectionObserver[] = [];

  // --- Colors ---
  const C = {
    sky: "#00d2ff",
    signal: "#00f0ff",
    bright: "#ffffff",
    dim: "rgba(0, 210, 255, 0.15)",
  };

  // --- Bilateral neuron layout (13 pairs along the spinal cord) ---
  type Neuron = {
    seed: number;
    xFrac: number;
    pageFrac: number;
    side: "left" | "right";
  };

  const NEURONS: Neuron[] = [
    { seed: 1337, xFrac: 0.06, pageFrac: 0.05, side: "left" },
    { seed: 2048, xFrac: 0.94, pageFrac: 0.05, side: "right" },
    { seed: 7007, xFrac: 0.08, pageFrac: 0.12, side: "left" },
    { seed: 3001, xFrac: 0.92, pageFrac: 0.12, side: "right" },
    { seed: 4096, xFrac: 0.07, pageFrac: 0.19, side: "left" },
    { seed: 8008, xFrac: 0.93, pageFrac: 0.19, side: "right" },
    { seed: 5555, xFrac: 0.09, pageFrac: 0.27, side: "left" },
    { seed: 6789, xFrac: 0.91, pageFrac: 0.27, side: "right" },
    { seed: 9009, xFrac: 0.06, pageFrac: 0.35, side: "left" },
    { seed: 7654, xFrac: 0.94, pageFrac: 0.35, side: "right" },
    { seed: 8888, xFrac: 0.08, pageFrac: 0.43, side: "left" },
    { seed: 1110, xFrac: 0.92, pageFrac: 0.43, side: "right" },
    { seed: 9001, xFrac: 0.07, pageFrac: 0.51, side: "left" },
    { seed: 1001, xFrac: 0.93, pageFrac: 0.51, side: "right" },
    { seed: 2220, xFrac: 0.09, pageFrac: 0.59, side: "left" },
    { seed: 2002, xFrac: 0.91, pageFrac: 0.59, side: "right" },
    { seed: 3003, xFrac: 0.07, pageFrac: 0.67, side: "left" },
    { seed: 3330, xFrac: 0.93, pageFrac: 0.67, side: "right" },
    { seed: 4004, xFrac: 0.08, pageFrac: 0.75, side: "left" },
    { seed: 5005, xFrac: 0.92, pageFrac: 0.75, side: "right" },
    { seed: 4440, xFrac: 0.07, pageFrac: 0.83, side: "left" },
    { seed: 6006, xFrac: 0.93, pageFrac: 0.83, side: "right" },
    { seed: 7771, xFrac: 0.09, pageFrac: 0.91, side: "left" },
    { seed: 8882, xFrac: 0.91, pageFrac: 0.91, side: "right" },
    { seed: 9993, xFrac: 0.06, pageFrac: 0.97, side: "left" },
    { seed: 1114, xFrac: 0.94, pageFrac: 0.97, side: "right" },
  ];

  // --- Signal types ---

  // AxonSig: travels along the bezier axon fiber (soma ↔ spinal cord)
  // t always increments 0→1; actualT differs per direction
  type AxonSig = {
    kind: "axon";
    neuronIdx: number;
    t: number; // journey progress 0→1
    speed: number; // Δt per frame
    color: string;
    direction: "to-cord" | "from-cord";
  };

  // SpinalSig: travels along the central sine-wave spinal cord
  type SpinalSig = {
    kind: "spinal";
    py: number; // current page-space Y
    direction: 1 | -1;
    speed: number;
    color: string;
    trailDist: number;
    distTraveled: number;
    maxDist: number;
    spawnedAxon: boolean; // prevent duplicate chain spawns
  };

  type Signal = AxonSig | SpinalSig;
  let signals: Signal[] = [];

  // --- Ambient Floating Cells ---
  type Amb = {
    ox: number;
    oy: number;
    x: number;
    y: number;
    ph: number;
    spd: number;
    r: number;
    op: number;
  };
  let ambient: Amb[] = [];

  // --- Helpers ---
  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  /** X coordinate on the spinal cord sine wave at page-Y `py`. */
  function spinalCordX(py: number): number {
    return W / 2 + Math.sin((py / 700) * Math.PI * 2) * (reduced ? 20 : 45);
  }

  function depthFog(x: number, y: number): number {
    const dx = Math.abs(x / W - 0.5) * 2;
    const dy = Math.abs(y / H - 0.5) * 2;
    return 1 - Math.min(1, Math.max(dx, dy)) * 0.4;
  }

  function proximity(x: number, y: number): number {
    const dx = x - mouseX,
      dy = y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 150 ? 1 + (1 - dist / 150) * 1.5 : 1;
  }

  /**
   * Evaluate the axon quadratic bezier at parameter `actualT`.
   * soma is at actualT=0, cord attachment is at actualT=1.
   */
  function evalAxonBezier(
    neuronIdx: number,
    actualT: number,
  ): { x: number; pageY: number } {
    const n = NEURONS[neuronIdx];
    const somaX = n.xFrac * W;
    const somaPageY = n.pageFrac * pageHeight;
    const cordX = spinalCordX(somaPageY);
    const cpX = (somaX + cordX) / 2;
    const cpPageY = somaPageY + (n.side === "left" ? -24 : 24);
    const t = actualT;
    return {
      x: (1 - t) * (1 - t) * somaX + 2 * (1 - t) * t * cpX + t * t * cordX,
      pageY:
        (1 - t) * (1 - t) * somaPageY +
        2 * (1 - t) * t * cpPageY +
        t * t * somaPageY,
    };
  }

  function initAmbient() {
    const n = reduced ? 8 : 25;
    ambient = Array.from({ length: n }, () => ({
      ox: Math.random() * W,
      oy: Math.random() * H,
      x: 0,
      y: 0,
      ph: Math.random() * Math.PI * 2,
      spd: 0.2 + Math.random() * 0.4,
      r: 0.6 + Math.random() * 1.5,
      op: 0.03 + Math.random() * 0.06,
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
    ctx.scale(DPR, DPR);
    initAmbient();
  }

  /** Pre-warm L-System dendrite cache for all neurons and iterations. */
  function preGenerateDendrites() {
    for (const n of NEURONS) {
      for (let iter = 2; iter <= 5; iter++) {
        generateNeuronDendrites({
          originX: 0,
          originY: 0,
          seed: n.seed,
          scale: 0.7,
          iterations: iter,
        });
      }
    }
  }

  function setupSectionObservers() {
    sectionObservers.forEach((io) => io.disconnect());
    sectionObservers = [];
    document
      .querySelectorAll<HTMLElement>("[data-topology-phase]")
      .forEach((el) => {
        const phase = el.dataset.topologyPhase ?? "hero";
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) activeSection.set(phase);
            });
          },
          { threshold: 0.3 },
        );
        io.observe(el);
        sectionObservers.push(io);
      });
  }

  // ─── Draw: Spinal Cord ────────────────────────────────────────────────────

  function drawSpinalCord(sy: number) {
    const cfg = get(canvasConfig);
    const amplitude = reduced ? 20 : 45;
    const period = 700;
    const cx = W / 2;
    const activity = cfg.spinalActivity ?? 1;
    const color = cfg.dominantColor ?? C.sky;

    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const vy = t * H;
        const py = vy + sy;
        const x = cx + Math.sin((py / period) * Math.PI * 2) * amplitude;
        if (i === 0) ctx.moveTo(x, vy);
        else ctx.lineTo(x, vy);
      }
      if (layer === 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 10;
        ctx.globalAlpha = 0.04 * activity;
      } else if (layer === 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.2 * activity;
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.12 * activity;
      }
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  // ─── Draw: Dendritic Trees ────────────────────────────────────────────────

  /**
   * Draw each neuron's L-System dendritic tree, rotated outward from
   * the spinal cord. Left-side neurons face LEFT; right-side face RIGHT.
   */
  function drawDendrites(sy: number) {
    const cfg = get(canvasConfig);
    const color = cfg.dominantColor ?? C.sky;
    const baseOpacity = cfg.branchGrowth
      ? Math.min(cfg.branchGrowth / 5, 1) * 0.2
      : 0.15;

    for (const n of NEURONS) {
      const pageY = n.pageFrac * pageHeight;
      const viewportY = pageY - sy;
      if (viewportY < -450 || viewportY > H + 450) continue;

      const viewportX = n.xFrac * W;
      const distFromCenter = Math.abs(viewportY - H / 2);
      const growthT = Math.max(0, 1 - distFromCenter / (H * 0.65));
      const iterations = Math.round(lerp(2, reduced ? 3 : 5, growthT));

      const branches = generateNeuronDendrites({
        originX: 0,
        originY: 0,
        seed: n.seed,
        scale: 0.7,
        iterations,
      });

      // Rotate so dendrites face outward (away from spinal cord).
      // L-System default grows UP (-π/2). Rotating by ±π/2 makes it face
      // LEFT (for left neurons) or RIGHT (for right neurons).
      const rotAngle = n.side === "left" ? -Math.PI / 2 : Math.PI / 2;

      ctx.save();
      // Clip dendrites to the outer 22% of the viewport on each side.
      // This prevents L-System branches from bleeding into the content area
      // regardless of how many iterations produce inward-curving branches.
      ctx.beginPath();
      if (n.side === "left") {
        ctx.rect(0, 0, W * 0.22, H);
      } else {
        ctx.rect(W * 0.78, 0, W * 0.22, H);
      }
      ctx.clip();
      ctx.translate(viewportX, viewportY);
      ctx.rotate(rotAngle);

      for (const b of branches) {
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(0.3, b.thickness * 2.5);
        ctx.lineCap = "round";
        ctx.globalAlpha = b.opacity * baseOpacity * growthT;
        ctx.stroke();

        // Subtle inner glow on main trunk branches (depth < 2)
        if (b.isAxon && !reduced) {
          ctx.globalAlpha = b.opacity * baseOpacity * growthT * 0.3;
          ctx.lineWidth = b.thickness * 5;
          ctx.stroke();
        }
      }

      ctx.restore();

      // Soma (cell body dot) — drawn in viewport space after restore
      const somaR = reduced ? 3 : 5;
      ctx.beginPath();
      ctx.arc(viewportX, viewportY, somaR, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(
        viewportX,
        viewportY,
        0,
        viewportX,
        viewportY,
        somaR * 3,
      );
      grad.addColorStop(0, color);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.7 * growthT;
      ctx.fill();
    }
  }

  // ─── Signals: Spawn ───────────────────────────────────────────────────────

  function spawnAxonSig(neuronIdx: number, direction: "to-cord" | "from-cord") {
    // Prevent duplicate signals on the same neuron + direction
    if (
      signals.some(
        (s) =>
          s.kind === "axon" &&
          s.neuronIdx === neuronIdx &&
          s.direction === direction,
      )
    )
      return;
    const cfg = get(canvasConfig);
    signals.push({
      kind: "axon",
      neuronIdx,
      t: 0,
      speed: 0.006 + Math.random() * 0.007, // 0→1 in ~70-160 frames (≈1.2–2.7s)
      color: cfg.dominantColor ?? C.signal,
      direction,
    });
  }

  function spawnSpinalSig(startPY?: number) {
    const py = startPY ?? 0.1 * pageHeight + Math.random() * 0.8 * pageHeight;
    const direction = (Math.random() < 0.5 ? 1 : -1) as 1 | -1;
    const cfg = get(canvasConfig);
    signals.push({
      kind: "spinal",
      py,
      direction,
      speed: 1.0 + Math.random() * 1.5,
      color: cfg.dominantColor ?? C.signal,
      trailDist: 16 + Math.random() * 18,
      distTraveled: 0,
      maxDist: (0.08 + Math.random() * 0.14) * pageHeight,
      spawnedAxon: false,
    });
  }

  // ─── Signals: Render ──────────────────────────────────────────────────────

  function renderAxonSig(sig: AxonSig, sy: number) {
    const n = NEURONS[sig.neuronIdx];
    const somaVY = n.pageFrac * pageHeight - sy;
    if (somaVY < -300 || somaVY > H + 300) return;

    // bezier param: soma=0, cord=1 — for from-cord we traverse in reverse
    const actualT = sig.direction === "to-cord" ? sig.t : 1 - sig.t;

    const head = evalAxonBezier(sig.neuronIdx, actualT);
    const headVY = head.pageY - sy;
    if (headVY < -60 || headVY > H + 60) return;

    // Signals only appear near the soma (outer 12% of screen).
    // This confines the "neuron firing" effect to the margins and prevents
    // any bright line from crossing into the main content/text area.
    const headXFrac = head.x / W;
    const marginFade =
      n.side === "left"
        ? Math.max(0, 1 - (headXFrac - 0.04) / 0.08) // visible xFrac 0.04 → 0.12
        : Math.max(0, 1 - (0.96 - headXFrac) / 0.08); // visible xFrac 0.96 → 0.88
    if (marginFade <= 0) return;

    const fadeIn = Math.min(1, sig.t / 0.06) * marginFade;

    // Trail — short bezier segment behind the signal head
    if (!reduced && sig.t > 0.05) {
      const trailActualT =
        sig.direction === "to-cord"
          ? Math.max(0, actualT - 0.08)
          : Math.min(1, actualT + 0.08);

      const steps = 8;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = trailActualT + (actualT - trailActualT) * (i / steps);
        const pt = evalAxonBezier(sig.neuronIdx, t);
        if (i === 0) ctx.moveTo(pt.x, pt.pageY - sy);
        else ctx.lineTo(pt.x, pt.pageY - sy);
      }
      ctx.strokeStyle = sig.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = fadeIn * 0.42;
      ctx.stroke();
    }

    // Glowing head dot
    ctx.beginPath();
    ctx.arc(head.x, headVY, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = sig.color;
    ctx.shadowBlur = 14;
    ctx.globalAlpha = fadeIn;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function renderSpinalSig(sig: SpinalSig, sy: number) {
    const headVY = sig.py - sy;
    if (headVY < -60 || headVY > H + 60) return;

    const headX = spinalCordX(sig.py);
    const fadeIn = Math.min(1, sig.distTraveled / 18);

    if (!reduced) {
      const trailPY = sig.py - sig.direction * sig.trailDist;
      const steps = 12;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const py = trailPY + (sig.py - trailPY) * t;
        const vx = spinalCordX(py);
        const vy = py - sy;
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.strokeStyle = sig.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = fadeIn * 0.38;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(headX, headVY, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = sig.color;
    ctx.shadowBlur = 16;
    ctx.globalAlpha = fadeIn;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ─── Signals: Advance + Chain ─────────────────────────────────────────────

  function renderSignals(sy: number) {
    const cfg = get(canvasConfig);
    const maxSig = reduced ? 4 : 18;
    const spawnChance = reduced ? 0.015 : 0.055;

    // Auto-spawn when below capacity
    if (signals.length < maxSig && Math.random() < spawnChance) {
      const candidates = NEURONS.map((n, i) => ({
        idx: i,
        vy: n.pageFrac * pageHeight - sy,
      })).filter(({ vy }) => vy > -400 && vy < H + 400);

      if (candidates.length > 0 && Math.random() < 0.68) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        spawnAxonSig(pick.idx, "to-cord");
      } else {
        spawnSpinalSig();
      }
    }

    const speedMul = (cfg.particleSpeed ?? 1) * (1 + smoothedVelocity * 0.004);

    // Collect chain spawns outside the advance loop to avoid mutation during iteration
    const toSpawn: Array<
      | { type: "axon"; idx: number; dir: "to-cord" | "from-cord" }
      | { type: "spinal"; py: number }
    > = [];

    for (const sig of signals) {
      if (sig.kind === "axon") {
        sig.t = Math.min(1, sig.t + sig.speed * speedMul);

        // Chain: axon arrives at cord → fire spinal signal
        if (sig.direction === "to-cord" && sig.t >= 1) {
          const n = NEURONS[sig.neuronIdx];
          toSpawn.push({ type: "spinal", py: n.pageFrac * pageHeight });
        }
      } else {
        const step = sig.speed * speedMul;
        sig.py += sig.direction * step;
        sig.distTraveled += step;

        // Chain: spinal signal passes a neuron junction → fire from-cord axon
        if (!sig.spawnedAxon && sig.distTraveled > sig.maxDist * 0.42) {
          for (let i = 0; i < NEURONS.length; i++) {
            const nPY = NEURONS[i].pageFrac * pageHeight;
            if (Math.abs(nPY - sig.py) < 130 && Math.random() < 0.28) {
              toSpawn.push({ type: "axon", idx: i, dir: "from-cord" });
              sig.spawnedAxon = true;
              break;
            }
          }
        }
      }
    }

    // Apply chain spawns
    for (const s of toSpawn) {
      if (s.type === "spinal") spawnSpinalSig(s.py);
      else spawnAxonSig(s.idx, s.dir);
    }

    // Remove finished signals
    signals = signals.filter((s) =>
      s.kind === "axon" ? s.t < 1 : s.distTraveled < s.maxDist,
    );

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";

    for (const sig of signals) {
      if (sig.kind === "axon") {
        renderAxonSig(sig, sy);
      } else {
        renderSpinalSig(sig, sy);
      }
    }

    ctx.restore();
  }

  // ─── Main Render Loop ─────────────────────────────────────────────────────

  function render(_time: number) {
    scrollY = window.scrollY;
    pageHeight = document.documentElement.scrollHeight;

    const rawVel = Math.abs(scrollY - prevScrollY);
    smoothedVelocity = lerp(smoothedVelocity, rawVel, 0.12);
    prevScrollY = scrollY;

    scrollVelocity.set(smoothedVelocity);
    if (pageHeight > H) scrollProgress.set(scrollY / (pageHeight - H));

    // Fade previous frame (creates motion trails)
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(5, 8, 15, 0.20)";
    ctx.fillRect(0, 0, W, H);

    const speedFactor = reduced ? 0.3 : 1;

    // 1. Spinal cord (central vertical axis)
    drawSpinalCord(scrollY);

    // 2. Dendritic trees (rotated outward per side, clipped to outer 22%)
    drawDendrites(scrollY);

    // 4. Ambient micro-particles
    for (const a of ambient) {
      a.ph += 0.003 * a.spd * speedFactor;
      a.x = a.ox + Math.sin(a.ph) * 25;
      a.y = a.oy + Math.cos(a.ph * 0.8) * 18;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = C.sky;
      ctx.globalAlpha = a.op * depthFog(a.x, a.y);
      ctx.fill();
    }

    // 5. Signals (screen blend — on top of structural elements)
    renderSignals(scrollY);

    // 6. Cursor proximity hint
    const m = proximity(mouseX, mouseY);
    document.body.dataset.cursorNear = m > 1.0 ? "true" : "false";

    raf = requestAnimationFrame(render);
  }

  onMount(() => {
    ctx = canvas.getContext("2d")!;
    reduced = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    resize();
    preGenerateDendrites();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    setTimeout(setupSectionObservers, 100);

    raf = requestAnimationFrame(render);
  });

  onDestroy(() => {
    if (typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(raf);
    if (typeof window !== "undefined")
      window.removeEventListener("resize", resize);
    sectionObservers.forEach((io) => io.disconnect());
  });
</script>

<!-- Canvas locked behind all content, body background:transparent shows it through -->
<canvas
  bind:this={canvas}
  class="fixed inset-0 pointer-events-none"
  style="z-index:-2"
  aria-hidden="true"
></canvas>
<div
  class="fixed inset-0 pointer-events-none"
  style="z-index:-1; background: radial-gradient(circle at center, transparent 0%, rgba(2,3,6,0.75) 100%);"
></div>
