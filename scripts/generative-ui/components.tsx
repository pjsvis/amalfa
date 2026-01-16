/** @jsxImportSource hono/jsx */
/**
 * components.tsx
 * The "Territory": Pure, server-side implementations of the REIFY Schema.
 */
import type { PropsWithChildren } from 'hono/jsx';
import type { ScreenDef } from './layout-engine';
import { 
  ComponentNodeSchema,
  StatCardSchema,
  DataGridSchema,
  ActionPanelSchema
} from './component-schema';
import { z } from 'zod';

// --- ATOMS ---

const Button = ({ label, endpoint, method, variant = 'primary' }: { 
  label: string; 
  endpoint: string; 
  method?: string;
  variant?: string;
}) => {
  const baseStyles = "px-4 py-2 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants: Record<string, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    default: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
  };

  // DataStar Magic: data-on-click triggers a fetch to the endpoint
  // We use the $$put/$$post helper syntax if you have the datastar macros, 
  // or standard data-fetchUrl. 
  // For V1 generic usage: data-on-click={`@${method.toLowerCase()}('${endpoint}')`}
  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.default}`}
      data-on-click={`@${method?.toLowerCase() || 'post'}('${endpoint}')`}
    >
      {label}
    </button>
  );
};

// --- MOLECULES ---

export const StatCard = (props: z.infer<typeof StatCardSchema>['props']) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">{props.title}</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">{props.value}</dd>
        {props.trend && (
          <div className={`mt-2 flex items-center text-sm ${
            props.trendDirection === 'up' ? 'text-green-600' : 
            props.trendDirection === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
             {props.trendDirection === 'up' ? '↑' : props.trendDirection === 'down' ? '↓' : '•'} 
             <span className="ml-1">{props.trend}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const DataGrid = (props: z.infer<typeof DataGridSchema>['props']) => {
  return (
    <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
      <div className="px-4 py-4 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{props.title || "Data View"}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {props.columns.map((col) => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {props.rows.map((row, i) => (
              <tr key={i}>
                {props.columns.map((col) => (
                  <td key={`${i}-${col}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ActionPanel = (props: z.infer<typeof ActionPanelSchema>['props']) => {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">{props.prompt}</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex gap-2">
          {props.buttons.map((btn, idx) => (
            <Button key={idx} {...btn} />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- THE RENDERER (Recursive/Dispatch) ---

export const ComponentDispatcher = ({ component }: { component: z.infer<typeof ComponentNodeSchema> }) => {
  switch (component.type) {
    case 'StatCard': return <StatCard {...component.props} />;
    case 'DataGrid': return <DataGrid {...component.props} />;
    case 'ActionPanel': return <ActionPanel {...component.props} />;
    case 'Markdown': return <div className="prose max-w-none">{component.props.content}</div>;
    default: return <div className="text-red-500">Unknown Component Type</div>;
  }
};

export const ScreenRenderer = ({ screen }: { screen: ScreenDef }) => {
  return (
    <div id="reify-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">{screen.screenTitle}</h1>
      {screen.sections.map((section) => (
        <section key={section.id} className="space-y-4">
          {(section.title || section.description) && (
            <div className="pb-2 border-b border-gray-200 mb-4">
              {section.title && <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>}
              {section.description && <p className="mt-1 text-sm text-gray-500">{section.description}</p>}
            </div>
          )}
          
          <div className={`grid gap-6 ${
            section.layout === 'two-column' ? 'lg:grid-cols-2' :
            section.layout === 'three-column' ? 'lg:grid-cols-3' :
            section.layout === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-4' : 
            'grid-cols-1'
          }`}>
            {section.children.map((child, idx) => (
              <ComponentDispatcher key={idx} component={child} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};