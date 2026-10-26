import css from "./Footer.module.css";
export function Footer({ className = "", variant = "", ...props }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.footer, ...variants.map((v) => css[v]), className]
    .filter(Boolean)
    .join(" ");
  return <footer className={classes} {...props} />;
}
