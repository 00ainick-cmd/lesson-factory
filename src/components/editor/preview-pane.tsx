"use client";
import { withBase } from "@/lib/base-path";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useEditor } from "./store";
import { api } from "@/lib/api";
import { findBlock } from "@/server/lesson/model";

const Incoming = z.discriminatedUnion("type", [
  z.object({ type: z.literal("lfs:ready"), beats: z.array(z.object({ beatId: z.string().nullable(), blocks: z.number() })).optional(), title: z.string().optional() }),
  z.object({ type: z.literal("lfs:hover"), block: z.object({ blockId: z.string().nullable(), beatId: z.string().nullable() }).nullable() }),
  z.object({ type: z.literal("lfs:select"), block: z.object({ blockId: z.string().nullable(), beatId: z.string().nullable() }).nullable() }),
  z.object({ type: z.literal("lfs:error"), message: z.string(), line: z.number().nullable().optional() }),
  z.object({ type: z.literal("lfs:scroll"), y: z.number() }),
  z.object({ type: z.literal("lfs:patched"), blockId: z.string() }),
  z.object({ type: z.literal("lfs:pong") }),
]);

/**
 * Sandboxed live preview. The iframe has an opaque origin (sandbox="allow-scripts" only) and its
 * own strict CSP from /api/preview. Every inbound postMessage is validated against a fixed schema
 * before it touches editor state.
 */
export function PreviewPane() {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [width, setWidth] = useState<"full" | "tablet" | "phone">("full");
  const projectId = useEditor((s) => s.projectId);
  const previewMode = useEditor((s) => s.previewMode);
  const liveSeq = useEditor((s) => s.liveSeq);
  const selectedBlockId = useEditor((s) => s.selectedBlockId);
  const selectedBeatId = useEditor((s) => s.selectedBeatId);
  const [nonce, setNonce] = useState(0);
  const pendingScroll = useRef<number | null>(null);
  const pendingHighlight = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback((msg: Record<string, unknown>) => {
    iframe.current?.contentWindow?.postMessage({ source: "lfs-host", ...msg }, "*");
  }, []);

  // Inbound messages
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframe.current?.contentWindow) return;
      const raw = e.data as { source?: string } | null;
      if (!raw || raw.source !== "lfs-preview") return;
      const parsed = Incoming.safeParse(raw);
      if (!parsed.success) return;
      const m = parsed.data;
      const st = useEditor.getState();
      switch (m.type) {
        case "lfs:ready":
          setReady(true);
          if (pendingScroll.current != null) send({ type: "lfs:setScroll", y: pendingScroll.current });
          if (pendingHighlight.current) send({ type: "lfs:highlight", blockId: pendingHighlight.current });
          pendingScroll.current = null;
          pendingHighlight.current = null;
          break;
        case "lfs:hover":
          st.setHover(m.block?.blockId ?? null);
          break;
        case "lfs:select":
          if (m.block?.blockId) st.select(m.block.blockId, m.block.beatId ?? undefined);
          break;
        case "lfs:error":
          st.pushPreviewError(m.message + (m.line ? ` (line ${m.line})` : ""));
          break;
        case "lfs:scroll":
          st.setScrollY(m.y);
          break;
        default:
          break;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send]);

  // Flush queued live work (patch individual blocks or reload) shortly after edits settle.
  useEffect(() => {
    if (liveSeq === 0) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const st = useEditor.getState();
      const live = st.takeLive();
      if (!st.doc) return;
      if (live.reload) {
        pendingScroll.current = st.scrollY;
        pendingHighlight.current = st.selectedBlockId;
        setReady(false);
        setNonce((n) => n + 1);
        return;
      }
      for (const blockId of live.patch) {
        const loc = findBlock(st.doc, blockId);
        if (!loc) continue;
        try {
          const r = await api<{ html: string }>(`/api/preview/${st.projectId}/render-block`, { method: "POST", json: { block: loc.block } });
          send({ type: "lfs:patch", blockId, html: r.html });
        } catch (e) {
          st.pushPreviewError(`Live patch failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }, 220);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [liveSeq, send]);

  // Highlight follows selection from the beat map.
  useEffect(() => {
    if (!ready) return;
    if (selectedBlockId) send({ type: "lfs:scrollTo", blockId: selectedBlockId });
    else if (selectedBeatId) send({ type: "lfs:scrollTo", beatId: selectedBeatId });
  }, [selectedBlockId, selectedBeatId, ready, send]);

  const src = withBase(`/api/preview/${projectId}?mode=${previewMode}&n=${nonce}`);
  const w = width === "full" ? "100%" : width === "tablet" ? 820 : 390;

  return (
    <div className="flex h-full flex-col bg-[#0a0e13]">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-line px-3 text-[11.5px] text-muted">
        <div className="flex items-center gap-3">
          <span className="font-mono uppercase tracking-wider">{previewMode === "author" ? "Author preview · all beats unlocked" : "Learner preview · gates active"}</span>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${ready ? "bg-ok" : "bg-gold"}`} aria-hidden /> <span className="sr-only">{ready ? "preview ready" : "preview loading"}</span>
        </div>
        <div className="flex items-center gap-1">
          {(["full", "tablet", "phone"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={width === k} onClick={() => setWidth(k)} className={`rounded px-2 py-0.5 font-mono uppercase ${width === k ? "bg-panel-2 text-ink" : "hover:text-ink"}`}>{k}</button>
          ))}
          <button type="button" className="ml-2 rounded px-2 py-0.5 hover:text-ink" onClick={() => { pendingScroll.current = useEditor.getState().scrollY; setNonce((n) => n + 1); }}>Reload</button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-hidden p-0">
        <iframe
          key={nonce}
          ref={iframe}
          title="Lesson preview (sandboxed)"
          src={src}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          style={{ width: w, maxWidth: "100%" }}
          className="h-full border-0 bg-white transition-[width]"
        />
      </div>
    </div>
  );
}
