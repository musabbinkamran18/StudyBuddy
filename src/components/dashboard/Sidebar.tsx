import { Link, useLocation } from "@tanstack/react-router";
import {
  House,
  Settings,
  GraduationCap,
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
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignOut } from "@/hooks/useSignOut";
import { useState } from "react";

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

// Bottom nav: 4 primary items + "More" sheet
const bottomPrimary = ["/dashboard", "/practice", "/tutor", "/leaderboard"];

export function DashboardSidebar() {
  const location = useLocation();
  const signOut = useSignOut();
  const [moreOpen, setMoreOpen] = useState(false);

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
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-around px-2 pb-safe-bottom">
          {navItems
            .filter((item) => bottomPrimary.includes(item.to))
            .map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors"
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className={cn(active ? "text-primary" : "text-muted-foreground")}>
                    {item.label.replace(/ .*/, "")}
                  </span>
                </Link>
              );
            })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium text-muted-foreground transition-colors"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* ── More sheet (mobile) ── */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setMoreOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Sheet */}
          <div
            className="absolute bottom-0 inset-x-0 rounded-t-2xl border-t border-border bg-background px-4 pb-10 pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle + close */}
            <div className="mb-4 flex items-center justify-between">
              <div className="mx-auto h-1 w-10 rounded-full bg-muted" />
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {navItems
                .filter((item) => !bottomPrimary.includes(item.to))
                .map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-2xl p-3 text-[11px] font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/50 text-foreground hover:bg-muted",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-center leading-tight">
                        {item.label.replace(/ [^\s]*$/, "").replace(/[^\w\s]/g, "").trim()}
                      </span>
                    </Link>
                  );
                })}

              <Link
                to="/profile"
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-2 rounded-2xl bg-muted/50 p-3 text-[11px] font-medium text-foreground hover:bg-muted"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>

              <button
                type="button"
                onClick={() => { setMoreOpen(false); void signOut(); }}
                className="flex flex-col items-center gap-2 rounded-2xl bg-muted/50 p-3 text-[11px] font-medium text-foreground hover:bg-muted"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
