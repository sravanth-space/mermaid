/**
 * Minimal typings for the Mermaid UMD build, which is loaded from a CDN at
 * runtime rather than bundled as a dependency. Only the surface this app uses
 * is described here.
 */
interface MermaidConfig {
  startOnLoad?: boolean
  theme?: string
  securityLevel?: string
  fontFamily?: string
}

interface MermaidApi {
  initialize(config: MermaidConfig): void
  render(id: string, text: string): Promise<{ svg: string }>
}

interface Window {
  mermaid?: MermaidApi
}
