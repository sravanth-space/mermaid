import { useEffect, useState } from "react";

const readStored = (storageKey: string) => {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    // Storage throws in private-mode Safari and when the origin has it
    // disabled; failing to persist is not worth breaking the editor over.
    return null;
  }
};

/**
 * useState backed by localStorage, so a reload does not discard the user's
 * work.
 *
 * `resolveInitial` receives the stored value (or null) and decides the starting
 * state, letting callers give a shared link precedence over what was saved.
 */
export const usePersistentState = (
  storageKey: string,
  resolveInitial: (stored: string | null) => string
): [string, (value: string) => void] => {
  const [value, setValue] = useState(() => resolveInitial(readStored(storageKey)));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, value);
    } catch {
      // Persistence unavailable - the editor still works in-memory.
    }
  }, [storageKey, value]);

  return [value, setValue];
};
