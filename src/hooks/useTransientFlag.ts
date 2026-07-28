import { useEffect, useRef, useState } from "react";

/**
 * A boolean that turns itself off again, for "Copied!" style confirmations.
 * Re-triggering restarts the window rather than stacking timers.
 */
export const useTransientFlag = (durationMs = 1500) => {
  const [active, setActive] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const trigger = () => {
    setActive(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setActive(false), durationMs);
  };

  return [active, trigger] as const;
};
