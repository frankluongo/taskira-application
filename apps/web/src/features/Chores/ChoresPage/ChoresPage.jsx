import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { usePageHeader } from "@/app/PageHeader";
import { todayISO, tomorrowISO } from "@/shared/date";
import { reorderSubset } from "@/shared/reorder";
import { Button, Float, IconPlus, Modal } from "@taskira/ui";
import { groupChoresByDue } from "../chores.rules";
import { ChoreForm } from "../components/ChoreForm/ChoreForm";
import { ChoreListTabs } from "../components/ChoreListTabs/ChoreListTabs";
import { ChoreSection } from "../components/ChoreSection/ChoreSection";
import css from "./ChoresPage.module.css";

export function ChoresPage() {
  const { chores, chore_lists, addChore, addChoreList, reorderChores } =
    useStore(
      useShallow((s) => ({
        chores: s.chores,
        chore_lists: s.chore_lists,
        addChore: s.addChore,
        addChoreList: s.addChoreList,
        reorderChores: s.reorderChores,
      })),
    );
  const [showForm, setShowForm] = useState(false);
  const [filterToday, setFilterToday] = useState(false);
  const [activeList, setActiveList] = useState("all");

  const groups = groupChoresByDue(chores, {
    listId: activeList,
    today: todayISO(),
    tomorrow: tomorrowISO(),
  });

  function dragHandler(subset) {
    return ({ active, over }) => {
      const next = reorderSubset(chores, subset, active.id, over?.id);
      if (next) reorderChores(next);
    };
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

      <ChoreListTabs
        lists={chore_lists}
        activeList={activeList}
        onSelect={setActiveList}
      />

      <ChoreSection
        title="Overdue"
        items={groups.overdue}
        onDragEnd={dragHandler(groups.overdue)}
        showDate
      />
      <ChoreSection
        title="Today"
        items={groups.today}
        onDragEnd={dragHandler(groups.today)}
      />
      {!filterToday && (
        <>
          <ChoreSection
            title="Tomorrow"
            items={groups.tomorrow}
            onDragEnd={dragHandler(groups.tomorrow)}
          />
          <ChoreSection
            title="Later"
            items={groups.later}
            onDragEnd={dragHandler(groups.later)}
            showDate
          />
          <ChoreSection
            title="Someday"
            items={groups.someday}
            onDragEnd={dragHandler(groups.someday)}
          />
        </>
      )}
      <Float>
        <Button variant="icon" onClick={() => setShowForm((x) => !x)}>
          <IconPlus />
        </Button>
      </Float>
    </>
  );
}
