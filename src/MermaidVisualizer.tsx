import { useMemo, useState } from "react";
import {
  Eye,
  Download,
  Copy,
  FileText,
  X,
  Check,
  Share2,
  Palette,
  Image as ImageIcon,
} from "lucide-react";
import { DiagramPane } from "./components/DiagramPane";
import { ZoomControls } from "./components/ZoomControls";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useMermaidRender } from "./hooks/useMermaidRender";
import { usePanZoom } from "./hooks/usePanZoom";
import { usePersistentState } from "./hooks/usePersistentState";
import { useTransientFlag } from "./hooks/useTransientFlag";
import { downloadPng, downloadSvg } from "./lib/exportDiagram";
import { buildShareUrl, clearSharedCode, readSharedCode } from "./lib/shareLink";
import { DEFAULT_CODE, templates } from "./templates";
import type { Template } from "./templates";
import { isTheme, THEMES, THEME_LABELS } from "./themes";
import type { Theme } from "./themes";

const CODE_STORAGE_KEY = "mermaid-visualizer:code";
const THEME_STORAGE_KEY = "mermaid-visualizer:theme";
const RENDER_DEBOUNCE_MS = 300;

const MermaidVisualizer = () => {
  // Read once on mount, then drop it from the address bar so later edits are
  // not misrepresented by a stale link.
  const sharedCode = useMemo(() => {
    const shared = readSharedCode();
    if (shared) clearSharedCode();
    return shared;
  }, []);

  const [code, setCode] = usePersistentState(
    CODE_STORAGE_KEY,
    (stored) => sharedCode ?? stored ?? DEFAULT_CODE
  );
  const [storedTheme, setStoredTheme] = usePersistentState(
    THEME_STORAGE_KEY,
    (stored) => (stored && isTheme(stored) ? stored : "default")
  );
  const theme: Theme = isTheme(storedTheme) ? storedTheme : "default";

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportError, setExportError] = useState("");
  const [codeCopied, flagCodeCopied] = useTransientFlag();
  const [linkCopied, flagLinkCopied] = useTransientFlag();

  const debouncedCode = useDebouncedValue(code, RENDER_DEBOUNCE_MS);
  const { svg, error } = useMermaidRender(debouncedCode, theme);
  const panZoom = usePanZoom();

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    flagCodeCopied();
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(buildShareUrl(code));
    flagLinkCopied();
  };

  const exportSvg = () => {
    setExportError("");
    downloadSvg(svg);
  };

  const exportPng = async () => {
    setExportError("");
    try {
      await downloadPng(svg);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Could not export as PNG"
      );
    }
  };

  const loadTemplate = (template: Template) => {
    setCode(template.code);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Mermaid Visualizer
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 px-2 py-1.5 text-sm bg-gray-100 rounded-lg">
                <Palette className="w-4 h-4 text-gray-500" />
                <span className="sr-only">Diagram theme</span>
                <select
                  value={theme}
                  onChange={(e) => setStoredTheme(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none cursor-pointer"
                >
                  {THEMES.map((name) => (
                    <option key={name} value={name}>
                      {THEME_LABELS[name]}
                    </option>
                  ))}
                </select>
              </label>

              <button
                onClick={() => void copyCode()}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {codeCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{codeCopied ? "Copied!" : "Copy Code"}</span>
              </button>

              <button
                onClick={() => void copyShareLink()}
                title="Copy a link that reopens this diagram"
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {linkCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                <span>{linkCopied ? "Link copied!" : "Share"}</span>
              </button>

              <button
                onClick={exportSvg}
                disabled={!svg}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>SVG</span>
              </button>

              <button
                onClick={() => void exportPng()}
                disabled={!svg}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                <span>PNG</span>
              </button>
            </div>
          </div>

          {exportError && (
            <div className="mt-2 text-xs text-red-600" role="alert">
              {exportError}
            </div>
          )}
        </div>
      </div>

      {/* Templates Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-sm text-gray-600 mr-3 whitespace-nowrap">
              Quick Start:
            </span>
            {templates.map((template) => (
              <button
                key={template.name}
                onClick={() => loadTemplate(template)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
              >
                {template.icon}
                <span>{template.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
          {/* Code Editor */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b px-4 py-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Mermaid Code
                </span>
              </div>
            </div>
            <div className="p-4 h-full">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-[calc(100%-2rem)] resize border rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  maxWidth: "100%",
                  minWidth: "100%",
                  maxHeight: "calc(100% - 2rem)",
                  minHeight: "100px",
                }}
                placeholder="Enter your Mermaid diagram code here..."
                spellCheck={false}
                aria-label="Mermaid diagram code"
              />
            </div>
          </div>

          {/* Diagram Preview */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Preview
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {error && (
                    <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                      Syntax Error
                    </span>
                  )}
                  <ZoomControls
                    panZoom={panZoom}
                    onToggleFullscreen={toggleFullscreen}
                  />
                </div>
              </div>
            </div>
            <DiagramPane
              svg={svg}
              error={error}
              panZoom={panZoom}
              className="h-[calc(100%-4rem)]"
            />
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Diagram Preview</h2>
              <div className="flex items-center space-x-2">
                <ZoomControls panZoom={panZoom} />
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Exit fullscreen"
                  aria-label="Exit fullscreen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <DiagramPane
              svg={svg}
              error={error}
              panZoom={panZoom}
              className="flex-1"
              showHint={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MermaidVisualizer;
