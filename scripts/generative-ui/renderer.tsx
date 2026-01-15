/** @jsxImportSource hono/jsx */
import type { ScreenDef } from './layout-engine';

const StatCard = ({ title, value, trend, trendDirection }: any) => (
  <div className="stat-card">
    <h3>{title}</h3>
    <p className="value">{value}</p>
    {trend && <span className={`trend ${trendDirection}`}>{trend}%</span>}
  </div>
);

const DataGrid = ({ title, columns, rows, actions }: any) => (
  <div className="data-grid">
    {title && <h3>{title}</h3>}
    <table>
      <thead>
        <tr>
          {columns.map((col: string) => <th key={col}>{col}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row: any, idx: number) => (
          <tr key={idx}>
            {columns.map((col: string) => <td key={col}>{row[col]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MarkdownViewer = ({ content }: { content: string }) => (
  <div className="markdown" dangerouslySetInnerHTML={{ __html: content }} />
);

const ActionPanel = ({ prompt, buttons }: any) => (
  <div className="action-panel">
    <p>{prompt}</p>
    <div className="buttons">
      {buttons.map((btn: any, idx: number) => (
        <button key={idx} onClick={() => console.log('Action:', btn)}>
          {btn.label}
        </button>
      ))}
    </div>
  </div>
);

export const RenderScreen = ({ data }: { data: ScreenDef }) => {
  return (
    <div id="reify-root" className="p-4 space-y-8">
      <h1 className="text-2xl font-bold">{data.screenTitle}</h1>
      
      {data.sections.map((section) => (
        <section key={section.id} className={`layout-${section.layout}`}>
          {section.title && <h2>{section.title}</h2>}
          
          {section.children.map((component, idx) => {
            // Pattern Matching on the discriminated union
            switch (component.type) {
              case 'StatCard':
                return <StatCard {...component.props} />;
              case 'DataGrid':
                return <DataGrid {...component.props} />;
              case 'Markdown':
                return <MarkdownViewer content={component.props.content} />;
              case 'ActionPanel':
                return <ActionPanel {...component.props} />;
              default:
                return null;
            }
          })}
        </section>
      ))}
    </div>
  );
};