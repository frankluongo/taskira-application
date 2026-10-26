import css from "./Heading.module.css";

export function Heading({
  Tag = "h2",
  className = "",
  variant = "",
  ...props
}) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.heading, ...variants.map((v) => css[v]), className]
    .filter(Boolean)
    .join(" ");
  return <Tag className={classes} {...props} />;
}
