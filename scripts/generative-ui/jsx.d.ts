import type {} from 'hono/jsx';

declare module 'hono/jsx' {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
