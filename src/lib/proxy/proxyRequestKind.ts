/** These metadata endpoints finish as HTTP responses, without model generation. */
export function isProxyAuxiliaryRequest(method: string, path: string): boolean {
  return (
    (method === "POST" && path === "/v1/messages/count_tokens") ||
    (method === "GET" &&
      (path === "/backend-api/codex/models" || path === "/v1/models"))
  );
}
