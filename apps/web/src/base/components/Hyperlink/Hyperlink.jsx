import { NavLink } from "react-router";
import css from "./Hyperlink.module.css";

export function Hyperlink({ variant = "", ...rest }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.link, ...variants.map((v) => css[v] || "")]
    .filter(Boolean)
    .join(" ");
  return <NavLink className={classes} {...rest} />;
}
