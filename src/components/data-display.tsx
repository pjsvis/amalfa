import type {
  PipelineRowProps,
  StatCardProps,
  SystemStatus,
} from "./ai-system";

const statusConfig: Record<SystemStatus, { color: string; label: string }> = {
  idle: { color: "bg-gray-600", label: "IDLE" },
  active: { color: "bg-green-500 animate-pulse", label: "RUNNING" },
  warning: { color: "bg-yellow-500", label: "WARNING" },
  error: { color: "bg-red-500", label: "ERROR" },
};

export const PipelineRow = ({
  name,
  status,
  lastUpdated,
  metric,
}: PipelineRowProps) => {
  const { color, label } = statusConfig[status];

  return (
    <div className="group flex items-center justify-between p-3 border border-gray-800 bg-neutral-900/30 hover:border-gray-600 transition-colors rounded-sm">
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div
          className={`w-2.5 h-2.5 rounded-sm ${color}`}
          title={label}
        />

        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-200">{name}</span>
          <span className="text-[10px] uppercase tracking-widest text-gray-500">
            {label}
          </span>
        </div>
      </div>

      <div className="text-right flex flex-col items-end">
        <span className="font-mono text-green-500 text-sm">{metric}</span>
        <span className="text-xs text-gray-600">{lastUpdated}</span>
      </div>
    </div>
  );
};

export const StatCard = ({ label, value, trend }: StatCardProps) => (
  <div className="border border-gray-800 bg-neutral-900 p-4 min-w-[200px] flex-1 rounded-sm">
    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">
      {label}
    </div>
    <div className="text-2xl font-bold text-white font-mono">{value}</div>
    {trend && (
      <div
        className={`text-xs mt-2 ${trend === "up" ? "text-green-500" : "text-red-500"}`}
      >
        {trend === "up" ? "▲" : "▼"} Trend
      </div>
    )}
  </div>
);
