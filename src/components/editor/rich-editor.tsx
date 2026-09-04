"use client";
import { useEffect, useRef } from "react";
import { EditorContent, useEditor as useTiptap } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Code, Italic, List, ListOrdered } from "lucide-react";

/**
 * Rich text editing for an inline HTML fragment. The fragment is wrapped in its host tag so
 * Tiptap sees a valid document; on change we unwrap the same tag so the model keeps inner HTML.
 */
export function RichEditor({ html, tag, onChange, disabled }: { html: string; tag: string; onChange: (html: string) => void; disabled?: boolean }) {
  const last = useRef(html);
  const wrapTag = tag === "div" || tag === "span" ? "p" : tag;
  const editor = useTiptap({
    extensions: [StarterKit.configure({ heading: false, horizontalRule: false, codeBlock: false })],
    content: tag === "ul" || tag === "ol" || tag === "blockquote" ? `<${tag}>${html}</${tag}>` : `<${wrapTag}>${html}</${wrapTag}>`,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: { attributes: { class: "tiptap px-3 py-2 text-[13px] text-ink", "aria-label": "Rich text" } },
    onUpdate({ editor }) {
      const out = unwrap(editor.getHTML(), tag);
      if (out !== last.current) {
        last.current = out;
        onChange(out);
      }
    },
  });
  useEffect(() => {
    if (editor && editor.isEditable === Boolean(disabled)) editor.setEditable(!disabled);
  }, [editor, disabled]);
  if (!editor) return <div className="h-24 rounded border border-line-2 bg-rail" />;
  const B = ({ on, active, label, children }: { on: () => void; active: boolean; label: string; children: React.ReactNode }) => (
    <button type="button" aria-label={label} aria-pressed={active} disabled={disabled} onMouseDown={(e) => { e.preventDefault(); on(); }} className={`rounded p-1 ${active ? "bg-panel-2 text-ink" : "text-muted hover:text-ink"}`}>{children}</button>
  );
  return (
    <div className="rounded border border-line-2 bg-rail focus-within:border-accent">
      <div className="flex items-center gap-0.5 border-b border-line px-1.5 py-1">
        <B label="Bold" active={editor.isActive("bold")} on={() => editor.chain().focus().toggleBold().run()}><Bold size={13} /></B>
        <B label="Italic" active={editor.isActive("italic")} on={() => editor.chain().focus().toggleItalic().run()}><Italic size={13} /></B>
        <B label="Inline code" active={editor.isActive("code")} on={() => editor.chain().focus().toggleCode().run()}><Code size={13} /></B>
        {(tag === "ul" || tag === "ol" || tag === "div") && (
          <>
            <B label="Bullet list" active={editor.isActive("bulletList")} on={() => editor.chain().focus().toggleBulletList().run()}><List size={13} /></B>
            <B label="Numbered list" active={editor.isActive("orderedList")} on={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={13} /></B>
          </>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function unwrap(out: string, tag: string): string {
  const doc = new DOMParser().parseFromString(`<body>${out}</body>`, "text/html");
  const kids = [...doc.body.children];
  if (tag === "ul" || tag === "ol" || tag === "blockquote") {
    if (kids.length === 1 && kids[0]!.tagName.toLowerCase() === tag) return kids[0]!.innerHTML.trim();
    return out;
  }
  // Single paragraph → keep inner inline HTML; multiple paragraphs → join with <br> so the host tag stays valid.
  if (kids.length === 1 && kids[0]!.tagName.toLowerCase() === "p") return kids[0]!.innerHTML;
  return kids.map((k) => (k.tagName.toLowerCase() === "p" ? k.innerHTML : k.outerHTML)).join("<br>");
}
