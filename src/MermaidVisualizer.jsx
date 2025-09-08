import React, { useState, useEffect, useRef } from 'react';
import { Eye, Download, Copy, FileText, GitBranch, BarChart3, PieChart, Calendar, Network, ZoomIn, ZoomOut, Maximize, RotateCcw, Move } from 'lucide-react';

const MermaidVisualizer = () => {
  const [code, setCode] = useState(`graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Fix it]
    D --> B
    C --> E[End]`);
  
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragLastPos, setDragLastPos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [zoomLimitReached, setZoomLimitReached] = useState('');
  const diagramRef = useRef(null);
  const containerRef = useRef(null);

  const templates = [
    {
      name: 'Flowchart',
      icon: <GitBranch className="w-4 h-4" />,
      code: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`
    },
    {
      name: 'Sequence',
      icon: <BarChart3 className="w-4 h-4" />,
      code: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob
    B-->>A: Hello Alice
    A->>B: How are you?
    B-->>A: I'm good, thanks!`
    },
    {
      name: 'Pie Chart',
      icon: <PieChart className="w-4 h-4" />,
      code: `pie title Project Time Distribution
    "Development" : 45
    "Testing" : 25
    "Documentation" : 15
    "Meetings" : 15`
    },
    {
      name: 'Gantt',
      icon: <Calendar className="w-4 h-4" />,
      code: `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1           :a1, 2024-01-01, 30d
    Task 2           :after a1, 20d
    section Phase 2
    Task 3           :2024-02-01, 25d
    Task 4           :20d`
    },
    {
      name: 'Class Diagram',
      icon: <Network className="w-4 h-4" />,
      code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    Animal <|-- Dog`
    }
  ];

  const zoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.2));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      const pos = { x: e.clientX, y: e.clientY };
      setDragStart(pos);
      setDragLastPos(pos);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const currentPos = { x: e.clientX, y: e.clientY };
      const deltaX = currentPos.x - dragLastPos.x;
      const deltaY = currentPos.y - dragLastPos.y;
      
      setPan(prevPan => ({
        x: prevPan.x + deltaX,
        y: prevPan.y + deltaY
      }));
      
      setDragLastPos(currentPos);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault(); // Always prevent page zoom
    e.stopPropagation(); // Prevent event bubbling
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const currentZoom = zoom;
    let newZoom = currentZoom * delta;
    
    // Clamp to limits with proper bounds checking
    const minZoom = 0.2;
    const maxZoom = 3.0;
    
    if (newZoom < minZoom) {
      newZoom = minZoom;
      setZoomLimitReached('min');
      setTimeout(() => setZoomLimitReached(''), 1000);
    } else if (newZoom > maxZoom) {
      newZoom = maxZoom;
      setZoomLimitReached('max');
      setTimeout(() => setZoomLimitReached(''), 1000);
    } else {
      setZoomLimitReached('');
    }
    
    setZoom(newZoom);
  };

  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent page zoom/scroll
    e.stopPropagation();
    
    if (e.touches.length === 2) {
      setIsPinching(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      setLastPinchDistance(distance);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      const pos = { x: touch.clientX, y: touch.clientY };
      setDragStart(pos);
      setDragLastPos(pos);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent page zoom/scroll
    e.stopPropagation();
    
    if (e.touches.length === 2 && isPinching) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      if (lastPinchDistance > 0) {
        const delta = distance / lastPinchDistance;
        const currentZoom = zoom;
        let newZoom = currentZoom * delta;
        
        // Clamp to limits with proper bounds checking
        const minZoom = 0.2;
        const maxZoom = 3.0;
        
        if (newZoom < minZoom) {
          newZoom = minZoom;
          setZoomLimitReached('min');
          setTimeout(() => setZoomLimitReached(''), 1000);
        } else if (newZoom > maxZoom) {
          newZoom = maxZoom;
          setZoomLimitReached('max');
          setTimeout(() => setZoomLimitReached(''), 1000);
        } else {
          setZoomLimitReached('');
        }
        
        setZoom(newZoom);
      }
      setLastPinchDistance(distance);
    } else if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const currentPos = { x: touch.clientX, y: touch.clientY };
      const deltaX = currentPos.x - dragLastPos.x;
      const deltaY = currentPos.y - dragLastPos.y;
      
      setPan(prevPan => ({
        x: prevPan.x + deltaX,
        y: prevPan.y + deltaY
      }));
      
      setDragLastPos(currentPos);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault(); // Prevent page zoom/scroll
    e.stopPropagation();
    
    if (e.touches.length < 2) {
      setIsPinching(false);
      setLastPinchDistance(0);
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragLastPos]);

  useEffect(() => {
    renderDiagram();
  }, [code]);

  const renderDiagram = async () => {
    if (!diagramRef.current) return;
    
    try {
      // Clear any existing content
      diagramRef.current.innerHTML = '';
      
      // Load mermaid from CDN if not already loaded
      if (!window.mermaid) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      // Initialize mermaid
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit'
      });

      // Generate unique ID for this diagram
      const id = 'diagram-' + Date.now();
      
      // Render the diagram
      const { svg } = await window.mermaid.render(id, code);
      diagramRef.current.innerHTML = svg;
      setError('');
    } catch (err) {
      setError(err.message || 'Invalid Mermaid syntax');
      diagramRef.current.innerHTML = `<div class="flex items-center justify-center h-64 text-red-500 bg-red-50 rounded-lg border-2 border-red-200">
        <div class="text-center">
          <div class="text-lg font-semibold mb-2">Syntax Error</div>
          <div class="text-sm">${err.message || 'Please check your Mermaid syntax'}</div>
        </div>
      </div>`;
    }
  };

  const downloadSVG = () => {
    const svgElement = diagramRef.current.querySelector('svg');
    if (!svgElement) return;
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const loadTemplate = (template) => {
    setCode(template.code);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Mermaid Visualizer</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={copyCode}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </button>
              <button
                onClick={downloadSVG}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download SVG</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-sm text-gray-600 mr-3 whitespace-nowrap">Quick Start:</span>
            {templates.map((template, index) => (
              <button
                key={index}
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
                <span className="text-sm font-medium text-gray-700">Mermaid Code</span>
              </div>
            </div>
            <div className="p-4 h-full">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-[calc(100%-2rem)] resize border rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ 
                  maxWidth: '100%', 
                  minWidth: '100%',
                  maxHeight: 'calc(100% - 2rem)',
                  minHeight: '100px'
                }}
                placeholder="Enter your Mermaid diagram code here..."
                spellCheck={false}
              />
            </div>
          </div>

          {/* Diagram Preview */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Preview</span>
                </div>
                <div className="flex items-center space-x-2">
                  {error && (
                    <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                      Syntax Error
                    </span>
                  )}
                  <div className="flex items-center space-x-1 border rounded-lg">
                    <button
                      onClick={zoomOut}
                      className="p-1 hover:bg-gray-100 rounded-l-lg transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="px-2 py-1 text-xs text-gray-600 min-w-[3rem] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={zoomIn}
                      className="p-1 hover:bg-gray-100 transition-colors"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={resetView}
                      className="p-1 hover:bg-gray-100 transition-colors border-l"
                      title="Reset View"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-1 hover:bg-gray-100 rounded-r-lg transition-colors border-l"
                      title="Fullscreen"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div 
              ref={containerRef}
              className="relative h-[calc(100%-4rem)] overflow-hidden bg-gray-50"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div 
                ref={diagramRef}
                className="w-full h-full flex items-center justify-center transition-transform duration-100"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center'
                }}
              />
              {/* Pan indicator */}
              <div className="absolute top-2 left-2 bg-white bg-opacity-80 rounded px-2 py-1 text-xs text-gray-600">
                <Move className="w-3 h-3 inline mr-1" />
                Drag to pan • Scroll/Pinch to zoom
              </div>
              
              {/* Zoom limit feedback */}
              {zoomLimitReached && (
                <div className={`absolute top-2 right-2 px-3 py-2 rounded text-sm font-medium transition-opacity duration-300 ${
                  zoomLimitReached === 'min' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {zoomLimitReached === 'min' ? 'Minimum zoom (20%)' : 'Maximum zoom (300%)'}
                </div>
              )}
            </div>
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
                <div className="flex items-center space-x-1 border rounded-lg">
                  <button
                    onClick={zoomOut}
                    className="p-1 hover:bg-gray-100 rounded-l-lg transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 py-1 text-xs text-gray-600 min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={zoomIn}
                    className="p-1 hover:bg-gray-100 transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetView}
                    className="p-1 hover:bg-gray-100 transition-colors border-l"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div 
              className="flex-1 relative overflow-hidden bg-gray-50"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div 
                className="w-full h-full flex items-center justify-center transition-transform duration-100"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center'
                }}
                dangerouslySetInnerHTML={{ __html: diagramRef.current?.innerHTML || '' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MermaidVisualizer;