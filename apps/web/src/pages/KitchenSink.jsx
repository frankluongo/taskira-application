import { useEffect, useState } from "react";
import { usePageHeader } from "@/features";
import {
  Button,
  Disclosure,
  FieldsRow,
  Form,
  Hyperlink,
  IconBell,
  IconCalendar,
  IconCheckmark,
  IconCheckmarkCircle,
  IconChecklist,
  IconChevronDown,
  IconClipboard,
  IconClose,
  IconDrag,
  IconEdit,
  IconFolder,
  IconGrip,
  IconList,
  IconPlus,
  IconTrash,
  Input,
  List,
  Modal,
  Section,
  Select,
  Spinner,
  ToggleButton,
} from "@/base";
import css from "./KitchenSink.module.css";

const THEME_TOKENS = [
  "--theme-color-accent-500",
  "--theme-color-accent-100",
  "--theme-color-on-accent",
  "--theme-color-background-500",
  "--theme-color-background-400",
  "--theme-color-background-300",
  "--theme-color-text-500",
  "--theme-color-text-400",
  "--theme-color-text-300",
  "--theme-color-border-500",
];

const PALETTE_TOKENS = [
  "--color-strawberry-red",
  "--color-emerald",
  "--color-royal-gold",
  "--color-turquoise-surf",
  "--color-black",
  "--color-space-indigo",
  "--color-platinum",
  "--color-white",
];

const ICONS = {
  IconBell,
  IconCalendar,
  IconCheckmark,
  IconCheckmarkCircle,
  IconChecklist,
  IconChevronDown,
  IconClipboard,
  IconClose,
  IconDrag,
  IconEdit,
  IconFolder,
  IconGrip,
  IconList,
  IconPlus,
  IconTrash,
};

export default function KitchenSink() {
  const [disclosureOpen, setDisclosureOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [selectValue, setSelectValue] = useState("one");
  const [theme, setTheme] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  usePageHeader({
    title: "Kitchen Sink",
    action: (
      <Button
        variant="secondary"
        onClick={() => setTheme((mode) => (mode === "dark" ? "light" : "dark"))}
      >
        Switch to {theme === "dark" ? "Light" : "Dark"}
      </Button>
    ),
  });

  return (
    <>
      <Section title="Theme Colors">
        <div className={css.swatchGrid}>
          {THEME_TOKENS.map((token) => (
            <div key={token} className={css.swatch}>
              <div
                className={css.swatchColor}
                style={{ background: `var(${token})` }}
              />
              <code className={css.swatchLabel}>{token}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Palette Colors">
        <div className={css.swatchGrid}>
          {PALETTE_TOKENS.map((token) => (
            <div key={token} className={css.swatch}>
              <div
                className={css.swatchColor}
                style={{ background: `var(${token})` }}
              />
              <code className={css.swatchLabel}>{token}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className={css.stack}>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <h4>Heading 4</h4>
          <p>
            Body text in the primary font. The quick brown fox jumps over the
            lazy dog.
          </p>
          <p style={{ fontFamily: "var(--font-secondary)" }}>
            Secondary font sample — Teko.
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className={css.row}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="pill">Pill</Button>
          <Button variant="pill" aria-pressed="true">
            Pill (active)
          </Button>
        </div>
        <div className={css.row}>
          <Button variant="icon" aria-label="Add">
            <IconPlus />
          </Button>
          <Button
            variant="icon"
            aria-pressed="false"
            aria-label="Add, inactive"
          >
            <IconPlus />
          </Button>
          <Button variant="icon secondary" aria-label="Edit">
            <IconEdit />
          </Button>
          <Button variant="icon secondary slim" aria-label="Edit, slim">
            <IconEdit />
          </Button>
          <Button variant="icon slim" aria-label="Delete, slim">
            <IconTrash />
          </Button>
        </div>
        <div className={css.row}>
          <ToggleButton onClick={() => {}} />
          <ToggleButton onClick={() => {}} variant="sm" />
          <ToggleButton onClick={() => {}} variant="md" />
          <ToggleButton onClick={() => {}} variant="square" />
          <ToggleButton onClick={() => {}} active variant="square" />
        </div>
      </Section>

      <Section title="Form Controls">
        <Form>
          <FieldsRow variant="wrap">
            <Input
              id="ks-input"
              label="Text Input"
              placeholder="Type something..."
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
            />
            <Select
              id="ks-select"
              label="Select"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
            >
              <option value="one">One</option>
              <option value="two">Two</option>
              <option value="three">Three</option>
            </Select>
          </FieldsRow>
          <Button type="submit" variant="primary">
            Submit
          </Button>
        </Form>
      </Section>

      <Section title="Disclosure">
        <Disclosure
          title="Toggle Me"
          open={disclosureOpen}
          onToggle={() => setDisclosureOpen((open) => !open)}
        />
        {disclosureOpen && <p>Disclosure content, revealed.</p>}
      </Section>

      <Section title="List">
        <List>
          <div className={css.listItem}>List item one</div>
          <div className={css.listItem}>List item two</div>
          <div className={css.listItem}>List item three</div>
        </List>
      </Section>

      <Section title="Hyperlink">
        <div className={css.row}>
          <Hyperlink to="/">Default link</Hyperlink>
        </div>
      </Section>

      <Section title="Modal">
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          Open Modal
        </Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Kitchen Sink Modal"
        >
          <p>Modal content goes here.</p>
        </Modal>
      </Section>

      <Section title="Spinner">
        <div className={css.spinnerBox}>
          <Spinner />
        </div>
      </Section>

      <Section title="Icons">
        <div className={css.iconGrid}>
          {Object.entries(ICONS).map(([name, Icon]) => (
            <div key={name} className={css.iconCell}>
              <Icon className={css.iconPreview} />
              <code className={css.iconLabel}>{name}</code>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
