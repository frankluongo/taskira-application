import { useState } from "react";
import { IconPlus } from "@taskira/ui";
import css from "./AddItemForm.module.css";

// Stays mounted outside edit mode so an open form survives toggling modes.
export function AddItemForm({ editing, onAdd }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewName("");
    setShowAdd(false);
  }

  if (!editing) return null;

  if (!showAdd) {
    return (
      <button className={css.addItem} onClick={() => setShowAdd(true)}>
        <IconPlus /> Item
      </button>
    );
  }

  return (
    <form onSubmit={handleAdd} className={css.addItemForm}>
      <input
        autoFocus
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Item name…"
        className={css.addItemInput}
      />
      <button type="submit" className={css.addItemSubmit}>
        Add
      </button>
      <button
        type="button"
        onClick={() => setShowAdd(false)}
        className={css.addItemCancel}
      >
        Cancel
      </button>
    </form>
  );
}
