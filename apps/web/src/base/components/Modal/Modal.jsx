import { useEffect, useRef } from "react";
import css from "./Modal.module.css";
import { Button } from "..";
import { IconClose } from "../../icons";

export function Modal({ open, onClose, children, title }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClick={handleClick}
      onClose={handleNativeClose}
      className={css.dialog}
    >
      <header className={css.header}>
        <h2 className={css.title}>{title}</h2>
        <Button variant="icon slim" aria-label="Close Modal" onClick={onClose}>
          <IconClose />
        </Button>
      </header>
      <div className={css.content}>{children}</div>
    </dialog>
  );

  function handleClick(e) {
    if (e.target === ref.current) onClose();
  }

  function handleNativeClose() {
    onClose();
  }
}
