import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface RevealOptions {
  y?: number;
  x?: number;
  scale?: number;
  opacity?: number;
  duration?: number;
  delay?: number;
  ease?: string;
  start?: string;
  stagger?: number;
}

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return { destroy() {} };
  }

  const {
    y = 60,
    x = 0,
    scale = 1,
    opacity = 0,
    duration = 0.8,
    delay = 0,
    ease = "power3.out",
    start = "top 85%",
    stagger,
  } = options;

  const target = stagger ? node.children : node;

  const tween = gsap.from(target, {
    y,
    x,
    scale,
    opacity,
    duration,
    delay,
    ease,
    stagger: stagger || 0,
    scrollTrigger: { trigger: node, start, once: true },
  });

  return {
    destroy() {
      tween.scrollTrigger?.kill();
      tween.kill();
    },
  };
}
