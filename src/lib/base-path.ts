/**
 * Optional URL prefix when the app is served behind a path-prefixing reverse proxy
 * (e.g. the hosted preview mounts the app at /port/3000). Next's <Link>, router and
 * redirect() honour basePath automatically; raw <a href>, fetch() and iframe src do not,
 * so those go through withBase().
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export function withBase(path: string): string {
  if (!BASE_PATH || !path.startsWith("/")) return path;
  if (typeof window !== "undefined") {
    // deploy_website mounts the backend below the attachment's private path. Discover that
    // runtime mount rather than assuming /port/5000 is at the domain root.
    const at = window.location.pathname.lastIndexOf(BASE_PATH);
    if (at > 0) {
      const mount = window.location.pathname.slice(0, at) + BASE_PATH;
      if (path === BASE_PATH || path.startsWith(BASE_PATH + "/")) {
        return mount + path.slice(BASE_PATH.length);
      }
      return mount + path;
    }
  }
  if (path === BASE_PATH || path.startsWith(BASE_PATH + "/")) return path;
  return BASE_PATH + path;
}
