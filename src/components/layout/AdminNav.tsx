"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, GraduationCap, Calendar, FileText, BarChart3, LogOut } from "lucide-react";

const links = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/satisfaction", label: "Satisfaction", icon: BarChart3 },
  { href: "/admin/sessions", label: "Sessions", icon: Calendar },
  { href: "/admin/formations", label: "Formations", icon: FileText },
  { href: "/admin/stagiaires", label: "Stagiaires", icon: Users },
  { href: "/admin/formateurs", label: "Formateurs", icon: GraduationCap },
];

export function AdminNav() {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-14">
        <Link href="/admin" className="font-semibold text-slate-800">
          SF Formation — Admin
        </Link>
        <nav className="flex items-center gap-1 md:gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition
                ${pathname === href || (href !== "/admin" && pathname.startsWith(href)) ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-100"}
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
