import { Link, useLocation } from "@tanstack/react-router";
import {
  GraduationCap,
  House,
  Settings,
  Sparkles,
  Swords,
  ShoppingBag,
  Trophy,
  BookX,
  LogOut,
  Zap,
  BarChart2,
  Flame,
  Puzzle,
  BookOpen,
  BookMarked,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignOut } from "@/hooks/useSignOut";
import { BottomNav } from "./BottomNav";

const navItems = [
  { to: "/dashboard", label: "Home", icon: House },
  { to: "/practice", label: "Practice", icon: Swords },
  { to: "/battle", label: "Battle ⚔️", icon: Zap },
  { to: "/blitz", label: "Blitz ⚡", icon: Flame },
  { to: "/match", label: "Matching 🧩", icon: Puzzle },
  { to: "/flashcards", label: "Flashcards 🃏", icon: BookOpen },
  { to: "/story", label: "Story Mode 📖", icon: BookMarked },
  { to: "/skills", label: "Skill Tree 🗺️", icon: Map },
  { to: "/tutor", label: "AI Tutor", icon: Sparkles },
  { to: "/mistakes", label: "Mistakes", icon: BookX },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/leaderboard", label: "Leaderboard", icon: BarChart2 },
  { to: "/achievements", label: "Achievements", icon: Trophy },
];

export function DashboardSidebar() {
  const location = useLocation();
  const signOut = useSignOut();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <span className="font-serif text-xl tracking-tight text-sidebar-foreground">
            Study Buddy
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 px-3 pb-6">
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <Settings className="h-[18px] w-[18px] shrink-0" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <BottomNav />
    </>
  );
}
