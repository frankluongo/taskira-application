import { useState } from "react";
import { INBOX_PROJECT_ID } from "@/lib/store";
import { Button, FieldsRow, Form, Input, Select } from "@/base";

function parseRecurrence(value) {
  if (!value)
    return { recurrence: "", customInterval: "3", customUnit: "months" };
  if (value.startsWith("custom:")) {
    const [, n, unit] = value.split(":");
    return { recurrence: "custom", customInterval: n, customUnit: unit };
  }
  return { recurrence: value, customInterval: "3", customUnit: "months" };
}

export function TaskForm({
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
  allowRecurrence = false,
}) {
  const parsed = parseRecurrence(initialValues.recurrence);

  const [name, setName] = useState(initialValues.name ?? "");
  const [priority, setPriority] = useState(initialValues.priority ?? 3);
  const projectId = initialValues.project_id ?? INBOX_PROJECT_ID;
  const [dueDate, setDueDate] = useState(initialValues.due_date ?? "");
  const [alarmTime, setAlarmTime] = useState(initialValues.alarm_time ?? "");
  const [recurrence, setRecurrence] = useState(parsed.recurrence);
  const [customInterval, setCustomInterval] = useState(parsed.customInterval);
  const [customUnit, setCustomUnit] = useState(parsed.customUnit);
  const [repeatFrom, setRepeatFrom] = useState(
    initialValues.repeat_from ?? "due_date",
  );

  const showRepeatFrom = ["weekly", "monthly", "yearly", "custom"].includes(
    recurrence,
  );

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    let recurrenceValue = allowRecurrence ? recurrence || null : null;
    if (recurrenceValue === "custom") {
      const n = parseInt(customInterval, 10);
      recurrenceValue = n > 0 ? `custom:${n}:${customUnit}` : null;
    }
    onSubmit({
      name: trimmed,
      priority,
      project_id: projectId,
      due_date: dueDate || null,
      alarm_time: alarmTime || null,
      recurrence: recurrenceValue,
      repeat_from: showRepeatFrom ? repeatFrom : "due_date",
    });
    setName(initialValues.name ?? "");
    setPriority(initialValues.priority ?? 3);
    setDueDate(initialValues.due_date ?? "");
    setAlarmTime(initialValues.alarm_time ?? "");
    setRecurrence(parsed.recurrence);
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Task name…"
        id="task-name"
        name="task-name"
        label="Task name"
        showLabel={false}
      />
      <FieldsRow>
        <Select
          id="priority"
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((p) => (
            <option key={p} value={p}>
              {["", "Someday", "Low", "Medium", "High", "Critical"][p]}
            </option>
          ))}
        </Select>
        {allowRecurrence && (
          <Select
            id="task-recurrence"
            name="task-recurrence"
            label="Recurrence"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
          >
            <option value="">No recurrence</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom…</option>
          </Select>
        )}
      </FieldsRow>
      {allowRecurrence && showRepeatFrom && (
        <FieldsRow>
          <Select
            value={repeatFrom}
            onChange={(e) => setRepeatFrom(e.target.value)}
            id="task-repeat-from"
            name="task-repeat-from"
            label="Repeat from"
          >
            <option value="due_date">Due date</option>
            <option value="completion_date">Completion date</option>
          </Select>
        </FieldsRow>
      )}
      {allowRecurrence && recurrence === "custom" && (
        <FieldsRow>
          <Input
            type="number"
            min="1"
            id="task-custom-interval"
            name="task-custom-interval"
            label="Every"
            value={customInterval}
            onChange={(e) => setCustomInterval(e.target.value)}
          />
          <Select
            id="task-custom-unit"
            name="task-custom-unit"
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
          id="due-date"
          label="Due date"
          name="due-date"
          onChange={(e) => setDueDate(e.target.value)}
          type="date"
          value={dueDate}
        />
        <Input
          label="Time"
          id="time"
          name="time"
          onChange={(e) => setAlarmTime(e.target.value)}
          type="time"
          value={alarmTime}
        />
      </FieldsRow>
      <Button type="submit" variant="primary">
        {submitLabel}
      </Button>
    </Form>
  );
}
