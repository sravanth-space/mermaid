import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MermaidVisualizer from "./MermaidVisualizer";

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  parse: vi.fn(),
  render: vi.fn(),
}));

vi.mock("mermaid", () => ({ default: mermaidMock }));

// The real editor is CodeMirror, which is lazy-loaded and needs layout that
// jsdom does not provide. These tests are about the surrounding wiring.
vi.mock("./components/CodeEditor", () => ({
  CodeEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label="Mermaid diagram code"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const editor = () => screen.getByLabelText("Mermaid diagram code");
const setCode = (code: string) => fireEvent.change(editor(), { target: { value: code } });

/** Waits for the debounce plus the async render to settle. */
const renderedSvg = async (contains: string) =>
  waitFor(
    () => {
      const svg = document.querySelector("[data-rendered]");
      expect(svg?.getAttribute("data-rendered")).toContain(contains);
      return svg;
    },
    { timeout: 3000 }
  );

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = "";
  vi.clearAllMocks();

  mermaidMock.parse.mockResolvedValue(true);
  mermaidMock.render.mockImplementation((_id: string, code: string) =>
    Promise.resolve({ svg: `<svg data-rendered="${code.replace(/"/g, "")}"></svg>` })
  );

  // jsdom implements neither of these.
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
});

describe("MermaidVisualizer", () => {
  it("renders the default diagram on load", async () => {
    render(<MermaidVisualizer />);

    expect(screen.getByRole("heading", { name: "Mermaid Visualizer" })).toBeInTheDocument();
    await renderedSvg("Is it working?");
  });

  it("re-renders after the definition changes", async () => {
    render(<MermaidVisualizer />);
    await renderedSvg("Is it working?");

    setCode("graph LR\n  A[Edited] --> B");
    await renderedSvg("Edited");
  });

  it("debounces rendering instead of parsing every keystroke", async () => {
    render(<MermaidVisualizer />);
    await renderedSvg("Is it working?");
    mermaidMock.render.mockClear();

    for (const code of ["graph", "graph T", "graph TD", "graph TD\n  A-->B"]) {
      setCode(code);
    }

    await renderedSvg("A-->B");
    // Four edits inside the debounce window must collapse to one render.
    expect(mermaidMock.render).toHaveBeenCalledOnce();
  });

  it("loads a template into the editor", async () => {
    const user = userEvent.setup();
    render(<MermaidVisualizer />);
    await renderedSvg("Is it working?");

    await user.click(screen.getByRole("button", { name: /Mindmap/ }));

    expect((editor() as HTMLTextAreaElement).value).toContain("mindmap");
    await renderedSvg("Release Plan");
  });

  it("keeps the last good diagram when the definition breaks", async () => {
    render(<MermaidVisualizer />);
    await renderedSvg("Is it working?");

    mermaidMock.parse.mockRejectedValue(new Error("Parse error on line 2:"));
    setCode("graph TD\n  A[Broken");

    await waitFor(() => {
      expect(screen.getByText("Parse error on line 2:")).toBeInTheDocument();
    });
    // The previously rendered diagram is still on screen.
    expect(document.querySelector("[data-rendered]")).toBeInTheDocument();
    // Flagged both by the badge beside the Preview title and by the banner.
    expect(screen.getAllByText("Syntax Error")).toHaveLength(2);
  });

  it("clears the error once the definition parses again", async () => {
    render(<MermaidVisualizer />);
    await renderedSvg("Is it working?");

    mermaidMock.parse.mockRejectedValueOnce(new Error("Parse error on line 9:"));
    setCode("broken");
    await waitFor(() => expect(screen.getByText("Parse error on line 9:")).toBeInTheDocument());

    setCode("graph TD\n  Fixed --> Again");
    await renderedSvg("Fixed");
    expect(screen.queryByText("Syntax Error")).toBeNull();
  });

  it("renders with the selected theme and remembers it", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<MermaidVisualizer />);
    await renderedSvg("Is it working?");

    await user.selectOptions(screen.getByRole("combobox"), "dark");

    await waitFor(() => {
      expect(mermaidMock.initialize).toHaveBeenCalledWith(
        expect.objectContaining({ theme: "dark" })
      );
    });

    unmount();
    render(<MermaidVisualizer />);
    expect(screen.getByRole("combobox")).toHaveValue("dark");
  });

  it("sanitises rendered output rather than trusting the definition", async () => {
    render(<MermaidVisualizer />);
    await renderedSvg("Is it working?");

    await waitFor(() => {
      expect(mermaidMock.initialize).toHaveBeenCalledWith(
        expect.objectContaining({ securityLevel: "strict" })
      );
    });
  });

  it("copies the definition to the clipboard", async () => {
    const user = userEvent.setup();
    render(<MermaidVisualizer />);

    setCode("graph TD\n  Copy --> Me");
    await user.click(screen.getByRole("button", { name: /Copy Code/ }));

    expect(await window.navigator.clipboard.readText()).toBe("graph TD\n  Copy --> Me");
    expect(await screen.findByText("Copied!")).toBeInTheDocument();
  });

  it("copies a share link that carries the definition", async () => {
    const user = userEvent.setup();
    render(<MermaidVisualizer />);

    setCode("graph TD\n  Shared --> Link");
    await user.click(screen.getByRole("button", { name: /Share/ }));

    const link = await window.navigator.clipboard.readText();
    expect(link).toContain("#code=");
    expect(await screen.findByText("Link copied!")).toBeInTheDocument();
  });

  it("prefers a definition from the URL over saved work", async () => {
    window.localStorage.setItem("mermaid-visualizer:code", "graph TD\n  Saved --> Work");
    // base64url of "graph TD\n  FromLink --> Loaded"
    const encoded = btoa("graph TD\n  FromLink --> Loaded")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    window.location.hash = `#code=${encoded}`;

    render(<MermaidVisualizer />);

    expect(editor()).toHaveValue("graph TD\n  FromLink --> Loaded");
    // The link is consumed so later edits are not misrepresented by it.
    expect(window.location.hash).toBe("");
  });

  it("falls back to saved work when the link is corrupt", async () => {
    window.localStorage.setItem("mermaid-visualizer:code", "graph TD\n  Saved --> Work");
    window.location.hash = "#code=%%%not-base64%%%";

    render(<MermaidVisualizer />);

    expect(editor()).toHaveValue("graph TD\n  Saved --> Work");
  });

  it("downloads the rendered SVG", async () => {
    const user = userEvent.setup();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<MermaidVisualizer />);
    await renderedSvg("Is it working?");

    await user.click(screen.getByRole("button", { name: /^SVG$/ }));

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledOnce();
  });

  it("disables the export buttons until something has rendered", async () => {
    mermaidMock.parse.mockRejectedValue(new Error("No diagram type detected"));
    render(<MermaidVisualizer />);

    await waitFor(() =>
      expect(screen.getByText("No diagram type detected")).toBeInTheDocument()
    );

    expect(screen.getByRole("button", { name: /^SVG$/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^PNG$/ })).toBeDisabled();
  });

  it("shows the same current diagram in the fullscreen view", async () => {
    const user = userEvent.setup();
    render(<MermaidVisualizer />);

    setCode("graph TD\n  Current --> Render");
    await renderedSvg("Current");

    await user.click(screen.getByRole("button", { name: "Enter fullscreen" }));

    const panes = document.querySelectorAll(".diagram-surface");
    expect(panes).toHaveLength(2);
    // Both panes must show the current render, not a stale copy.
    for (const pane of panes) {
      expect(pane.querySelector("[data-rendered]")?.getAttribute("data-rendered")).toContain(
        "Current"
      );
    }

    const dialog = screen.getByRole("heading", { name: "Diagram Preview" }).parentElement;
    await user.click(within(dialog as HTMLElement).getByRole("button", { name: "Exit fullscreen" }));
    expect(document.querySelectorAll(".diagram-surface")).toHaveLength(1);
  });
});
