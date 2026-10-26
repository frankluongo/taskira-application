import { useState } from "react";
import css from "./Button.module.css";
import { IconCheckmark } from "../../icons";
export function Button({ className = "", variant = "", ...props }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.button, ...variants.map((v) => css[v]), className]
    .filter(Boolean)
    .join(" ");
  return <button type="button" className={classes} {...props} />;
}

export function ToggleButton({
  onClick,
  active,
  variant = "",
  className = "",
  ...rest
}) {
  const [isActive, setIsActive] = useState(active);
  const variants = variant.split(" ").filter(Boolean);
  const classes = [
    css.button,
    css.toggle,
    ...variants.map((v) => css[v]),
    className,
  ];
  if (isActive) classes.push(css.active);

  return (
    <button
      onClick={handleClick}
      className={classes.filter(Boolean).join(" ")}
      type="button"
      {...rest}
    >
      <span className={css.toggleIndicator}>
        <IconCheckmark />
      </span>
    </button>
  );

  async function handleClick() {
    setIsActive(!isActive);
    await new Promise((resolve) => setTimeout(resolve, 200));
    onClick();
  }
}
