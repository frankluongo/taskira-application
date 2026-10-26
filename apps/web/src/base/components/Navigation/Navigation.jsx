import css from "./Navigation.module.css";
export function Navigation({ className = "", variant = "", ...props }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.navigation, ...variants.map((v) => css[v]), className]
    .filter(Boolean)
    .join(" ");
  return <nav className={classes} {...props} />;
}
