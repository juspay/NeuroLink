import { Redirect } from "@docusaurus/router";
import type React from "react";

export default function Home(): React.JSX.Element {
  return <Redirect to="/docs/getting-started" />;
}
