import { ArrowRight, Activity as ActivityIcon, type LucideIcon } from "lucide-react";

export interface ActivityItem {
  icon: LucideIcon;
  tint: string;
  bg: string;
  text: string;
  detail: string;
  time: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
}

export function RecentActivity({ activities = [] }: RecentActivityProps) {
  const isEmpty = activities.length === 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">Recent Activity</h3>
        {!isEmpty && (
          <button className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <ActivityIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No activity yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Complete your first practice session and it will show up here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => (
            <div
              key={activity.text}
              className="flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-muted/60"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activity.bg}`}
              >
                <activity.icon className={`h-[18px] w-[18px] ${activity.tint}`} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{activity.text}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{activity.detail}</p>
              </div>

              <span className="shrink-0 text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
