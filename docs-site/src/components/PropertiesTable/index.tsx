import styles from "./PropertiesTable.module.css";

interface Property {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

interface PropertiesTableProps {
  properties: Property[];
}

export function PropertiesTable({ properties }: PropertiesTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Property</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((prop) => (
            <tr key={prop.name}>
              <td>
                <code>{prop.name}</code>
                {prop.required && (
                  <span
                    className={styles.required}
                    aria-label="Required"
                    title="Required"
                  >
                    *
                  </span>
                )}
              </td>
              <td>
                <code className={styles.type}>{prop.type}</code>
              </td>
              <td>
                {prop.default !== undefined ? <code>{prop.default}</code> : "—"}
              </td>
              <td>{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
