# markdown components

Some examples of creating components in markdown using regex rather than React [markdown-ui](https://github.com/BlueprintLabIO/markdown-ui)

```typescript
// OH-041: Optimal Simplicity - No AST, just Regex.
export function parseEnlightenedUi(markdown: string): string {
  
  // 1. Button Groups:
  // ```markdown-ui-widget
  // button-group "Play Card" ["Ace" "King"]
  // ```
  // Becomes: <div class="btn-group"><button...>...
  markdown = markdown.replace(
    /```markdown-ui-widget\s+button-group\s+"([^"]+)"\s+\[(.*?)\]\s+```/g, 
    (_, label, optionsRaw) => {
      // Parse ["Ace" "King"] -> Array
      const options = optionsRaw.match(/"([^"]+)"/g).map(s => s.replace(/"/g, ''));
      
      const buttons = options.map(opt => 
        // DATASTAR MAGIC: The on-click action is server-side
        `<button 
            class="btn btn-outline" 
            data-on-click="$$post('/play/${opt.toLowerCase()}')">
            ${opt}
         </button>`
      ).join('\n');

      return `
        <fieldset class="p-4 border rounded">
            <legend>${label}</legend>
            <div class="flex gap-2">
                ${buttons}
            </div>
        </fieldset>
      `;
    }
  );

  // 2. Selects (The "Select Env" example)
  markdown = markdown.replace(
    /```markdown-ui-widget\s+select\s+(\w+)\s+\[(.*?)\]\s+```/g,
    (_, name, optionsRaw) => {
       const options = optionsRaw.match(/"([^"]+)"/g).map(s => s.replace(/"/g, ''));
       const optsHtml = options.map(o => `<option value="${o}">${o}</option>`).join('');
       
       return `
         <select name="${name}" data-on-change="$$post('/update/${name}')">
            ${optsHtml}
         </select>
       `;
    }
  );

  return markdown;
}
````

```typescript
// OH-041: Optimal Simplicity - SVG is just text.
export function parseEnlightenedUi(markdown: string): string {
  
  // ... (Previous button logic) ...

  // 3. Bar Charts (The "Stat Comparison")
  // Usage:
  // ```markdown-ui-widget
  // chart type="bar" labels=["Hume" "Kant" "Smith"] values=[80 40 90] color="#2563eb"
  // ```
  markdown = markdown.replace(
    /```markdown-ui-widget\s+chart\s+type="bar"\s+labels=\[(.*?)\]\s+values=\[(.*?)\]\s+(?:color="([^"]+)")?\s*```/g,
    (_, labelsRaw, valuesRaw, color) => {
      const labels = labelsRaw.match(/"([^"]+)"/g).map(s => s.replace(/"/g, ''));
      const values = valuesRaw.match(/\d+/g).map(Number);
      const barColor = color || '#3b82f6'; // Default enlightenment blue
      
      const height = 150;
      const width = 400;
      const barWidth = (width / values.length) - 10;
      const maxVal = Math.max(...values);

      const bars = values.map((val, i) => {
        const barH = (val / maxVal) * (height - 30); // Scale to fit
        const x = i * (width / values.length);
        const y = height - barH - 20; // 20px padding for labels
        
        return `
          <g>
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="${barColor}" rx="4" />
            <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="white">${val}</text>
            <text x="${x + barWidth/2}" y="${height}" text-anchor="middle" font-size="12" fill="#9ca3af">${labels[i]}</text>
          </g>
        `;
      }).join('\n');

      return `
        <div class="p-4 bg-gray-900 rounded-lg border border-gray-700">
          <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto">
            ${bars}
          </svg>
        </div>
      `;
    }
  );

  return markdown;
}
```