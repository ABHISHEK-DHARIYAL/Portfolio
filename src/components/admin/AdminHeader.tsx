"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Inbox, FolderGit2, Layers, FileText, Trophy, Award, Sun, Moon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/layout/ThemeProvider";

const TABS = [
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/projects", label: "Projects", icon: FolderGit2 },
  { href: "/admin/other-projects", label: "Other Projects", icon: Layers },
  { href: "/admin/resumes", label: "Resume", icon: FileText },
  { href: "/admin/achievements", label: "Achievements", icon: Award },
  { href: "/admin/contests", label: "Coding Profiles", icon: Trophy },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
      <div className="flex flex-wrap items-center gap-1">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-2 font-mono text-xs transition",
                active
                  ? "bg-primary/20 text-primary"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="rounded-full border border-white/10 p-2 text-white/60 transition hover:border-primary/50 hover:text-white"
        >
          {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 font-mono text-xs text-white/60 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" /> Log out
        </button>
      </div>
    </div>
  );
}
