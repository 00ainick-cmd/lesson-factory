"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Activity, BookOpen, FolderKanban, ListChecks, ShieldCheck, Target, Users, Layers } from "lucide-react";

export function NavLinks({ wsId, role }: { wsId: string; role: string }) {
  const path = usePathname();
  const base = `/w/${wsId}`;
  const items = [
    { href: base, label: "Projects", icon: FolderKanban, exact: true },
    { href: `${base}/knowledge`, label: "Knowledge Library", icon: BookOpen },
    { href: `${base}/objectives`, label: "Objectives", icon: Target },
    { href: `${base}/beat-types`, label: "Beat Types", icon: Layers },
    { href: `${base}/rules`, label: "Quality Rules", icon: ListChecks },
    { href: `${base}/activity`, label: "Activity", icon: Activity },
    ...(role === "admin" ? [{ href: `${base}/members`, label: "Members", icon: Users }] : []),
  ];
  return (
    <nav className="mt-5 flex flex-col gap-0.5 px-2" aria-label="Workspace">
      {items.map((it) => {
        const active = it.exact ? path === it.href : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined} className={clsx("flex items-center gap-2.5 rounded px-2.5 py-1.5 text-[13px]", active ? "bg-panel-2 text-ink" : "text-muted hover:bg-panel hover:text-ink")}>
            <it.icon size={15} strokeWidth={1.8} className={active ? "text-accent" : "text-faint"} />
            {it.label}
          </Link>
        );
      })}
      <div className="mt-4 flex items-center gap-2.5 px-2.5 text-[11px] text-faint">
        <ShieldCheck size={13} strokeWidth={1.8} /> Originals are immutable
      </div>
    </nav>
  );
}
