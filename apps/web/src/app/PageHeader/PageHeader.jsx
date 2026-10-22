import { Header, Heading } from "@taskira/ui";
import css from "./PageHeader.module.css";

export function PageHeader({ title, action }) {
  if (!title && !action) return null;
  return (
    <Header variant="page">
      <Heading>{title}</Heading>
      {action && <div className={css.actions}>{action}</div>}
    </Header>
  );
}
