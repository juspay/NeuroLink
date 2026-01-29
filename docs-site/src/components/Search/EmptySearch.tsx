import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { CloseIcon, SearchIcon } from "../icons";
import styles from "./Search.module.css";

interface EmptySearchProps {
  recentSearches: string[];
  onRecentSearchClick: (query: string) => void;
  onRemoveRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
}

// Popular/quick links for NeuroLink docs
const QUICK_LINKS = [
  { label: "Getting Started", path: "/docs/getting-started", icon: "1" },
  { label: "SDK Reference", path: "/docs/sdk", icon: "2" },
  { label: "CLI Guide", path: "/docs/cli", icon: "3" },
  { label: "MCP Integration", path: "/docs/mcp/overview", icon: "4" },
];

export function EmptySearch({
  recentSearches,
  onRecentSearchClick,
  onRemoveRecentSearch,
  onClearRecentSearches,
}: EmptySearchProps) {
  // ✅ Call hook at component level - resolve all paths before render
  const resolvedLinks = QUICK_LINKS.map((link) => ({
    ...link,
    resolvedPath: useBaseUrl(link.path),
  }));

  return (
    <div>
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className={styles.recentSearches}>
          <div className={styles.recentSearchesHeader}>
            <span className={styles.recentSearchesTitle}>Recent</span>
            <button
              type="button"
              className={styles.recentSearchesClear}
              onClick={onClearRecentSearches}
            >
              Clear all
            </button>
          </div>
          <ul className={styles.recentSearchesList}>
            {recentSearches.map((query) => (
              <li key={query}>
                <div className={styles.recentSearchItemWrapper}>
                  <button
                    type="button"
                    className={styles.recentSearchItem}
                    onClick={() => onRecentSearchClick(query)}
                  >
                    <SearchIcon className={styles.recentSearchIcon} />
                    <span className={styles.recentSearchText}>{query}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.recentSearchRemove}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecentSearch(query);
                    }}
                    aria-label={`Remove "${query}" from recent searches`}
                  >
                    <CloseIcon className={styles.recentSearchRemoveIcon} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Links */}
      <div className={styles.quickLinks}>
        <span className={styles.quickLinksTitle}>Quick Links</span>
        <div className={styles.quickLinksList}>
          {resolvedLinks.map((link) => (
            <Link
              key={link.path}
              to={link.resolvedPath}
              className={styles.quickLink}
            >
              <span className={styles.quickLinkIcon}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Empty state hint */}
      {recentSearches.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>Search the documentation</p>
          <p className={styles.emptyStateDescription}>
            Find guides, API references, and examples
          </p>
        </div>
      )}
    </div>
  );
}

interface NoResultsProps {
  query: string;
}

export function NoResults({ query }: NoResultsProps) {
  return (
    <div className={styles.noResults}>
      <SearchIcon className={styles.noResultsIcon} />
      <p className={styles.noResultsTitle}>No results found for "{query}"</p>
      <p className={styles.noResultsDescription}>
        Try different keywords or check the spelling
      </p>
    </div>
  );
}

interface SearchErrorProps {
  error: Error;
}

export function SearchError({ error }: SearchErrorProps) {
  return (
    <div className={styles.errorState}>
      <div className={styles.errorIcon}>!</div>
      <p className={styles.errorTitle}>Search failed</p>
      <p className={styles.errorDescription}>
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
    </div>
  );
}
