import Alpine from "alpinejs";
import docViewer from "./components/doc-viewer.js";
import explorerApp from "./components/explorer.js";
import graphApp from "./components/graph.js";
import navigation from "./components/nav.js";
import sigmaApp from "./components/sigma-explorer/index.js";
import { runStyleAudit } from "./utils/style-auditor.js";

// Expose for Console Access
window.runStyleAudit = runStyleAudit;

window.Alpine = Alpine;

Alpine.data("navigation", navigation);
Alpine.data("explorerApp", explorerApp);
Alpine.data("sigmaApp", sigmaApp);
Alpine.data("graphApp", graphApp);
Alpine.data("docViewer", docViewer);

Alpine.start();
