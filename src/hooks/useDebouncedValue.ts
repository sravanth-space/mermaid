import { useEffect, useState } from "react";

/**
 * Returns `value` after it has stopped changing for `delayMs`.
 *
 * Rendering a Mermaid diagram parses the whole definition, so doing it on
 * every keystroke wastes work and makes typing feel sticky on large diagrams.
 * Debouncing needs a timer by nature; it is contained here so no other module
 * has to deal with one.
 */
export const useDebouncedValue = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
