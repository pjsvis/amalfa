/** @jsx jsx */
import { jsx } from 'hono/jsx';

export const SmartBlock = ({ content, hash, size = 'std', title }: any) => {
  const id = `block_${hash}`;
  const width = size === 'long' ? '60ch' : '40ch';
  
  return (
    <article 
      id={id} 
      data-component="block"
      data-size={size}
      role="region"
      aria-labelledby={`${id}_label`}
      class="bg-bg border border-border antialiased"
    >
      <style>{`
        #${id} {
          width: ${width};
          height: fit-content;
          min-height: 0;
          padding: 1ch;
          margin-bottom: var(--spacing-lh);
          line-height: var(--spacing-lh);
          overflow-y: auto;
          interpolate-size: allow-keywords;
        }
      `}</style>

      <header class="flex justify-between opacity-40 text-[9px] mb-2 select-none">
        <span>TYPE::DATA_BLOCK</span>
        <span>REF::{id}</span>
      </header>

      <div 
        role="document" 
        class="markdown-body"
        dangerouslySetInnerHTML={{ __html: Bun.Markdown.render(content) }} 
      />
    </article>
  );
};

export const Collapsible = ({ title, children, hash, open = false }: any) => {
  const id = `coll_${hash}`;
  
  return (
    <details 
      id={id} 
      open={open} 
      data-component="collapsible" 
      class="border border-border"
    >
      <style>{`
        #${id} {
          width: fit-content;
          height: fit-content;
          min-height: 0;
          margin-bottom: var(--spacing-lh);
          interpolate-size: allow-keywords;
        }
        #${id} summary {
          background: var(--color-border);
          color: var(--color-bg);
          padding: 0.2lh 1ch;
          cursor: pointer;
          font-weight: bold;
          list-style: none;
        }
      `}</style>

      <summary role="button" aria-expanded={open ? "true" : "false"}>
        <span class="opacity-50 font-mono">{open ? '[-]' : '[+]'}</span> {title}
      </summary>
      
      <section role="region">
        {children}
      </section>
    </details>
  );
};