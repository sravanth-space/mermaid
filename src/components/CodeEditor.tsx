import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { mermaid } from "codemirror-lang-mermaid";
import { linter, lintGutter } from "@codemirror/lint";
import type { Diagnostic } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { parseErrorLine } from "../lib/parseErrorLine";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Current render error, surfaced in the gutter on the offending line. */
  error: string;
}

const editorTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "0.875rem" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  ".cm-content": { paddingBottom: "1rem" },
});

/**
 * Marks the line Mermaid rejected. Mermaid reports a line but not a column, so
 * the whole line is flagged.
 */
const errorLinter = (error: string) =>
  linter((view): Diagnostic[] => {
    if (!error) return [];

    const reported = parseErrorLine(error);
    // Without a location, anchor on the last line so the gutter still shows
    // something actionable rather than silently dropping the diagnostic.
    const lineNumber = Math.min(reported ?? view.state.doc.lines, view.state.doc.lines);
    const line = view.state.doc.line(Math.max(1, lineNumber));

    return [{ from: line.from, to: line.to, severity: "error", message: error }];
  });

export const CodeEditor = ({ value, onChange, error }: CodeEditorProps) => {
  // Rebuilt when the error changes so the linter closure sees the current one.
  const extensions = useMemo(
    () => [mermaid(), lintGutter(), errorLinter(error), editorTheme],
    [error]
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      height="100%"
      className="h-full overflow-hidden rounded-lg border text-left"
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        autocompletion: false,
        highlightActiveLine: true,
        bracketMatching: true,
        closeBrackets: true,
      }}
      placeholder="Enter your Mermaid diagram code here..."
      aria-label="Mermaid diagram code"
    />
  );
};
