import { IconChevronDown } from "../../icons";
import css from "./Select.module.css";

export function Select({ id, label, showLabel = true, ...rest }) {
  return (
    <label className={css.wrapper} htmlFor={id} id={`${id}-label`}>
      <span className={css.label} hidden={!showLabel}>
        {label}
      </span>
      <div className={css.selectWrapper}>
        <select className={css.select} id={id} {...rest} />
        <IconChevronDown className={css.icon} aria-hidden="true" />
      </div>
    </label>
  );
}
