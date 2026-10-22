import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DndProvider } from "./DndProvider";

const STRATEGIES = {
  horizontal: horizontalListSortingStrategy,
  vertical: verticalListSortingStrategy,
};

export function DragContext({
  items,
  onDragEnd,
  strategy = "vertical",
  children,
}) {
  return (
    <DndProvider onDragEnd={onDragEnd}>
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={STRATEGIES[strategy]}
      >
        {children}
      </SortableContext>
    </DndProvider>
  );
}
