import { useState } from "react";
import { todayISO, tomorrowISO } from "@/shared/date";
import { DragContext } from "@/shared/dnd";
import { reorderSubset } from "@/shared/reorder";
import { ChoreForm, ChoreItem } from "@/features";
import { usePageHeader } from "@/app/PageHeader";
import { useStore } from "@/lib/store";
import {
  Button,
  Float,
  IconPlus,
  List,
  Modal,
  Scroller,
  Section,
} from "@taskira/ui";
import css from "./Chores.module.css";

export default function Chores() {
  const { chores, chore_lists, addChore, addChoreList, reorderChores } =
    useStore();
  const [showForm, setShowForm] = useState(false);
  const [filterToday, setFilterToday] = useState(false);
  const [activeList, setActiveList] = useState("all");

  const today = todayISO();
  const tomorrow = tomorrowISO();

  const byList = (e) => activeList === "all" || e.list_id === activeList;

  const overdueChores = chores
    .filter((e) => e.due_date && e.due_date < today && e.recurrence !== "daily")
    .filter(byList)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const todayChores = chores
    .filter((e) => e.due_date === today)
    .filter(byList)
    .sort((a, b) => a.sort_order - b.sort_order);
  const tomorrowChores = chores
    .filter((e) => e.due_date === tomorrow)
    .filter(byList)
    .sort((a, b) => a.sort_order - b.sort_order);
  const laterChores = chores
    .filter((e) => e.due_date && e.due_date > tomorrow)
    .filter(byList)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 5);
  const somedayChores = chores
    .filter((e) => !e.due_date)
    .filter(byList)
    .sort((a, b) => (a.created_at > b.created_at ? 1 : -1));

  function handleDragEnd(subset, { active, over }) {
    const next = reorderSubset(chores, subset, active.id, over?.id);
    if (next) reorderChores(next);
  }

  usePageHeader({
    title: "Chores",
    action: (
      <div className={css.actions}>
        <button
          onClick={() => setFilterToday((x) => !x)}
          className={`${css.filterToggle} ${filterToday ? css.active : ""}`}
        >
          Today
        </button>
      </div>
    ),
  });

  return (
    <>
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Add Chore"
      >
        <ChoreForm
          onSubmit={(e) => {
            addChore(e);
            setShowForm(false);
          }}
          submitLabel="Add Chore"
          onAddList={addChoreList}
        />
      </Modal>

      {chore_lists.length > 0 && (
        <Scroller style={{ flex: "0 0 auto" }}>
          <li>
            <ListTab
              label="All"
              active={activeList === "all"}
              onClick={() => setActiveList("all")}
            />
          </li>
          {chore_lists.map((l) => (
            <li key={l.id}>
              <ListTab
                label={l.name}
                active={activeList === l.id}
                onClick={() => setActiveList(l.id)}
              />
            </li>
          ))}
        </Scroller>
      )}

      <ChoreSection
        title="Overdue"
        items={overdueChores}
        onDragEnd={(e) => handleDragEnd(overdueChores, e)}
        showDate
      />
      <ChoreSection
        title="Today"
        items={todayChores}
        onDragEnd={(e) => handleDragEnd(todayChores, e)}
      />
      {!filterToday && (
        <ChoreSection
          title="Tomorrow"
          items={tomorrowChores}
          onDragEnd={(e) => handleDragEnd(tomorrowChores, e)}
        />
      )}
      {!filterToday && (
        <ChoreSection
          title="Later"
          items={laterChores}
          onDragEnd={(e) => handleDragEnd(laterChores, e)}
          showDate
        />
      )}
      {!filterToday && (
        <ChoreSection
          title="Someday"
          items={somedayChores}
          onDragEnd={(e) => handleDragEnd(somedayChores, e)}
        />
      )}
      <Float>
        <Button variant="icon" onClick={() => setShowForm((x) => !x)}>
          <IconPlus />
        </Button>
      </Float>
    </>
  );
}

function ListTab({ label, active, onClick }) {
  return (
    <Button variant="pill" aria-pressed={active} onClick={onClick}>
      {label}
    </Button>
  );
}

function ChoreSection({ title, items, onDragEnd, showDate }) {
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
