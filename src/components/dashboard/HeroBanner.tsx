import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { QuickActions } from "./QuickActions";

interface HeroBannerProps {
  userName: string;
  subjectCount: number;
  examDays?: number | null;
  examLabel?: string;
}

/**
 * Soft abstract wash — warm sun disc, blurred peach/sage orbs and a few
 * floating sparkles. Purely decorative, so it is hidden from assistive tech.
 */
function HeroArt() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1200 340"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <linearGradient id="heroWash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fdf9f2" />
          <stop offset="55%" stopColor="#f6ecdd" />
          <stop offset="100%" stopColor="#f3e3d3" />
        </linearGradient>
        <radialGradient id="heroSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8b48a" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#e8b48a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="heroPeach" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d97757" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#d97757" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="heroSage" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7a9e7e" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7a9e7e" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="340" fill="url(#heroWash)" />
      <circle cx="640" cy="90" r="150" fill="url(#heroSun)" />
      <circle cx="940" cy="300" r="230" fill="url(#heroPeach)" />
      <circle cx="180" cy="320" r="260" fill="url(#heroSage)" />

      {(
        [
          [150, 70],
          [1180, 40],
          [1030, 60],
          [260, 200],
        ] as [number, number][]
      ).map(([cx, cy], i) => (
        <g key={i}>
          <path
            d={`M${cx} ${cy - 5} L${cx + 1.5} ${cy - 1.5} L${cx + 5} ${cy} L${cx + 1.5} ${cy + 1.5} L${cx} ${cy + 5} L${cx - 1.5} ${cy + 1.5} L${cx - 5} ${cy} L${cx - 1.5} ${cy - 1.5} Z`}
            fill="#c85a37"
            opacity={0.35}
          />
        </g>
      ))}
    </svg>
  );
}

export function HeroBanner({ userName, subjectCount, examDays, examLabel }: HeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 shadow-[var(--shadow-elevated)]">
      <HeroArt />

      <div className="relative z-10 flex flex-col gap-8 p-8 lg:flex-row lg:items-center lg:gap-10">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Start learning
          </p>
          <h2 className="mt-3 max-w-[22rem] font-serif text-4xl leading-tight tracking-tight text-foreground">
            {userName.split(" ")[0]}, <span className="text-primary">let's bloom</span>
          </h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            You're all set with{" "}
            <span className="font-semibold text-primary">{subjectCount} subjects</span>. Pick a
            topic and take your first step today.
          </p>

          {examDays != null && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
              <span>📅</span>
              {examDays === 0
                ? `${examLabel || "Exam"} is TODAY — you got this!`
                : `${examDays}d until ${examLabel || "your exam"}`}
            </div>
          )}

          <Link to="/practice">
            <Button className="mt-5 h-11 rounded-full px-7 text-base font-semibold">
              Start Learning
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="w-full shrink-0 lg:w-[300px]">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
