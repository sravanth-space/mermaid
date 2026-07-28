interface EditorFallbackProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Stands in while the CodeMirror chunk loads. It is a real, editable textarea
 * rather than a spinner, so the editor is never briefly unusable; CodeMirror
 * takes over with the same value once it arrives.
 */
export const EditorFallback = ({ value, onChange }: EditorFallbackProps) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full h-full resize-none border rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="Enter your Mermaid diagram code here..."
    spellCheck={false}
    aria-label="Mermaid diagram code"
  />
);
