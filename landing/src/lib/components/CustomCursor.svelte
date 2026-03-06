<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { gsap } from "gsap";

  let dot: HTMLElement;
  let ring: HTMLElement;
  let cx = -100,
    cy = -100;
  let tx = -100,
    ty = -100;
  let tickerCb: (() => void) | undefined;
  let obs: MutationObserver | undefined;

  onMount(() => {
    // Only on desktop (pointer: fine)
    if (!window.matchMedia("(pointer: fine)").matches) return;

    // Hide default cursor
    document.documentElement.style.cursor = "none";

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    // Dot snaps quickly; ring lags slightly
    tickerCb = () => {
      cx = gsap.utils.interpolate(cx, tx, 0.25);
      cy = gsap.utils.interpolate(cy, ty, 0.25);
      gsap.set(dot, { x: cx, y: cy });
      gsap.set(ring, { x: cx, y: cy });
    };
    gsap.ticker.add(tickerCb);

    // Listen for near-node signal from NeuralTopology
    obs = new MutationObserver(() => {
      const near = document.body.dataset.cursorNear === "true";
      gsap.to(ring, {
        width: near ? 28 : 20,
        height: near ? 28 : 20,
        opacity: near ? 0.8 : 0.4,
        duration: 0.2,
        ease: "power2.out",
      });
    });
    obs.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-cursor-near"],
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
    };
  });

  onDestroy(() => {
    if (tickerCb) gsap.ticker.remove(tickerCb);
    if (obs) obs.disconnect();
    if (typeof document !== "undefined") {
      document.documentElement.style.cursor = "";
    }
  });
</script>

<div class="cursor-dot" bind:this={dot} aria-hidden="true"></div>
<div class="cursor-ring" bind:this={ring} aria-hidden="true"></div>

<style>
  .cursor-dot,
  .cursor-ring {
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    top: 0;
    left: 0;
  }

  .cursor-dot {
    width: 6px;
    height: 6px;
    background: var(--color-nl-sky, #0190e0);
    mix-blend-mode: screen;
  }

  .cursor-ring {
    width: 20px;
    height: 20px;
    border: 1px solid rgba(1, 144, 224, 0.4);
    opacity: 0.4;
  }

  /* Hide on touch/non-pointer-fine devices */
  @media (hover: none), (pointer: coarse) {
    .cursor-dot,
    .cursor-ring {
      display: none;
    }
  }
</style>
