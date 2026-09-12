import {
  Sigma,
  Atom,
  FlaskConical,
  Leaf,
  BookOpen,
  Cpu,
  Microscope,
  Moon,
  Languages,
  Globe,
  BookMarked,
  type LucideIcon,
} from "lucide-react";

/** Maps the `icon` column on `subjects` to a lucide component. */
export const ICONS: Record<string, LucideIcon> = {
  Sigma,
  Atom,
  FlaskConical,
  Leaf,
  BookOpen,
  Cpu,
  Microscope,
  Moon,
  Languages,
  Globe,
};

export const FALLBACK_COLOR = "#38bdf8";

export function subjectIcon(icon: string | null): LucideIcon {
  return (icon && ICONS[icon]) || BookMarked;
}
