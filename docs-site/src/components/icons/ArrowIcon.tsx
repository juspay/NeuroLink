interface ArrowIconProps {
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}

const ROTATIONS = {
  up: "rotate(-90deg)",
  down: "rotate(90deg)",
  left: "rotate(180deg)",
  right: "rotate(0deg)",
} as const;

export function ArrowIcon({ className, direction = "right" }: ArrowIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
      style={{ transform: ROTATIONS[direction] }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
