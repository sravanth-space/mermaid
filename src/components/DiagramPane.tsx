import { Move } from "lucide-react";
import type { PanZoom } from "../hooks/usePanZoom";

interface DiagramPaneProps {
  /** Rendered SVG markup, produced by Mermaid from the user's definition. */
  svg: string;
  error: string;
  panZoom: PanZoom;
  className?: string;
  showHint?: boolean;
}

/**
 * The interactive diagram viewport. Both the inline preview and the fullscreen
 * view render this from the same SVG string, so they can never drift apart.
 */
export const DiagramPane = ({
  svg,
  error,
  panZoom,
  className = "",
  showHint = true,
}: DiagramPaneProps) => (
  <div
    className={`relative overflow-hidden bg-gray-50 ${className}`}
    style={{ cursor: panZoom.isDragging ? "grabbing" : "grab" }}
    {...panZoom.gestureHandlers}
  >
    <div
      className="diagram-surface w-full h-full flex items-center justify-center transition-transform duration-100"
      style={{
        transform: `translate(${panZoom.pan.x}px, ${panZoom.pan.y}px) scale(${panZoom.zoom})`,
        transformOrigin: "center center",
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />

    {!svg && !error && (
      <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
        Start typing to see your diagram
      </div>
    )}

    {showHint && (
      <div className="absolute top-2 left-2 bg-white bg-opacity-80 rounded px-2 py-1 text-xs text-gray-600">
        <Move className="w-3 h-3 inline mr-1" />
        Drag to pan • Scroll/Pinch to zoom
      </div>
    )}

    {panZoom.zoomLimitReached && (
      <div
        className={`absolute top-2 right-2 px-3 py-2 rounded text-sm font-medium transition-opacity duration-300 ${
          panZoom.zoomLimitReached === "min"
            ? "bg-orange-100 text-orange-800"
            : "bg-blue-100 text-blue-800"
        }`}
      >
        {panZoom.zoomLimitReached === "min"
          ? "Minimum zoom (20%)"
          : "Maximum zoom (300%)"}
      </div>
    )}

    {/* Shown over the last good diagram rather than replacing it, so a
        half-typed line does not blank the preview. */}
    {error && (
      <div className="absolute bottom-0 left-0 right-0 bg-red-50 border-t-2 border-red-200 px-3 py-2">
        <div className="text-xs font-semibold text-red-700 mb-0.5">
          Syntax Error
        </div>
        <div className="text-xs text-red-600 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
          {error}
        </div>
      </div>
    )}
  </div>
);
