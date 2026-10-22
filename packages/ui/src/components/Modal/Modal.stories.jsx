import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "../Button/Button";

export default {
  title: "Components/Modal",
  component: Modal,
};

export const Default = {
  render: () => <ModalDemo />,
};

function ModalDemo() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Example Modal">
        <p>This is the modal content.</p>
      </Modal>
    </>
  );
}
