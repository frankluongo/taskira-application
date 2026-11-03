import { useState } from "react";
import { Button, FieldsRow, Form, Input, Select } from "@/base";
import { PRIORITIES, PRIORITY_LABELS } from "./constants";

export function TaskForm({
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
}) {
  const [name, setName] = useState(initialValues.name ?? "");
  const [priority, setPriority] = useState(initialValues.priority ?? 3);
  const [dueDate, setDueDate] = useState(initialValues.due_date ?? "");
  const [alarmTime, setAlarmTime] = useState(initialValues.alarm_time ?? "");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      priority,
      due_date: dueDate || null,
      alarm_time: alarmTime || null,
    });
    setName(initialValues.name ?? "");
    setPriority(initialValues.priority ?? 3);
    setDueDate(initialValues.due_date ?? "");
    setAlarmTime(initialValues.alarm_time ?? "");
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
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </Select>
      </FieldsRow>
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
