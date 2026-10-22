import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { usePageHeader } from "@/app/PageHeader";
import { formatDisplayDate, todayISO } from "@/shared/date";
import {
  FlexColumn,
  Heading,
  List,
  Section,
  Text,
  ToggleButton,
} from "@taskira/ui";
import { getChoresDueOn } from "@/features/Chores";
import { HABIT_GROUPS, useHabitsDueToday } from "@/features/Habits";
import { PriorityBadge, getTasksDueOn } from "@/features/Tasks";
import css from "./TodayPage.module.css";

export function TodayPage() {
  const { completeHabit, chores, completeChore, tasks, completeTask } =
    useStore(
      useShallow((s) => ({
        completeHabit: s.completeHabit,
        chores: s.chores,
        completeChore: s.completeChore,
        tasks: s.tasks,
        completeTask: s.completeTask,
      })),
    );

  const today = todayISO();
  const habits = useHabitsDueToday();
  const todayChores = getChoresDueOn(chores, today);
  const todayTasks = getTasksDueOn(tasks, today);

  const hasAnything =
    habits.length + todayChores.length + todayTasks.length > 0;

  usePageHeader({ title: formatDisplayDate(new Date(), "EEEE, MMM d") });

  return (
    <>
      {!hasAnything && (
        <div className={css.empty}>
          <span className={css.emptyIcon}>✓</span>
          <p className={css.emptyText}>You&apos;re all caught up for today.</p>
        </div>
      )}

      {habits.length > 0 && (
        <FlexColumn Tag="section" title="Habits" variant="md">
          <Heading Tag="h2" variant="h2">
            Habits
          </Heading>
          {HABIT_GROUPS.map((group) => {
            const groupHabits = habits.filter((h) => h.group_name === group);
            if (groupHabits.length === 0) return null;
            return (
              <FlexColumn key={group} variant="sm">
                <Text variant="small-title">{group}</Text>
                <List>
                  {groupHabits.map((h) => (
                    <div key={h.id} className={css.row}>
                      <ToggleButton onClick={() => completeHabit(h.id)} />
                      <p className={css.name}>{h.name}</p>
                    </div>
                  ))}
                </List>
              </FlexColumn>
            );
          })}
        </FlexColumn>
      )}

      {todayChores.length > 0 && (
        <Section title="Chores">
          <List>
            {todayChores.map((e) => (
              <div key={e.id} className={css.row}>
                <ToggleButton
                  variant="square"
                  onClick={() => completeChore(e.id)}
                />
                <p className={css.name}>{e.name}</p>
              </div>
            ))}
          </List>
        </Section>
      )}

      {todayTasks.length > 0 && (
        <Section title="Tasks">
          <List>
            {todayTasks.map((t) => (
              <div key={t.id} className={css.row}>
                <ToggleButton variant="md" onClick={() => completeTask(t.id)} />
                <div className={css.body}>
                  <p className={css.taskName}>{t.name}</p>
                </div>
                <PriorityBadge priority={t.priority} />
              </div>
            ))}
          </List>
        </Section>
      )}
    </>
  );
}
