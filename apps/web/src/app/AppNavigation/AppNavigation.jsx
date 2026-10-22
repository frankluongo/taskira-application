import {
  Footer,
  Hyperlink,
  IconCalendar,
  IconCheckmarkCircle,
  IconChecklist,
  IconClipboard,
  IconFolder,
  IconList,
  Navigation,
} from "@taskira/ui";

const tabs = [
  { to: "/", label: "Today", icon: IconCalendar },
  { to: "/habits", label: "Habits", icon: IconCheckmarkCircle },
  { to: "/chores", label: "Chores", icon: IconList },
  { to: "/tasks", label: "Tasks", icon: IconClipboard },
  { to: "/projects", label: "Projects", icon: IconFolder },
  { to: "/checklists", label: "Checklists", icon: IconChecklist },
];

export function AppNavigation() {
  return (
    <Footer variant="site">
      <Navigation variant="footer">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Hyperlink
            key={to}
            to={to}
            end={to === "/"}
            aria-current={({ isActive }) => (isActive ? "page" : undefined)}
            variant="navigation"
          >
            <Icon />
            {label}
          </Hyperlink>
        ))}
      </Navigation>
    </Footer>
  );
}
