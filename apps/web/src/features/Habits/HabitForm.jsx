import { useState } from "react";
import { Button, FieldsRow, Form, Input, Select } from "@/base";
import css from "./HabitForm.module.css";

const GROUPS = ["AM", "Misc", "PM"];

const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "specific_days", label: "Specific days" },
];

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function HabitForm({
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
}) {
  const [name, setName] = useState(initialValues.name ?? "");
  const [group, setGroup] = useState(initialValues.group_name ?? "AM");
  const [recurrence, setRecurrence] = useState(
    initialValues.recurrence ?? "daily",
  );
  const [days, setDays] = useState(initialValues.recurrence_days ?? []);
  const [alarmTime, setAlarmTime] = useState(initialValues.alarm_time ?? "");
  const [startDate, setStartDate] = useState(initialValues.start_date ?? "");
  const [endDate, setEndDate] = useState(initialValues.end_date ?? "");

  function toggleDay(d) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      group_name: group,
      recurrence,
      recurrence_days: recurrence === "specific_days" ? days : [],
      alarm_time: alarmTime || null,
      start_date: startDate || null,
      end_date: endDate || null,
    });
    setName(initialValues.name ?? "");
    setGroup(initialValues.group_name ?? "AM");
    setRecurrence(initialValues.recurrence ?? "daily");
    setDays(initialValues.recurrence_days ?? []);
    setAlarmTime(initialValues.alarm_time ?? "");
    setStartDate(initialValues.start_date ?? "");
    setEndDate(initialValues.end_date ?? "");
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Habit name…"
        label="Habit name"
        name="habit"
        id="habit"
        showLabel={false}
      />
      <FieldsRow>
        <Select
          id="group"
          label="Group"
          onChange={(e) => setGroup(e.target.value)}
          value={group}
        >
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
        <Select
          label="Recurrence"
          id="recurrence"
          name="recurrence"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
        >
          {RECURRENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FieldsRow>

      {recurrence === "specific_days" && (
        <div className={css.dayRow}>
          {DAY_LABELS.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`${css.day} ${days.includes(i) ? css.active : ""}`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      <FieldsRow variant="wrap">
        <Input
          label="Alarm"
          id="alarm"
          name="alarm"
          type="time"
          value={alarmTime}
          onChange={(e) => setAlarmTime(e.target.value)}
        />
        <Input
          id="start-date"
          label="Start date"
          name="start-date"
          onChange={(e) => setStartDate(e.target.value)}
          type="date"
          value={startDate}
        />
        <Input
          id="end-date"
          label="End date"
          name="end-date"
          onChange={(e) => setEndDate(e.target.value)}
          type="date"
          value={endDate}
        />
      </FieldsRow>

      <Button type="submit" variant="primary">
        {submitLabel}
      </Button>
    </Form>
  );
}
