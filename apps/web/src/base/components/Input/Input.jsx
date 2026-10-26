import css from "./Input.module.css";

export function Input({ id, label, showLabel = true, ...rest }) {
  return (
    <label className={css.wrapper} htmlFor={id} id={`${id}-label`}>
      <span className={css.label} hidden={!showLabel}>
        {label}
      </span>
      <input className={css.input} type="text" id={id} {...rest} />
    </label>
  );
}
