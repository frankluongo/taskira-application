import { PRIORITY_LABELS } from "@/lib/store";
import css from "./PriorityBadge.module.css";

export function PriorityBadge({ priority }) {
  const info = PRIORITY_LABELS[priority] || PRIORITY_LABELS[1];
  return (
    <span className={`${css.badge} ${css[`p${priority}`] || css.p1}`}>
      {info.label}
    </span>
  );
}
