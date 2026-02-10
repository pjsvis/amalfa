import "hono";

declare module "hono/jsx" {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module "bun" {
  export interface Markdown {
    render(markdown: string): string;
  }

  export const Markdown: Markdown;
}
