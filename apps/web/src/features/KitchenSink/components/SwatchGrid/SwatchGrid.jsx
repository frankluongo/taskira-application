import css from "./SwatchGrid.module.css";

export function SwatchGrid({ tokens }) {
  return (
    <div className={css.swatchGrid}>
      {tokens.map((token) => (
        <div key={token} className={css.swatch}>
          <div
            className={css.swatchColor}
            style={{ background: `var(${token})` }}
          />
          <code className={css.swatchLabel}>{token}</code>
        </div>
      ))}
    </div>
  );
}
