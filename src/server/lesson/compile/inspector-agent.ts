/**
 * Script injected into the sandboxed preview iframe. It only talks to the parent through
 * postMessage with a fixed set of message types; the parent validates every message with zod.
 * It never receives HTML or code from the parent — only block ids for highlight/scroll.
 */
export const INSPECTOR_AGENT_SOURCE = `
(function(){
  var SEL = "[data-lfs-block]";
  var hovered = null, selected = null;
  function post(type, payload){ parent.postMessage(Object.assign({ source: "lfs-preview", type: type }, payload || {}), "*"); }
  function blockOf(t){ return t && t.closest ? t.closest(SEL) : null; }
  function info(el){
    if (!el) return null;
    var beat = el.closest("[data-lfs-beat]");
    var r = el.getBoundingClientRect();
    return { blockId: el.getAttribute("data-lfs-block"), beatId: beat ? beat.getAttribute("data-lfs-beat") : null, rect: { top: r.top, left: r.left, width: r.width, height: r.height } };
  }
  document.addEventListener("mouseover", function(e){
    var el = blockOf(e.target);
    if (el === hovered) return;
    if (hovered) hovered.classList.remove("lfs-hover");
    hovered = el;
    if (hovered) hovered.classList.add("lfs-hover");
    post("lfs:hover", { block: info(el) });
  }, true);
  document.addEventListener("mouseleave", function(){ if (hovered) hovered.classList.remove("lfs-hover"); hovered = null; post("lfs:hover", { block: null }); }, true);
  document.addEventListener("click", function(e){
    var el = blockOf(e.target);
    if (!el) return;
    // Author mode: intercept the click so lesson interactions do not fire while editing text.
    var interactive = e.target.closest && e.target.closest("button, input, select, textarea, canvas, a, [role=button], label, summary");
    if (!interactive || el.getAttribute("data-lfs-classification") === "managed") { e.preventDefault(); e.stopPropagation(); }
    select(el);
    post("lfs:select", { block: info(el) });
  }, true);
  function select(el){
    if (selected) selected.classList.remove("lfs-selected");
    selected = el;
    if (selected) selected.classList.add("lfs-selected");
  }
  window.addEventListener("message", function(e){
    var d = e.data;
    if (!d || d.source !== "lfs-host") return;
    if (d.type === "lfs:highlight") {
      var el = d.blockId ? document.querySelector('[data-lfs-block="' + String(d.blockId).replace(/"/g, "") + '"]') : null;
      select(el);
    } else if (d.type === "lfs:scrollTo") {
      var target = d.blockId ? document.querySelector('[data-lfs-block="' + String(d.blockId).replace(/"/g, "") + '"]') : d.beatId ? document.querySelector('[data-lfs-beat="' + String(d.beatId).replace(/"/g, "") + '"]') : null;
      if (target) { target.scrollIntoView({ behavior: "smooth", block: "center" }); if (d.blockId) select(target); }
    } else if (d.type === "lfs:ping") {
      post("lfs:pong", {});
    }
  });
  window.addEventListener("error", function(e){ post("lfs:error", { message: String(e.message || e), line: e.lineno || null }); });
  window.addEventListener("unhandledrejection", function(e){ post("lfs:error", { message: String(e.reason && e.reason.message || e.reason || "unhandled rejection") }); });
  var beats = [].map.call(document.querySelectorAll("[data-lfs-beat]"), function(b){ return { beatId: b.getAttribute("data-lfs-beat"), blocks: b.querySelectorAll(SEL).length }; });
  post("lfs:ready", { beats: beats, title: document.title });
})();
`;
