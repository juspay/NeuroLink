import { gsap } from "gsap";

export function tilt(node: HTMLElement) {
  const MAX_DEG = 10;

  function onMove(e: MouseEvent) {
    const r = node.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const rx = ((e.clientY - cy) / r.height) * -MAX_DEG;
    const ry = ((e.clientX - cx) / r.width) * MAX_DEG;
    gsap.to(node, {
      rotateX: rx,
      rotateY: ry,
      z: 6,
      duration: 0.15,
      ease: "none",
      transformPerspective: 800,
    });
  }

  function onLeave() {
    gsap.to(node, {
      rotateX: 0,
      rotateY: 0,
      z: 0,
      duration: 0.7,
      ease: "elastic.out(1,0.5)",
    });
  }

  node.addEventListener("mousemove", onMove);
  node.addEventListener("mouseleave", onLeave);

  return {
    destroy() {
      node.removeEventListener("mousemove", onMove);
      node.removeEventListener("mouseleave", onLeave);
    },
  };
}
