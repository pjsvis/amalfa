# Marked.js Playbook

> **Version**: v17+
> **Focus**: Browser/ESM Usage

## 1. Core Usage

### Basic Parsing
```javascript
import { marked } from 'marked';

const html = marked.parse('# Hello World');
```

### Async Parsing (if using async extensions)
```javascript
const html = await marked.parse('# Hello World', { async: true });
```

## 2. Configuration (`marked.use`)

Apply options, extensions, and hooks globally.

```javascript
marked.use({
  gfm: true,
  breaks: true,
  silent: false
});
```

## 3. Custom Renderers (v17+ Signature)

**Crucial**: In v17+, renderer methods receive a single object argument, not positional arguments.

### Heading Renderer
```javascript
const renderer = {
  heading({ tokens, depth, raw }) {
    // Use this.parser.parseInline(tokens) to get inner HTML
    const text = this.parser.parseInline(tokens);
    const slug = text.toLowerCase().replace(/[^\w]+/g, '-');
    
    return `<h${depth} id="${slug}">
              <a href="#${slug}" class="anchor">#</a>
              ${text}
            </h${depth}>`;
  }
};

marked.use({ renderer });
```

### Link Renderer
```javascript
const renderer = {
  link({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<a href="${href}" title="${title || ''}" target="_blank">${text}</a>`;
  }
};
```

## 4. Hooks & Extensions

### Preprocess (Front-matter handling)
Modify markdown *before* lexing.

```javascript
marked.use({
  hooks: {
    preprocess(markdown) {
      // Example: Strip front-matter
      return markdown.replace(/^---[\s\S]*?---\n/, '');
    }
  }
});
```

### Postprocess (Sanitization)
Modify HTML *after* parsing.

```javascript
import DOMPurify from 'isomorphic-dompurify';

marked.use({
  hooks: {
    postprocess(html) {
      return DOMPurify.sanitize(html);
    }
  }
});
```

## 5. Lexer Access

Access tokens directly for inspection or custom processing.

```javascript
const tokens = marked.lexer('# Heading');
console.log(tokens); 
// [{ type: 'heading', depth: 1, text: 'Heading', ... }]
```

## 6. Common Pitfalls

-   **`text.toLowerCase is not a function`**: You are likely using the old renderer signature `heading(text, level)`. Update to `heading({ tokens, depth })` and use `this.parser.parseInline(tokens)`.
-   **Async Extensions**: If an extension is async, you *must* await `marked.parse()`.