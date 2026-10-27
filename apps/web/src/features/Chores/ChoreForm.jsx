import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Form, FieldsRow, Input, Select } from "@/base";
import css from "./ChoreForm.module.css";

function parseRecurrence(value) {
  if (!value)
    return { recurrence: "", customInterval: "3", customUnit: "months" };
  if (value.startsWith("custom:")) {
    const [, n, unit] = value.split(":");
    return { recurrence: "custom", customInterval: n, customUnit: unit };
  }
  return { recurrence: value, customInterval: "3", customUnit: "months" };
}

export function ChoreForm({
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
  onAddList,
}) {
  const { chore_lists } = useStore();
  const parsed = parseRecurrence(initialValues.recurrence);

  const [name, setName] = useState(initialValues.name ?? "");
  const [listId, setListId] = useState(initialValues.list_id ?? "");
  const [dueDate, setDueDate] = useState(initialValues.due_date ?? "");
  const [recurrence, setRecurrence] = useState(parsed.recurrence);
  const [customInterval, setCustomInterval] = useState(parsed.customInterval);
  const [customUnit, setCustomUnit] = useState(parsed.customUnit);
  const [repeatFrom, setRepeatFrom] = useState(
    initialValues.repeat_from ?? "due_date",
  );
  const [alarmTime, setAlarmTime] = useState(initialValues.alarm_time ?? "");

  const showRepeatFrom = ["weekly", "monthly", "yearly", "custom"].includes(
    recurrence,
  );

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    let recurrenceValue = recurrence || null;
    if (recurrence === "custom") {
      const n = parseInt(customInterval, 10);
      recurrenceValue = n > 0 ? `custom:${n}:${customUnit}` : null;
    }
    onSubmit({
      name: trimmed,
      list_id: listId || null,
      due_date: dueDate || null,
      recurrence: recurrenceValue,
      repeat_from: showRepeatFrom ? repeatFrom : "due_date",
      recurrence_day: null,
      alarm_time: alarmTime || null,
    });
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Chore name…"
        id="chore-name"
        name="chore-name"
        showLabel={false}
      />
      <FieldsRow>
        <Select
          value={listId}
          onChange={(e) => setListId(e.target.value)}
          id="chore-list"
          name="chore-list"
          label="List"
        >
          <option value="">No list</option>
          {chore_lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
        <Select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
          id="chore-recurrence"
          name="chore-recurrence"
          label="Recurrence"
        >
          <option value="">No recurrence</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="custom">Custom…</option>
        </Select>
      </FieldsRow>
      {showRepeatFrom && (
        <FieldsRow>
          <Select
            value={repeatFrom}
            onChange={(e) => setRepeatFrom(e.target.value)}
            id="chore-repeat-from"
            name="chore-repeat-from"
            label="Repeat from"
          >
            <option value="due_date">Due date</option>
            <option value="completion_date">Completion date</option>
          </Select>
        </FieldsRow>
      )}
      {recurrence === "custom" && (
        <FieldsRow>
          <Input
            type="number"
            min="1"
            id="chore-custom-interval"
            name="chore-custom-interval"
            label="Every"
            value={customInterval}
            onChange={(e) => setCustomInterval(e.target.value)}
          />
          <Select
            id="chore-custom-unit"
            name="chore-custom-unit"
            label="Unit"
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value)}
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
            <option value="years">Years</option>
          </Select>
        </FieldsRow>
      )}
      <FieldsRow variant="wrap">
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          id="chore-due-date"
          name="chore-due-date"
          label="Due date"
        />
        <Input
          type="time"
          value={alarmTime}
          onChange={(e) => setAlarmTime(e.target.value)}
          id="chore-alarm-time"
          name="chore-alarm-time"
          label="Alarm time"
        />
      </FieldsRow>
      <div className={css.submitRow}>
        <Button type="submit" variant="primary" className={css.submitButton}>
          {submitLabel}
        </Button>
        {onAddList && (
          <Button
            variant="secondary"
            onClick={() => {
              const n = prompt("List name?");
              if (n) onAddList(n);
            }}
          >
            + List
          </Button>
        )}
      </div>
    </Form>
  );
}
