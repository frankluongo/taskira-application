import css from "./List.module.css";

export function List({ className = "", ...props }) {
  const classes = [css.list, className].filter(Boolean).join(" ");
  return <div className={classes} {...props} />;
}
