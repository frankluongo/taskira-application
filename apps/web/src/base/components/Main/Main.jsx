import css from "./Main.module.css";
export function Main({ className = "", variant = "", ...props }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.main, ...variants.map((v) => css[v]), className]
    .filter(Boolean)
    .join(" ");
  return <main className={classes} {...props} />;
}
