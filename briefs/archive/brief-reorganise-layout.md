# Task: reorganise Layout

**Objective:** Header + Main Panel Refactor

- [ ] header should be rock steady, no line under it
- [ ] header should have a gray background, see sigma-explorer
- [ ] main panel contained within screen
- [ ] scrolling  managed by app: main panel
- [ ] no titles or statuses should be outside the main panel
- [ ] NOTE remove listeners and setters as well
- [ ] next up will be reorganise layout of main panel
- [ ] this is a flexbox layout scenario
- [ ] simplify current layout 
- [ ] then implement flexbox layout
- [ ] ensure that node colouring does not include the background colour
- [ ] mouse right click on node shows detail
- [ ] on-hover for buttons should show an explanation of what the button actually does

## Key Actions Checklist:

- [ ] Make header rock steady
- [ ] Make main panel fit screen
- [ ] Add y-scolling as appropriate
- [ ] Check all pages for conformance
- [ ] Revisit buttons on sigma-eplorer

## screen layout

```text
 
 +---------------------------------------------------------------+  
 |  HEADER NAV (Fixed Height)                                    |  
 |  [Logo] [Vis Link] [Docs Link]                  [Settings]    |  
 +---------------------------------------------------------------+  
 |  EXPANDO PANEL CONTAINER (Fills remaining 100vh)              |  
 |                                                               |  
 |  +--------+ +-------------------------------------+ +-------+ |  
 |  | LEFT   | |            CENTER AREA              | | RIGHT | |  
 |  | SIDE   | |                                     | | SIDE  | |  
 |  | BAR    | |         (The Neuro-Map)             | | BAR   | |  
 |  |        | |                                     | |       | |  
 |  | (Narr. | |                                     | | (Docs | |  
 |  |  List) | |                                     | |  Info)| |  
 |  |        | |                                     | |       | |  
 |  |        | |                                     | |       | |  
 |  |Scroll: | |                                     | |Scroll:| |  
 |  | Auto   | |                                     | | Auto  | |  
 |  +--------+ +-------------------------------------+ +-------+ |  
 |      ^                        ^                         ^     |  
 |  (Toggles)             (Auto-Expands)              (Toggles)  |  
 |      |                        |                         |     |  
 |   [State A]               [Always]                 [State B]  |  
 |      OR                       |                        OR     |  
 |   [Hidden]                [Full Width]             [Hidden]   |  
 +---------------------------------------------------------------+

```



