/**
 * Pulls the 1-based line number out of a Mermaid parse error, whose messages
 * start with e.g. "Parse error on line 3:". Returns null when the message
 * carries no location, which is the case for semantic (non-syntax) failures.
 */
export const parseErrorLine = (message: string): number | null => {
  const match = /line (\d+)/i.exec(message);
  if (!match) return null;

  const line = Number(match[1]);
  return Number.isInteger(line) && line > 0 ? line : null;
};
