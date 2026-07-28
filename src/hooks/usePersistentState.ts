import { useEffect, useState } from "react";

/**
 * useState backed by localStorage, so a reload does not discard the user's
 * work. Storage access is wrapped because it throws in private-mode Safari and
 * when the origin has storage disabled; failing to persist is not worth
 * breaking the editor over.
 */
export const usePersistentState = (
  storageKey: string,
  initialValue: string
): [string, (value: string) => void] => {
  const [value, setValue] = useState(() => {
    try {
      return window.localStorage.getItem(storageKey) ?? initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, value);
    } catch {
      // Persistence unavailable - the editor still works in-memory.
    }
  }, [storageKey, value]);

  return [value, setValue];
};
