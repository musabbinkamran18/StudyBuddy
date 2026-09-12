import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { FALLBACK_COLOR, subjectIcon } from "@/lib/subject-icons";

export interface SubjectCardData {
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  progressPercent: number;
  subtopics: string[];
}

function SubjectCard({ code, name, icon, color, progressPercent, subtopics }: SubjectCardData) {
  const Icon = subjectIcon(icon);
  const accent = color ?? FALLBACK_COLOR;

  return (
    <Link
      to="/learn/$code"
      params={{ code }}
      className="group block rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-foreground">{name}</h3>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>

          <p className="mt-0.5 text-xs text-muted-foreground">{progressPercent}% complete</p>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${progressPercent}%`, backgroundColor: accent }}
            />
          </div>

          {subtopics.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="truncate text-[11px] text-muted-foreground">{subtopics.join(" · ")}</p>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {subtopics.length} {subtopics.length === 1 ? "topic" : "topics"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

interface SubjectCardsProps {
  subjects: SubjectCardData[];
}

export function SubjectCards({ subjects }: SubjectCardsProps) {
  return (
    <div>
      <h3 className="mb-4 text-xl font-semibold tracking-tight text-foreground">Your Subjects</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {subjects.map((subject) => (
          <SubjectCard key={subject.code} {...subject} />
        ))}
      </div>
    </div>
  );
}
