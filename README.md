# Mermaid Visualizer

A beautiful React + TypeScript application for creating and visualizing Mermaid diagrams with an interactive editor and real-time preview.

![Mermaid Visualizer Screenshot](https://github.com/user-attachments/assets/4e8841cc-b850-40d8-94dc-827bb61c5b40)

## Features

- **Code Editor**: CodeMirror with Mermaid syntax highlighting, line numbers, and a gutter marker on the line Mermaid rejected
- **Live Preview**: Debounced rendering that keeps the last valid diagram on screen while you fix a syntax error
- **Template Library**: Flowchart, Sequence, Pie Chart, Gantt, Class, State, ER, Journey, Mindmap and Git Graph
- **Themes**: Default, Dark, Forest and Neutral, remembered between visits
- **Zoom & Pan**: Interactive diagram navigation with zoom controls
- **Fullscreen Mode**: Dedicated view for detailed diagram inspection
- **Export Options**: Copy the code, or download the diagram as SVG or PNG
- **Shareable Links**: Copy a link that reopens the app with your diagram loaded
- **Autosave**: Your work is kept in localStorage across reloads
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Touch Support**: Pan and pinch-to-zoom for mobile devices

## Getting Started

### Prerequisites

- Node.js 22 (see `.nvmrc`)
- yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sravanth-space/mermaid.git
cd mermaid
```

2. Install dependencies:
```bash
yarn install
```

3. Start the development server:
```bash
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
yarn build
```

This type-checks the project (`tsc -b`) and then creates a `dist` folder with
the built application ready for deployment.

### Type Checking, Linting and Tests

```bash
yarn typecheck
yarn lint
yarn test         # single run
yarn test:watch   # re-run on change
```

Tests use Vitest with jsdom and React Testing Library, and live next to the
code they cover as `*.test.ts(x)`. Mermaid itself is mocked in the component
tests, so the suite stays fast and does not depend on SVG layout.

### Deployment

The application is automatically deployed to GitHub Pages at [mermaid.sravanth.co.uk](https://mermaid.sravanth.co.uk) when changes are pushed to the main branch. The deployment workflow:

1. Builds the React application using Vite
2. Deploys the static files to GitHub Pages
3. Uses the custom domain configured in the CNAME file

### Preview Production Build

```bash
yarn preview
```

## Usage

1. **Edit Code**: Use the left panel to write or edit Mermaid diagram code
2. **Quick Start**: Click any template button to load pre-built diagram examples
3. **Navigate**: Use zoom controls to zoom in/out, reset view, or go fullscreen
4. **Export**: Copy the code or download the diagram as SVG
5. **Mobile**: Use touch gestures to pan and pinch-to-zoom on mobile devices

## Technology Stack

- **React 19**: Modern React with hooks
- **TypeScript**: Type-safe components in strict mode
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **Mermaid.js**: Diagram generation library (v11, bundled and code-split)
- **CodeMirror 6**: Editor with Mermaid syntax highlighting
- **Vitest**: Test runner, with React Testing Library and jsdom

## Diagram Types Supported

- Flowcharts
- Sequence diagrams
- Pie charts
- Gantt charts
- Class diagrams
- And many more Mermaid diagram types

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
