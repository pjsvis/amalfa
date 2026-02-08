import "hono";

declare module "hono/jsx" {
	namespace JSX {
		interface IntrinsicElements {
			[elemName: string]: any;
		}
	}
}
