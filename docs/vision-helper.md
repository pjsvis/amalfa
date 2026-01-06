Please implement a "Vision Helper" script to help you read our Terminal Brutalist design system programmatically.

TASK:
Inject the following JavaScript code into the bottom of our main `index.html` (before the closing </body> tag) or our main entry script. 

CONTEXT:
We use a high-contrast "Terminal Brutalist" theme with strict ANSI colors. Since `getComputedStyle` is hard for agents to deduce during interaction, this script exposes a global `window.__AGENT_THEME__` object containing our exact palette and interaction rules.

CODE TO INJECT:

<script>
// AGENT VISIBILITY HELPER
// Exposes the "Terminal Brutalist" theme so agents can read resolved styles.
window.__AGENT_THEME__ = (() => {
  const root = getComputedStyle(document.documentElement);
  const getVar = (name) => root.getPropertyValue(name).trim();

  return {
    system: "PolyVis Terminal Brutalist",
    palette: {
      canvas:    getVar('--ansi-black'),       // #0C0C0C
      text:      getVar('--ansi-white'),       // #CCCCCC
      highlight: getVar('--ansi-bright-white'),// #FFFFFF
      error:     getVar('--ansi-red'),         // #C50F1F
      success:   getVar('--ansi-green'),       // #16C60C
      warning:   getVar('--ansi-yellow'),      // #C19C00
      agent:     getVar('--ansi-orange'),      // #FF8C00 (The "Ghost in the Machine")
    },
    rules: {
      borderRadius: '0px', // HARD RULE: No rounded corners.
      fontFamily: getVar('--font-mono'),
      borders: '2px solid', // HARD RULE: Thick borders only.
    },
    // The "Hover State" cheat sheet for interaction
    interactive: {
      button: {
        description: "Hard inversion on hover. Instant transition.",
        default: { 
          bg: getVar('--ansi-black'), 
          text: getVar('--ansi-white'), 
          border: getVar('--ansi-white') 
        },
        hover: { 
          bg: getVar('--ansi-white'), 
          text: getVar('--ansi-black'), 
          border: getVar('--ansi-white') 
        }
      }
    }
  };
})();
console.log('%c[AGENT_THEME] System Visible', 'color: #FF8C00');
</script>