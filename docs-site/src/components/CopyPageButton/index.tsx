import { useState, useEffect } from "react";
import styles from "./CopyPageButton.module.css";

interface CopyPageButtonProps {
  text?: string;
}

export function CopyPageButton({ text }: CopyPageButtonProps) {
  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "error">(
    "idle",
  );
  const [clipboardAvailable, setClipboardAvailable] = useState(false);

  useEffect(() => {
    const isAvailable =
      window.isSecureContext && navigator.clipboard?.writeText !== undefined;
    setClipboardAvailable(isAvailable);
  }, []);

  const copyToClipboardFallback = (text: string): boolean => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      return true;
    } catch (err) {
      console.error("Fallback copy failed:", err);
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleCopy = async () => {
    setStatus("copying");
    const pageContent = text || document.documentElement.outerHTML;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(pageContent);
        setStatus("copied");
      } else {
        const success = copyToClipboardFallback(pageContent);
        setStatus(success ? "copied" : "error");
      }
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      const success = copyToClipboardFallback(pageContent);
      setStatus(success ? "copied" : "error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  if (!clipboardAvailable) {
    return null;
  }

  const statusMessages = {
    idle: "Copy page",
    copying: "Copying...",
    copied: "Copied!",
    error: "Copy failed - Try again",
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={status === "copying"}
      className={`${styles.button} ${status === "copied" ? styles.buttonCopied : ""} copy-button copy-button--${status}`}
      title="Copy page content"
    >
      {status === "copied" ? (
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <title>Copied</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <title>Copy</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
          />
        </svg>
      )}
      <span>{statusMessages[status]}</span>
    </button>
  );
}
