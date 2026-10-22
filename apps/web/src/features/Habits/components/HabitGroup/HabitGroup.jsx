import { Details, List } from "@taskira/ui";
import { DragContext } from "@/shared/dnd";
import { HabitItem } from "../HabitItem/HabitItem";

export function HabitGroup({ group, habits, dragMode, onDragEnd }) {
  return (
    <Details summary={group}>
      <DragContext items={habits} onDragEnd={onDragEnd}>
        <List>
          {habits.map((habit) => (
            <HabitItem key={habit.id} habit={habit} dragMode={dragMode} />
          ))}
        </List>
      </DragContext>
    </Details>
  );
}
