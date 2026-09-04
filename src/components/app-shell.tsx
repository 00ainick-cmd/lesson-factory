import Link from "next/link";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { SignOutButton } from "./sign-out";
import type { Role } from "@/server/auth/rbac";

export function AppShell({ workspace, role, user, children }: { workspace: { id: string; name: string }; role: Role; user: { name: string; email: string }; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-[232px] shrink-0 flex-col border-r border-line bg-rail">
        <div className="flex h-14 items-center border-b border-line px-4">
          <Link href={`/w/${workspace.id}`} aria-label="Dashboard"><Logo /></Link>
        </div>
        <div className="px-4 pt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-faint">Workspace</p>
          <p className="mt-0.5 truncate font-display text-[14px] font-semibold">{workspace.name}</p>
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{role}</p>
        </div>
        <NavLinks wsId={workspace.id} role={role} />
        <div className="mt-auto border-t border-line px-4 py-3">
          <p className="truncate text-[12.5px]">{user.name}</p>
          <p className="truncate text-[11px] text-faint">{user.email}</p>
          <div className="mt-2 flex items-center justify-between">
            <Link href="/w" className="text-[12px] text-muted hover:text-ink">Switch workspace</Link>
            <SignOutButton />
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

export function PageHeader({ title, kicker, actions, children }: { title: string; kicker?: string; actions?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="border-b border-line bg-shell/80 px-8 py-5 backdrop-blur">
      <div className="flex items-end justify-between gap-4">
        <div>
          {kicker && <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted">{kicker}</p>}
          <h1 className="font-display text-[22px] font-semibold tracking-wide">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
