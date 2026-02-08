import type { PropsWithChildren } from "hono/jsx";
import type {
	ReadingWidth,
	PageWrapperProps,
	FlowContainerProps,
	ReadingColumnProps,
} from "./ai-system";

// --- HELPERS ---
const widthClasses: Record<ReadingWidth, string> = {
	narrow: "max-w-[45ch]",
	standard: "max-w-[65ch]",
	wide: "max-w-[120ch]",
	full: "w-full",
};

// --- COMPONENTS ---

export const PageWrapper = ({
	children,
	title = "System Dashboard",
}: PageWrapperProps) => (
	<html
		lang="en"
		className="bg-neutral-950 text-gray-300 font-mono antialiased"
	>
		<head>
			<meta charset="utf-8" />
			<title>{title}</title>
			<script src="https://cdn.tailwindcss.com"></script>
			{/* Global "Reset" for Markdown Isolation */}
			<style>{`
        /* The Attribute Selector Magic */
        [id^="doc-"] h1 { @apply text-2xl font-bold text-white mb-4 mt-8; }
        [id^="doc-"] h2 { @apply text-xl font-semibold text-gray-100 mb-3 mt-6; }
        [id^="doc-"] p { @apply mb-4 leading-relaxed; }
        [id^="doc-"] code { @apply bg-gray-900 px-1 py-0.5 rounded text-green-400; }
        [id^="doc-"] pre { @apply bg-gray-900 p-4 rounded mb-4 overflow-x-auto border border-gray-800; }
        [id^="doc-"] ul { @apply list-disc list-inside mb-4 pl-4; }
      `}</style>
		</head>
		<body className="min-h-screen flex flex-col">
			<nav className="border-b border-gray-800 p-4 flex justify-between items-center bg-neutral-900/50 sticky top-0 backdrop-blur-sm z-50">
				<div className="font-bold text-white tracking-tighter">
					<span className="text-green-500">◆</span> SYSTEM_OS
				</div>
				<div className="text-xs text-gray-500">v2.4.0-SSR</div>
			</nav>

			<main className="flex-1 w-full p-4 md:p-8">{children}</main>
		</body>
	</html>
);

export const ReadingColumn = ({
	children,
	width = "standard",
	padded = true,
}: ReadingColumnProps) => (
	<div
		className={`mx-auto ${widthClasses[width]} ${padded ? "py-8" : ""} space-y-6`}
	>
		{children}
	</div>
);

export const FlowContainer = ({
	children,
	gap = "normal",
}: FlowContainerProps) => {
	const gaps = { tight: "gap-2", normal: "gap-6", loose: "gap-12" };
	return (
		<div
			className={`flex flex-wrap items-start justify-start ${gaps[gap]} w-full`}
		>
			{children}
		</div>
	);
};
