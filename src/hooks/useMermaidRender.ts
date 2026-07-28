import { useEffect, useState } from "react";
import type mermaidApi from "mermaid";
import type { Theme } from "../themes";

type Mermaid = typeof mermaidApi;

let mermaidPromise: Promise<Mermaid> | null = null;

/**
 * Mermaid is several hundred kB, so it is imported on first render rather than
 * in the app shell. The promise is cached, so the module loads exactly once.
 */
const loadMermaid = (): Promise<Mermaid> => {
  mermaidPromise ??= import("mermaid").then(({ default: mermaid }) => mermaid);
  return mermaidPromise;
};

export interface RenderResult {
  /** Markup of the last diagram that rendered successfully. */
  svg: string;
  /** Parse/render failure for the current definition, or "" when it is valid. */
  error: string;
}

/** Mermaid requires a DOM id per render; a counter keeps them unique. */
let renderId = 0;

/**
 * Renders `code` to SVG markup using the given theme.
 *
 * The previous good SVG is deliberately kept on screen when the definition is
 * invalid: mid-edit definitions are transiently unparseable, and blanking the
 * preview on every half-typed line is more disruptive than an error notice.
 */
export const useMermaidRender = (code: string, theme: Theme): RenderResult => {
  const [result, setResult] = useState<RenderResult>({ svg: "", error: "" });

  useEffect(() => {
    // A slow render must not overwrite the result of a newer one.
    let stale = false;

    const render = async () => {
      if (!code.trim()) {
        setResult({ svg: "", error: "" });
        return;
      }

      try {
        const mermaid = await loadMermaid();

        // Re-initialised per render because the theme is baked into the output.
        // securityLevel stays "strict": definitions can arrive from a shared
        // link, and the result is injected as markup, so Mermaid must sanitise
        // labels rather than pass HTML through.
        mermaid.initialize({
          startOnLoad: false,
          theme,
          securityLevel: "strict",
          fontFamily: "inherit",
        });

        // parse() validates without leaving stray nodes behind on failure.
        await mermaid.parse(code);
        const { svg } = await mermaid.render(`diagram-${++renderId}`, code);
        if (!stale) setResult({ svg, error: "" });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Invalid Mermaid syntax";
        if (!stale) setResult((prev) => ({ svg: prev.svg, error: message }));
      }
    };

    void render();
    return () => {
      stale = true;
    };
  }, [code, theme]);

  return result;
};
