import css from "./Spinner.module.css";

export function Spinner() {
  return (
    <div className={css.wrapper}>
      <div className={css.spinner} />
    </div>
  );
}
