/**
 * Minimal standalone AeroLesson runtime. Injected only when the export option is enabled.
 * The gold lesson guards every call with `if (window.AeroLesson)`, so this shim is optional; when
 * present it records interactions/scores in localStorage and fires the onInit callback so the
 * lesson can restore saved work. It never talks to a server. See docs/export.md.
 */
export const AEROLESSON_SHIM = `<script id="lfs-aerolesson-shim">
(function(){
  if (window.AeroLesson) return;
  var key = "lfs:" + (document.title || location.pathname);
  var state = { interactions: [], scores: [], complete: false, work: null };
  try { var saved = localStorage.getItem(key); if (saved) state = JSON.parse(saved); } catch (e) {}
  var inits = [];
  function persist(){ try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {} }
  function emit(type, detail){ try { window.dispatchEvent(new CustomEvent("aerolesson:" + type, { detail: detail })); } catch (e) {} }
  window.AeroLesson = {
    standalone: true,
    ready: function(){ emit("ready", {}); },
    onInit: function(fn){ inits.push(fn); try { fn({ state: state.work, standalone: true }); } catch (e) { console.warn("AeroLesson.onInit handler failed", e); } },
    saveState: function(work){ state.work = work; persist(); emit("save", { work: work }); },
    interaction: function(i){ state.interactions.push(Object.assign({ at: Date.now() }, i)); persist(); emit("interaction", i); },
    score: function(s){ state.scores.push(Object.assign({ at: Date.now() }, s)); persist(); emit("score", s); },
    complete: function(passed){ state.complete = passed !== false; persist(); emit("complete", { passed: state.complete }); },
    getState: function(){ return state; }
  };
})();
</script>`;
