import clsx from "clsx";
import type React from "react";
import styles from "./Kbd.module.css";

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return <kbd className={clsx(styles.kbd, className)}>{children}</kbd>;
}
