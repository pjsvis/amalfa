/**
 * Shared Navigation Component
 * 
 * Usage:
 *   <div id="nav-component"></div>
 *   <script src="/components/nav.js"></script>
 *   <script>initNav({ currentPage: 'dashboard' });</script>
 * 
 * Or as ES module:
 *   <script type="module">
 *     import { initNav } from '/components/nav.js';
 *     initNav({ currentPage: 'dashboard' });
 *   </script>
 */

const NAV_ITEMS = [
  { id: 'dashboard', label: 'DASHBOARD', href: '/', icon: '◉' },
  { id: 'lexicon', label: 'LEXICON', href: '/lexicon.html', icon: '◈' },
  { id: 'graph', label: 'GRAPH', href: '/sigma-explorer/', icon: '◎' },
  { id: 'docs', label: 'DOCS', href: '/docs/', icon: '◫' },
  { id: 'about', label: 'ABOUT', href: '/meta/about.html', icon: '○' },
];

function createNavHTML(options = {}) {
  const { currentPage = '', compact = false } = options;
  
  const itemsHTML = NAV_ITEMS.map(item => {
    const isActive = currentPage === item.id || 
                     (currentPage === '' && item.id === 'dashboard');
    const activeClass = isActive ? ' class="active"' : '';
    return `<a href="${item.href}"${activeClass}>${compact ? '' : item.icon + ' '}${item.label}</a>`;
  }).join('');

  return `
<nav class="site-nav">
  <div class="nav-brand">AMALFA</div>
  <div class="nav-links">${itemsHTML}</div>
  <div class="nav-meta">v1.5.1</div>
</nav>`;
}

function initNav(options = {}) {
  const container = document.getElementById('nav-component');
  if (container) {
    container.innerHTML = createNavHTML(options);
  }
  // Also try site-nav if no nav-component found
  const nav = document.querySelector('.site-nav');
  if (nav) {
    nav.outerHTML = createNavHTML(options);
  }
}

// Auto-init if loaded as script
if (typeof document !== 'undefined') {
  const currentPath = window.location.pathname;
  const pageMap = {
    '/': 'dashboard',
    '/dashboard': 'dashboard',
    '/lexicon.html': 'lexicon',
    '/sigma-explorer/': 'graph',
    '/sigma-explorer/index.html': 'graph',
    '/docs/': 'docs',
    '/docs/index.html': 'docs',
    '/about': 'about',
    '/meta/about.html': 'about',
  };
  const currentPage = pageMap[currentPath] || '';
  
  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initNav({ currentPage }));
  } else {
    initNav({ currentPage });
  }
}

export { createNavHTML, initNav, NAV_ITEMS };
