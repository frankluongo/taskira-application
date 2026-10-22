import { useState } from "react";

export function useDragMode() {
  const [dragMode, setDragMode] = useState(false);
  return [dragMode, setDragMode];
}
