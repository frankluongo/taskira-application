import css from "./Float.module.css";
export function Float({ variant = "bottom right", ...rest }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.float, ...variants.map((v) => css[v])].join(" ");
  return <div className={classes} {...rest} />;
}
