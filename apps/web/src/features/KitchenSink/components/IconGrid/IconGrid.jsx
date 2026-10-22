import css from "./IconGrid.module.css";

export function IconGrid({ icons }) {
  return (
    <div className={css.iconGrid}>
      {Object.entries(icons).map(([name, Icon]) => (
        <div key={name} className={css.iconCell}>
          <Icon className={css.iconPreview} />
          <code className={css.iconLabel}>{name}</code>
        </div>
      ))}
    </div>
  );
}
