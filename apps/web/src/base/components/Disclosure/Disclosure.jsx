import { IconChevronDown } from "../../icons";
import css from "./Disclosure.module.css";

export function Disclosure({ title, open, onToggle }) {
  return (
    <h2 className={css.heading}>
      <button
        type="button"
        className={css.trigger}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className={css.title}>{title}</span>
        <IconChevronDown
          className={`${css.chevron} ${open ? "" : css.collapsed}`}
        />
      </button>
    </h2>
  );
}
