import { useRef } from "react";
import { Button, Scroller } from "@taskira/ui";

export function ProjectTabs({
  projects,
  activeProject,
  onSelect,
  onRename,
  onAdd,
}) {
  return (
    <Scroller style={{ flex: "0 0 auto" }}>
      <li>
        <ProjectTab
          label="All"
          active={activeProject === "all"}
          onClick={() => onSelect("all")}
        />
      </li>
      {projects.map((p) => (
        <li key={p.id}>
          <ProjectTab
            label={p.completed_at ? `${p.name} ✓` : p.name}
            active={activeProject === p.id}
            onClick={() => onSelect(p.id)}
            onLongPress={() => onRename(p)}
          />
        </li>
      ))}
      <li>
        <Button variant="pill" onClick={onAdd}>
          + Project
        </Button>
      </li>
    </Scroller>
  );
}

function ProjectTab({ label, active, onClick, onLongPress }) {
  const pressTimer = useRef(null);
  const longPressFired = useRef(false);

  function handlePointerDown() {
    if (!onLongPress) return;
    longPressFired.current = false;
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      onLongPress();
    }, 500);
  }

  function handlePointerUp() {
    clearTimeout(pressTimer.current);
    pressTimer.current = null;
  }

  function handleClick() {
    if (!longPressFired.current) onClick();
    longPressFired.current = false;
  }

  return (
    <Button
      variant="pill"
      aria-pressed={active}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}
