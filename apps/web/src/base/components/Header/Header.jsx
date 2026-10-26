import css from "./Header.module.css";

/**
 * Site-level header element with support for space-separated style variants.
 *
 * @param {Object} props
 * @param {string} [props.className] - Additional class name(s) to append.
 * @param {"page" | "site"} [props.variant] - Space-separated variant names ("page" or "site"). Each is mapped to a CSS module class; "site" also enables the Tauri drag region.
 *
 * Any other props are spread onto the underlying `<header>` element.
 * @returns {JSX.Element}
 */
export function Header({ className = "", variant = "", ...props }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.header, ...variants.map((v) => css[v]), className]
    .filter(Boolean)
    .join(" ");
  const dragProps = variants.includes("site")
    ? { "data-tauri-drag-region": "deep" }
    : {};
  return <header className={classes} {...dragProps} {...props} />;
}
