# Initial Concept
Polyvis: A Neuro-Symbolic Graph Visualizer.

# Polyvis Product Guide

## Vision
Polyvis is a specialized neuro-symbolic graph visualizer designed for **Knowledge Engineers and Researchers**. It provides a lightweight, performant environment for exploring, analyzing, and "weaving" complex conceptual relationships into a coherent Neuro-Map.

## Primary Goals
- **Enhanced Data Ingestion:** Automate the harvesting of semantic relationships from diverse sources (docs, debriefs, playbooks) into a structured "Bento Box" format.
- **Improved Graph Interactivity:** Implement advanced filtering, multi-layer visualization, and analytical tools to explore large-scale knowledge structures.
- **Deep MCP Integration:** Strengthen the connection between the knowledge graph and AI agents via the Model Context Protocol, enabling agents to both navigate and contribute to the graph.

## Core Functional Requirements (Bento Box Kernel)
- **Robust Normalization:** A consistent pipeline for transforming heterogeneous input data into a standardized semantic structure.
- **Semantic Weaving:** Intelligent inference of relationships between nodes based on linguistic analysis, explicit tagging, and structural context.
- **Reactive State Management:** A unified state architecture that keeps the ingestion pipeline, the SQLite database, and the Sigma.js frontend perfectly synchronized.

## Advanced Visualization & Analysis
- **Community Detection (Louvain):** Automatic clustering of nodes to reveal the underlying thematic structure of the knowledge graph.
- **Temporal Weaving:** Exploration of the graph's evolution, tracking how concepts and directives change over time through historical data.
- **Contextual Subgraphs:** Focused exploration tools that allow researchers to isolate and analyze specific semantic neighborhoods.
