import {
  CURRICULA,
  DAILY_MINUTES,
  DIFFICULTIES,
  GRADES,
  SERIOUSNESS,
  type LearningProfileDraft,
} from "@/lib/learning";
import type { Subject } from "@/lib/profile-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Setter = (patch: Partial<LearningProfileDraft>) => void;

export function AboutYouFields({ draft, set }: { draft: LearningProfileDraft; set: Setter }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="full_name">Your name</Label>
        <Input
          id="full_name"
          maxLength={80}
          value={draft.full_name}
          onChange={(e) => set({ full_name: e.target.value })}
          placeholder="Ayesha Khan"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          min={3}
          max={120}
          value={draft.age}
          onChange={(e) => set({ age: e.target.value })}
          placeholder="15"
        />
      </div>
    </div>
  );
}

export function SchoolFields({ draft, set }: { draft: LearningProfileDraft; set: Setter }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Grade / year</Label>
        <Select value={draft.grade} onValueChange={(grade) => set({ grade })}>
          <SelectTrigger>
            <SelectValue placeholder="Choose your grade" />
          </SelectTrigger>
          <SelectContent>
            {GRADES.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Curriculum / system</Label>
        <Select value={draft.curriculum} onValueChange={(curriculum) => set({ curriculum })}>
          <SelectTrigger>
            <SelectValue placeholder="Choose your system" />
          </SelectTrigger>
          <SelectContent>
            {CURRICULA.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function SubjectPicker({
  subjects,
  selected,
  toggle,
}: {
  subjects: Subject[];
  selected: string[];
  toggle: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {subjects.map((subject) => {
        const active = selected.includes(subject.id);
        return (
          <button
            key={subject.id}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(subject.id)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              active
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <span className="block font-medium text-foreground">{subject.name}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{subject.description}</span>
          </button>
        );
      })}
    </div>
  );
}

export function OptionCards({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string; hint: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              active
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <span className="block font-medium text-foreground">{option.label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{option.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

export function GoalFields({ draft, set }: { draft: LearningProfileDraft; set: Setter }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="goals">What do you want to achieve?</Label>
        <Textarea
          id="goals"
          rows={4}
          maxLength={1000}
          value={draft.study_goals}
          onChange={(e) => set({ study_goals: e.target.value })}
          placeholder="Ace my final exams, stop making silly mistakes in algebra…"
        />
      </div>
      <div className="space-y-2">
        <Label>Daily study target</Label>
        <Select
          value={String(draft.target_daily_minutes)}
          onValueChange={(v) => set({ target_daily_minutes: Number(v) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAILY_MINUTES.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m} minutes a day
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export { DIFFICULTIES, SERIOUSNESS };
