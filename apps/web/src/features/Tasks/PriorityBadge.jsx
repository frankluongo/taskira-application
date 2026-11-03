import { PRIORITY_LABELS } from "./constants";
import css from "./PriorityBadge.module.css";

export function PriorityBadge({ priority }) {
  const label = PRIORITY_LABELS[priority] || PRIORITY_LABELS[1];
  return (
    <span className={`${css.badge} ${css[`p${priority}`] || css.p1}`}>
      {label}
    </span>
  );
}
