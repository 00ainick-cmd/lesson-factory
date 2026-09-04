"use client";
import { withBase } from "@/lib/base-path";
import { api } from "@/lib/api";

export function SignOutButton() {
  return (
    <button
      className="text-[12px] text-muted hover:text-ink"
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" });
        window.location.assign(withBase("/login"));
      }}
    >
      Lock
    </button>
  );
}
