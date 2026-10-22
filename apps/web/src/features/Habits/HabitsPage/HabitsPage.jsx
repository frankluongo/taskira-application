import { useState } from "react";

import { HABIT_GROUPS, HabitForm, HabitItem } from "@/features";
import { DragContext } from "@/shared/dnd";
import { reorderSubset } from "@/shared/reorder";
import { usePageHeader } from "@/app/PageHeader";

import { useStore } from "@/lib/store";
import {
  Button,
  Container,
  Details,
  FlexColumn,
  Float,
  IconCalendar,
  IconCheckmark,
  IconDrag,
  IconPlus,
  List,
  Modal,
} from "@taskira/ui";

export default function Habits() {
  const { habits, addHabit, reorderHabits, isHabitDoneToday, habitsDueToday } =
    useStore();
  const [showForm, setShowForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterToday, setFilterToday] = useState(true);
  const [dragMode, setDragMode] = useState(false);
  const todayHabitIds = filterToday
    ? new Set(habitsDueToday().map((h) => h.id))
    : null;

  usePageHeader({
    title: "Habits",
    action: (
      <>
        <Button
          aria-label="Toggle filter today"
          aria-pressed={filterToday}
          onClick={() => setFilterToday((x) => !x)}
          variant="icon slim secondary"
          title="Toggle today filter"
        >
          <IconCalendar />
        </Button>
        <Button
          aria-label="Toggle show completed habits"
          aria-pressed={showCompleted}
          onClick={() => setShowCompleted((x) => !x)}
          variant="icon slim secondary"
          title="Toggle show completed habits"
        >
          <IconCheckmark />
        </Button>
        <Button
          aria-label="Toggle drag mode"
          aria-pressed={dragMode}
          onClick={() => setDragMode((x) => !x)}
          variant="icon slim secondary"
          title="Toggle drag mode"
        >
          <IconDrag />
        </Button>
      </>
    ),
  });

  return (
    <>
      <Container>
        <FlexColumn>
          {HABIT_GROUPS.map((group) => {
            const allGroupHabits = habits
              .filter((h) => h.group_name === group)
              .filter((h) => !filterToday || todayHabitIds.has(h.id))
              .sort((a, b) => a.sort_order - b.sort_order);
            if (allGroupHabits.length === 0 && !showForm) return null;
            const visibleHabits = showCompleted
              ? allGroupHabits
              : allGroupHabits.filter((h) => !isHabitDoneToday(h.id));
            return (
              <Details key={group} summary={group}>
                <DragContext
                  items={visibleHabits}
                  onDragEnd={(e) => handleDragEnd(group, e)}
                >
                  <List>
                    {visibleHabits.map((habit) => (
                      <HabitItem
                        key={habit.id}
                        habit={habit}
                        dragMode={dragMode}
                      />
                    ))}
                  </List>
                </DragContext>
              </Details>
            );
          })}
        </FlexColumn>
        <Float>
          <Button
            variant="icon"
            aria-expanded={showForm}
            aria-label="Add Habit"
            onClick={() => setShowForm((x) => !x)}
          >
            <IconPlus />
          </Button>
        </Float>
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title="Add Habit"
        >
          <HabitForm
            onSubmit={(habit) => {
              addHabit(habit);
              setShowForm(false);
            }}
            submitLabel="Add Habit"
          />
        </Modal>
      </Container>
    </>
  );

  function handleDragEnd(group, { active, over }) {
    // TODO(§8 #4): this should reorder visibleHabits (sorted and filtered),
    // not the raw group list.
    const groupHabits = habits.filter((h) => h.group_name === group);
    const next = reorderSubset(habits, groupHabits, active.id, over?.id);
    if (next) reorderHabits(next);
  }
}
