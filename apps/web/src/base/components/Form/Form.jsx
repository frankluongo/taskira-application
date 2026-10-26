import css from "./Form.module.css";

export function FieldsRow({ variant = "", ...rest }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.fieldsRow, ...variants.map((v) => css[v])].join(" ");
  return <div className={classes} {...rest} />;
}

export function Form({ variant = "", ...rest }) {
  const variants = variant.split(" ").filter(Boolean);
  const classes = [css.form, ...variants.map((v) => css[v])].join(" ");
  return <form className={classes} {...rest} />;
}
