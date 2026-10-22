import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { usePageHeader } from "@/app/PageHeader";
import { todayISO } from "@/shared/date";
import { reorderSubset } from "@/shared/reorder";
import {
  Button,
  Container,
  FlexColumn,
  Float,
  IconCalendar,
  IconCheckmark,
  IconDrag,
  IconPlus,
  Modal,
} from "@taskira/ui";
import { HABIT_GROUPS } from "../habits.constants";
import { getGroupHabits, useHabitsDueToday } from "../habits.selectors";
import { HabitForm } from "../components/HabitForm/HabitForm";
import { HabitGroup } from "../components/HabitGroup/HabitGroup";

export function HabitsPage() {
  const { habits, completions, addHabit, reorderHabits } = useStore(
    useShallow((s) => ({
      habits: s.habits,
      completions: s.habit_completions,
      addHabit: s.addHabit,
      reorderHabits: s.reorderHabits,
    })),
  );
  const habitsDueToday = useHabitsDueToday();
  const [showForm, setShowForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterToday, setFilterToday] = useState(true);
  const [dragMode, setDragMode] = useState(false);
  const dueTodayIds = useMemo(
    () => (filterToday ? new Set(habitsDueToday.map((h) => h.id)) : null),
    [filterToday, habitsDueToday],
  );
  const today = todayISO();

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

  function handleDragEnd(group, { active, over }) {
    // TODO(§8 #4): this should reorder the visible habits (sorted and
    // filtered), not the raw group list.
    const groupHabits = habits.filter((h) => h.group_name === group);
    const next = reorderSubset(habits, groupHabits, active.id, over?.id);
    if (next) reorderHabits(next);
  }

  return (
    <Container>
      <FlexColumn>
        {HABIT_GROUPS.map((group) => {
          const { all, visible } = getGroupHabits(habits, {
            group,
            dueTodayIds,
            completions,
            today,
            showCompleted,
          });
          if (all.length === 0 && !showForm) return null;
          return (
            <HabitGroup
              key={group}
              group={group}
              habits={visible}
              dragMode={dragMode}
              onDragEnd={(e) => handleDragEnd(group, e)}
            />
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
  );
}
