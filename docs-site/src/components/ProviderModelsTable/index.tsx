import styles from "./ProviderModelsTable.module.css";

interface Model {
  name: string;
  provider: string;
  contextWindow: number;
  supportsVision?: boolean;
  supportsTools?: boolean;
  supportsStreaming?: boolean;
}

interface ProviderModelsTableProps {
  models: Model[];
}

export function ProviderModelsTable({ models }: ProviderModelsTableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Model</th>
            <th>Provider</th>
            <th>Context</th>
            <th>Vision</th>
            <th>Tools</th>
            <th>Streaming</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={`${model.provider}:${model.name}`}>
              <td>
                <code>{model.name}</code>
              </td>
              <td>{model.provider}</td>
              <td className={styles.contextCell}>
                {model.contextWindow.toLocaleString("en-US")}
              </td>
              <td className={styles.featureCell}>
                {model.supportsVision ? (
                  <span
                    className={styles.supported}
                    title="Supported"
                    role="img"
                    aria-label="Supported"
                  >
                    &#10003;
                  </span>
                ) : (
                  <span
                    className={styles.notSupported}
                    title="Not supported"
                    role="img"
                    aria-label="Not supported"
                  >
                    &mdash;
                  </span>
                )}
              </td>
              <td className={styles.featureCell}>
                {model.supportsTools ? (
                  <span
                    className={styles.supported}
                    title="Supported"
                    role="img"
                    aria-label="Supported"
                  >
                    &#10003;
                  </span>
                ) : (
                  <span
                    className={styles.notSupported}
                    title="Not supported"
                    role="img"
                    aria-label="Not supported"
                  >
                    &mdash;
                  </span>
                )}
              </td>
              <td className={styles.featureCell}>
                {model.supportsStreaming ? (
                  <span
                    className={styles.supported}
                    title="Supported"
                    role="img"
                    aria-label="Supported"
                  >
                    &#10003;
                  </span>
                ) : (
                  <span
                    className={styles.notSupported}
                    title="Not supported"
                    role="img"
                    aria-label="Not supported"
                  >
                    &mdash;
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
