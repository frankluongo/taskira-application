import { PRIORITIES, PRIORITY_LABELS } from "../../tasks.constants";
import css from "./PrioritySelect.module.css";

export function PrioritySelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={css.prioritySelect}
    >
      {PRIORITIES.map((p) => (
        <option key={p} value={p}>
          {PRIORITY_LABELS[p].label}
        </option>
      ))}
    </select>
  );
}
