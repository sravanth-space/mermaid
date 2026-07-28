import { ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react";
import type { PanZoom } from "../hooks/usePanZoom";

interface ZoomControlsProps {
  panZoom: PanZoom;
  /** Omitted in the fullscreen view, which has its own close button. */
  onToggleFullscreen?: () => void;
}

export const ZoomControls = ({
  panZoom,
  onToggleFullscreen,
}: ZoomControlsProps) => (
  <div className="flex items-center space-x-1 border rounded-lg">
    <button
      onClick={panZoom.zoomOut}
      className="p-1 hover:bg-gray-100 rounded-l-lg transition-colors"
      title="Zoom Out"
      aria-label="Zoom out"
    >
      <ZoomOut className="w-4 h-4" />
    </button>
    <span className="px-2 py-1 text-xs text-gray-600 min-w-[3rem] text-center">
      {Math.round(panZoom.zoom * 100)}%
    </span>
    <button
      onClick={panZoom.zoomIn}
      className="p-1 hover:bg-gray-100 transition-colors"
      title="Zoom In"
      aria-label="Zoom in"
    >
      <ZoomIn className="w-4 h-4" />
    </button>
    <button
      onClick={panZoom.resetView}
      className="p-1 hover:bg-gray-100 transition-colors border-l"
      title="Reset View"
      aria-label="Reset view"
    >
      <RotateCcw className="w-4 h-4" />
    </button>
    {onToggleFullscreen && (
      <button
        onClick={onToggleFullscreen}
        className="p-1 hover:bg-gray-100 rounded-r-lg transition-colors border-l"
        title="Fullscreen"
        aria-label="Enter fullscreen"
      >
        <Maximize className="w-4 h-4" />
      </button>
    )}
  </div>
);
