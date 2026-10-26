import { getTodayString } from "@/lib/date";
import { useStore } from "@/lib/store";
import { FlexColumn, Heading, List, Section, Text, ToggleButton } from "@/base";
import { PriorityBadge, usePageHeader } from "@/features";
import { HABIT_GROUPS } from "@/features/Habits";
import css from "./Today.module.css";

export default function Today() {
  const {
    habitsDueToday,
    completeHabit,
    chores,
    completeChore,
    tasks,
    completeTask,
  } = useStore();

  const today = getTodayString();
  const habits = habitsDueToday();
  const todayChores = chores.filter((e) => e.due_date === today);
  const todayTasks = tasks
    .filter((t) => !t.parent_task_id && !t.completed_at && t.due_date === today)
    .sort((a, b) => b.priority - a.priority);

  const hasAnything =
    habits.length + todayChores.length + todayTasks.length > 0;

  usePageHeader({ title: getTodayString("EEEE, MMM d") });

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
