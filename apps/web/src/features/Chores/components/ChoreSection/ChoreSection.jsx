import { List, Section } from "@taskira/ui";
import { DragContext } from "@/shared/dnd";
import { ChoreItem } from "../ChoreItem/ChoreItem";
import css from "./ChoreSection.module.css";

export function ChoreSection({ title, items, onDragEnd, showDate }) {
  if (items.length === 0) return null;
  return (
    <Section title={title}>
      <DragContext items={items} onDragEnd={onDragEnd}>
        <List>
          {items.map((chore) => (
            <div key={chore.id}>
              {showDate && <p className={css.date}>{chore.due_date}</p>}
              <ChoreItem chore={chore} />
            </div>
          ))}
        </List>
      </DragContext>
    </Section>
  );
}
