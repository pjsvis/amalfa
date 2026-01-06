# Project Alpha

Welcome to the **PolyVis** documentation system. This content is rendered directly from a Markdown file.

## The Concept

We transform "Stuff" into "Things". This process is recursive and structural.

## Structural Map

Here is the operational logic, rendered live from DOT code:

```dot
digraph Logic {
    rankdir=TB;
    node [shape=box, fontname="Courier", margin="0.2,0.1", style=filled, fillcolor="white"];
    edge [fontname="Courier"];

    Raw [label="Markdown\n(Source)", shape=note];
    Parser [label="Marked.js\n(Parser)"];
    Engine [label="Viz.js\n(Engine)"];
    View [label="Browser\n(Output)", shape=ellipse];

    Raw -> Parser [label="Text"];
    Parser -> Engine [label="Finds 'dot' code"];
    Parser -> View [label="HTML"];
    Engine -> View [label="SVG Injection"];
}
```
