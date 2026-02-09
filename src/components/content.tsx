import type { DocViewerProps, GraphVizContainerProps } from "./ai-system";

export const DocViewer = ({ contentHtml, docId, meta }: DocViewerProps) => (
  <div className="border border-gray-800 bg-neutral-900/50 rounded-sm overflow-hidden">
    {meta && (
      <div className="bg-neutral-900 border-b border-gray-800 px-4 py-2 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-400 uppercase">
          {meta.title}
        </span>
        <span className="text-xs font-mono text-gray-600">{meta.date}</span>
      </div>
    )}

    <div className="p-6 md:p-8">
      {/* THE MAGIC: [id^="doc-"] 
         This ID triggers the specific CSS styles defined in PageWrapper 
      */}
      <article
        id={`doc-${docId}`}
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  </div>
);

export const GraphVizContainer = ({
  dataUrl,
  height = "600px",
}: GraphVizContainerProps) => {
  const islandId = `sigma-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      className="relative border border-gray-800 rounded-sm overflow-hidden bg-black"
      style={{ height }}
    >
      {/* The Mount Point */}
      <div
        id={islandId}
        className="absolute inset-0"
      />

      {/* Loading State (Overwritten by JS) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-600">
        <span className="animate-pulse">INITIALIZING GRAPH ENGINE...</span>
      </div>

      {/* The Client-Side Hydration Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
        // In a real app, you'd import this from a static JS file
        // window.loadGraph('${islandId}', '${dataUrl}');
        console.log("Graph Island mounted at #${islandId} fetching ${dataUrl}");
      `,
        }}
      />
    </div>
  );
};
