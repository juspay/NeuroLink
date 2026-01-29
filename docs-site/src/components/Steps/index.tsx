import type React from "react";
import styles from "./Steps.module.css";

interface StepsProps {
  children: React.ReactNode;
}

export function Steps({ children }: StepsProps) {
  return <div className={styles.steps}>{children}</div>;
}

interface StepItemProps {
  title: string;
  children: React.ReactNode;
  as?: "h3" | "h4" | "h5" | "div";
}

export function StepItem({
  title,
  children,
  as: Component = "h4",
}: StepItemProps) {
  return (
    <div className={styles.step}>
      <div className={styles.stepIndicator}>
        <span className={styles.stepNumber} />
      </div>
      <div className={styles.stepContent}>
        <Component className={styles.stepTitle}>{title}</Component>
        <div className={styles.stepDescription}>{children}</div>
      </div>
    </div>
  );
}
