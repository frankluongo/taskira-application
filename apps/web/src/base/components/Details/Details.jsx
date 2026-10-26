import css from "./Details.module.css";
import { IconChevronDown } from "../../icons";

export function Details({
  children,
  className = "",
  summary = "Details",
  variant = "",
  ...props
}) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.details, ...variants.map((v) => css[v]), className]
    .filter(Boolean)
    .join(" ");
  return (
    <details className={classes} open={true} {...props}>
      <summary className={css.summary}>
        <span>{summary}</span>
        <IconChevronDown className={css.chevron} />
      </summary>
      {children}
    </details>
  );
}
