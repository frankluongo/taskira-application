import css from "./Scroller.module.css";
export function Scroller({ children, ...rest }) {
  return (
    <div className={css.scroller} {...rest}>
      <ul className={css.list} role="list">
        {children}
      </ul>
    </div>
  );
}
