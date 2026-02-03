"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";

export function StagiaireNav() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/stagiaire/login";
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 md:px-6 flex items-center justify-between h-14">
        <Link href="/stagiaire" className="font-semibold text-slate-800">
          SF Formation — Stagiaire
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </header>
  );
}
