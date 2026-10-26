import css from "./FlexColumn.module.css";

export function FlexColumn({
  Tag = "div",
  className = "",
  variant = "",
  ...props
}) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.flexColumn, ...variants.map((v) => css[v]), className]
    .filter(Boolean)
    .join(" ");
  return <Tag className={classes} {...props} />;
}
