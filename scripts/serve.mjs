#!/usr/bin/env node
/**
 * Hosted-preview launcher. The preview proxy strips its "/port/5000" prefix before forwarding, while
 * the Next build is compiled with BASE_PATH=/port/5000 so every link and asset resolves through the
 * proxy. This shim re-adds the prefix and forwards to Next on the internal port. Not used in a normal
 * deployment (run `next start` directly and leave BASE_PATH unset).
 */
import http from "node:http";
import { execSync, spawn } from "node:child_process";
import { relativeRootFor } from "./preview-paths.mjs";

const PUBLIC_PORT = Number(process.env.PORT || 5000);
const NEXT_PORT = Number(process.env.NEXT_INTERNAL_PORT || 5001);
const PREFIX = process.env.BASE_PATH || "/port/5000";

// A previous Next child may have outlived its shim; free the internal port first.
try { execSync(`pkill -f "next[ ]start -p ${NEXT_PORT}"; pkill -f "next[-]server"`, { stdio: "ignore" }); } catch {}
await new Promise((r) => setTimeout(r, 800));

const next = spawn("npx", ["next", "start", "-p", String(NEXT_PORT), "-H", "127.0.0.1"], { stdio: "inherit", env: process.env });
next.on("exit", (code) => process.exit(code ?? 1));

const server = http.createServer((req, res) => {
  const incomingPath = new URL(req.url, "http://preview.local").pathname;
  // Depending on the gateway hop, the request can arrive with /port/5000
  // already present or with that mount stripped. Measure depth only inside
  // the application route, never across the mount segments themselves.
  // Browser URLs do not end in a slash, so the final route segment already
  // occupies the current URL slot. Climb once for each preceding segment.
  const relativeRoot = relativeRootFor(incomingPath, PREFIX);
  let path = req.url === "/" || req.url === "" ? PREFIX : req.url;
  if (!(path === PREFIX || path.startsWith(PREFIX + "/") || path.startsWith(PREFIX + "?"))) path = PREFIX + path;
  const headers = { ...req.headers, host: `127.0.0.1:${NEXT_PORT}`, "accept-encoding": "identity" };
  const up = http.request({ host: "127.0.0.1", port: NEXT_PORT, method: req.method, path, headers }, (r) => {
    const outHeaders = { ...r.headers };
    const location = outHeaders.location;
    if (typeof location === "string" && (location === PREFIX || location.startsWith(PREFIX + "/"))) {
      // Keep Next redirects inside the private deploy_website mount, regardless of
      // the depth of the current route.
      const suffix = location.slice(PREFIX.length).replace(/^\/+/, "");
      outHeaders.location = relativeRoot + suffix;
    }
    if (typeof outHeaders.refresh === "string") {
      outHeaders.refresh = outHeaders.refresh.replace(
        new RegExp(`url=${PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:/([^;]*))?`),
        (_, suffix = "") => `url=${relativeRoot}${suffix}`,
      );
    }
    const type = String(outHeaders["content-type"] ?? "");
    const isHtml = type.includes("text/html");
    const isJavaScript = type.includes("javascript");
    if (!isHtml && !isJavaScript) {
      res.writeHead(r.statusCode, outHeaders);
      r.pipe(res);
      return;
    }
    const chunks = [];
    r.on("data", (chunk) => chunks.push(chunk));
    r.on("end", () => {
      let body = Buffer.concat(chunks).toString("utf8");
      if (isJavaScript) {
        // Next's webpack runtime hard-codes the configured basePath as its public path. The hosted
        // preview nests the application below an opaque per-deploy prefix, so derive that prefix
        // from the current document before loading lazy route chunks.
        body = body.replace(
          'r.p="/port/5000/_next/"',
          'r.p=location.pathname.slice(0,location.pathname.lastIndexOf("/port/5000"))+"/port/5000/_next/"',
        );
        delete outHeaders["content-length"];
        delete outHeaders["content-encoding"];
        outHeaders["cache-control"] = "no-store";
        res.writeHead(r.statusCode, outHeaders);
        res.end(body);
        return;
      }

      let html = body;
      // Next repeats asset URLs in both tag attributes and its serialized bootstrap data. Rewriting
      // every occurrence prevents the bootstrap loader from issuing a second, root-absolute request.
      html = html.replaceAll("/port/5000/", relativeRoot);
      // Force the deploy proxy to request the rewritten runtime instead of a previously cached copy.
      html = html.replace(/(webpack-[^"'?]+\.js)(["'])/g, "$1?gateway=3$2");
      const bridge = `<script>
(() => {
  const marker = "/port/5000";
  const at = location.pathname.lastIndexOf(marker);
  if (at < 0) return;
  const mount = location.pathname.slice(0, at) + marker;
  const map = (u) => typeof u === "string" && u.startsWith(marker) ? mount + u.slice(marker.length) : u;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => nativeFetch(
    typeof input === "string" ? map(input) :
    input instanceof Request ? new Request(map(input.url), input) : input,
    init
  );
  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    return nativeOpen.call(this, method, map(url), ...rest);
  };
  for (const name of ["pushState", "replaceState"]) {
    const native = history[name].bind(history);
    history[name] = (state, title, url) => native(state, title, url == null ? url : map(String(url)));
  }
  // Next's Link handler reconstructs basePath URLs and can discard the deploy preview's outer
  // mount. Prefer the fully resolved href already emitted into the DOM for internal navigation.
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
    const url = new URL(anchor.href, location.href);
    const targetMarkerAt = url.pathname.lastIndexOf(marker);
    if (url.origin === location.origin && targetMarkerAt >= 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      // Hydration can restore Next's root-absolute /port/5000 href after the
      // HTML rewriter made it relative. Reattach that URL to this preview's
      // opaque outer mount before navigating.
      const target =
        targetMarkerAt === 0 && at > 0
          ? location.origin + mount + url.pathname.slice(marker.length) + url.search + url.hash
          : url.href;
      location.assign(target);
    }
  }, true);
})();
</script>`;
      html = html.replace("<head>", "<head>" + bridge);
      delete outHeaders["content-length"];
      delete outHeaders["content-encoding"];
      res.writeHead(r.statusCode, outHeaders);
      res.end(html);
    });
  });
  up.on("error", (e) => {
    res.writeHead(502, { "content-type": "text/plain" });
    res.end("upstream not ready: " + e.message);
  });
  req.pipe(up);
});
server.listen(PUBLIC_PORT, "0.0.0.0", () => console.log(`[serve] shim :${PUBLIC_PORT} → next :${NEXT_PORT}${PREFIX}`));
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => { next.kill("SIGTERM"); process.exit(0); });
process.on("exit", () => { try { next.kill("SIGTERM"); } catch {} });
