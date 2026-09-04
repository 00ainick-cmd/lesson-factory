export function appPathFromIncoming(incomingPath, prefix) {
  const prefixAt = incomingPath.lastIndexOf(prefix);
  return prefixAt >= 0
    ? (incomingPath.slice(prefixAt + prefix.length) || "/")
    : incomingPath;
}

export function relativeRootFor(incomingPath, prefix) {
  const routeParts = appPathFromIncoming(incomingPath, prefix).split("/").filter(Boolean);
  return routeParts.length <= 1 ? "./" : "../".repeat(routeParts.length - 1);
}
