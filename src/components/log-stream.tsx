import { Suspense } from "hono/jsx";
import { PipelineRow, StatCard } from "./data-display";

// --- THE PROTOCOL ---
// This is the JSON shape your backend script must output
export type StreamMessage =
	| {
			type: "log";
			level: "info" | "warn" | "error";
			message: string;
			timestamp: string;
	  }
	| {
			type: "stat";
			label: string;
			value: string | number;
			trend?: "up" | "down";
	  }
	| {
			type: "pipeline";
			name: string;
			status: "idle" | "active" | "error";
			metric: string;
	  };

// --- THE COMPONENT ---
interface LogStreamProps {
	streamUrl: string; // The API endpoint emitting JSONL
}

export const LogStream = ({ streamUrl }: LogStreamProps) => {
	return (
		<div className="font-mono text-sm space-y-2 p-4 bg-black min-h-[50vh] border border-gray-800 rounded-sm">
			<div className="text-gray-500 mb-4 border-b border-gray-800 pb-2 flex justify-between">
				<span> CONNECTING TO STREAM: {streamUrl}</span>
				<span className="animate-pulse text-green-500">● LIVE</span>
			</div>

			{/* The Magic: Client-side EventSource to consume the stream */}
			<script
				dangerouslySetInnerHTML={{
					__html: `
        (async () => {
          const container = document.currentScript.parentElement;
          const decoder = new TextDecoder();
          
          try {
            const response = await fetch('${streamUrl}');
            const reader = response.body.getReader();
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\\n').filter(line => line.trim() !== '');
              
              for (const line of lines) {
                try {
                  const data = JSON.parse(line);
                  const el = document.createElement('div');
                  
                  // Simple Client-Side Rendering logic (The "Adapter")
                  if (data.type === 'log') {
                    el.className = \`py-1 \${data.level === 'error' ? 'text-red-500' : 'text-gray-400'}\`;
                    el.innerHTML = \`<span class="opacity-50">[\${data.timestamp}]</span> \${data.message}\`;
                  } 
                  else if (data.type === 'stat') {
                    el.className = "inline-block mr-4 mb-4";
                    // Just dumping raw HTML for simplicity (In a real app, use a proper template)
                    el.innerHTML = \`
                      <div class="border border-gray-700 p-2 min-w-[120px] bg-gray-900">
                        <div class="text-[10px] uppercase text-gray-500">\${data.label}</div>
                        <div class="text-xl font-bold text-white">\${data.value}</div>
                      </div>\`;
                  }
                  else if (data.type === 'pipeline') {
                     const color = data.status === 'active' ? 'bg-green-500' : 'bg-red-500';
                     el.innerHTML = \`
                      <div class="flex justify-between border-b border-gray-800 py-2">
                        <span>\${data.name}</span>
                        <div class="flex items-center gap-2">
                          <span>\${data.metric}</span>
                          <span class="w-2 h-2 rounded-full \${color}"></span>
                        </div>
                      </div>\`;
                  }
                  
                  container.appendChild(el);
                  // Auto-scroll to bottom (The "Console" behavior)
                  window.scrollTo(0, document.body.scrollHeight);
                  
                } catch (e) {
                  console.error("JSON Parse Error", e);
                }
              }
            }
          } catch (err) {
            const errEl = document.createElement('div');
            errEl.className = "text-red-500 font-bold mt-4";
            errEl.innerText = "> STREAM CONNECTION LOST";
            container.appendChild(errEl);
          }
        })();
      `,
				}}
			/>
		</div>
	);
};
