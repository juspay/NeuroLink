import { forwardRef } from "react";
import { CloseIcon, SearchIcon } from "../icons";
import styles from "./Search.module.css";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      onChange,
      onClear,
      isLoading = false,
      placeholder = "Search documentation...",
      autoFocus = true,
    },
    ref,
  ) {
    return (
      <div className={styles.inputWrapper}>
        <SearchIcon className={styles.inputIcon} />
        <input
          ref={ref}
          type="text"
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {isLoading ? (
          <div
            className={styles.loadingSpinner}
            role="status"
            aria-label="Loading"
          />
        ) : value ? (
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
            aria-label="Clear search"
          >
            <CloseIcon className={styles.clearButtonIcon} />
          </button>
        ) : null}
      </div>
    );
  },
);
