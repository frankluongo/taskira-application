import { useState } from "react";
import { Button, Input } from "@taskira/ui";
import css from "./ProjectRenameForm.module.css";

// Mount with a key per project so the field resets to its current name.
export function ProjectRenameForm({ project, onRename, onDone }) {
  const [value, setValue] = useState(project.name);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && trimmed !== project.name) onRename(project.id, trimmed);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className={css.renameForm}>
      <Input
        autoFocus
        id="project-rename"
        name="project-rename"
        label="Project name"
        showLabel={false}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Project name"
      />
      <Button type="submit" variant="primary">
        Save
      </Button>
    </form>
  );
}
