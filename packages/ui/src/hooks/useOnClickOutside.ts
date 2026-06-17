"use client";
import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Call a handler when a pointer or focus event lands outside the referenced element. Used to
 * close flyouts when the visitor clicks or tabs away.
 */
export function useOnClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  active: boolean,
): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    const onPointer = (event: MouseEvent | FocusEvent): void => {
      const node = ref.current;
      if (
        node &&
        event.target instanceof Node &&
        !node.contains(event.target)
      ) {
        handler();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("focusin", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("focusin", onPointer);
    };
  }, [ref, handler, active]);
}
