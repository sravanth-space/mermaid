import {
  GitBranch,
  BarChart3,
  PieChart,
  Calendar,
  Network,
} from "lucide-react";
import type { ReactNode } from "react";

export interface Template {
  name: string;
  icon: ReactNode;
  code: string;
}

export const DEFAULT_CODE = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Fix it]
    D --> B
    C --> E[End]`;

export const templates: Template[] = [
  {
    name: "Flowchart",
    icon: <GitBranch className="w-4 h-4" />,
    code: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
  },
  {
    name: "Sequence",
    icon: <BarChart3 className="w-4 h-4" />,
    code: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob
    B-->>A: Hello Alice
    A->>B: How are you?
    B-->>A: I'm good, thanks!`,
  },
  {
    name: "Pie Chart",
    icon: <PieChart className="w-4 h-4" />,
    code: `pie title Project Time Distribution
    "Development" : 45
    "Testing" : 25
    "Documentation" : 15
    "Meetings" : 15`,
  },
  {
    name: "Gantt",
    icon: <Calendar className="w-4 h-4" />,
    code: `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1           :a1, 2024-01-01, 30d
    Task 2           :after a1, 20d
    section Phase 2
    Task 3           :2024-02-01, 25d
    Task 4           :20d`,
  },
  {
    name: "Class Diagram",
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
    Animal <|-- Dog`,
  },
];
