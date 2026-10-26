import css from "./Text.module.css";

export function Text({ className = "", variant = "", ...props }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.text, ...variants.map((v) => css[v]), className]
    .filter(Boolean)
    .join(" ");
  return <p className={classes} {...props} />;
}
