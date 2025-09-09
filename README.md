# Mermaid Visualizer

A beautiful React application for creating and visualizing Mermaid diagrams with an interactive editor and real-time preview.

![Mermaid Visualizer Screenshot](https://github.com/user-attachments/assets/4e8841cc-b850-40d8-94dc-827bb61c5b40)

## Features

- **Interactive Code Editor**: Real-time editing of Mermaid diagram code
- **Live Preview**: Instant diagram rendering with error handling
- **Template Library**: Quick start with Flowchart, Sequence, Pie Chart, Gantt, and Class Diagram templates
- **Zoom & Pan**: Interactive diagram navigation with zoom controls
- **Fullscreen Mode**: Dedicated view for detailed diagram inspection
- **Export Options**: Copy code to clipboard and download diagrams as SVG
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Touch Support**: Pan and pinch-to-zoom for mobile devices

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sravanth-space/mermaid.git
cd mermaid
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

This creates a `dist` folder with the built application ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Edit Code**: Use the left panel to write or edit Mermaid diagram code
2. **Quick Start**: Click any template button to load pre-built diagram examples
3. **Navigate**: Use zoom controls to zoom in/out, reset view, or go fullscreen
4. **Export**: Copy the code or download the diagram as SVG
5. **Mobile**: Use touch gestures to pan and pinch-to-zoom on mobile devices

## Technology Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **Mermaid.js**: Diagram generation library

## Diagram Types Supported

- Flowcharts
- Sequence diagrams
- Pie charts
- Gantt charts
- Class diagrams
- And many more Mermaid diagram types

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
