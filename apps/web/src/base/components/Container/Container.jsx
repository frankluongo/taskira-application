import css from "./Container.module.css";
export function Container({ className = "", variant = "", ...props }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.container, ...variants.map((v) => css[v]), className]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...props} />;
}
