import { Button, Scroller } from "@taskira/ui";

export function ChoreListTabs({ lists, activeList, onSelect }) {
  if (lists.length === 0) return null;
  const tabs = [{ id: "all", name: "All" }, ...lists];
  return (
    <Scroller style={{ flex: "0 0 auto" }}>
      {tabs.map((tab) => (
        <li key={tab.id}>
          <Button
            variant="pill"
            aria-pressed={activeList === tab.id}
            onClick={() => onSelect(tab.id)}
          >
            {tab.name}
          </Button>
        </li>
      ))}
    </Scroller>
  );
}
