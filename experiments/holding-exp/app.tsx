import {
	ArrowDown,
	ArrowUp,
	CloudRain,
	Droplets,
	MapPin,
	Minus,
	Moon,
	RefreshCw,
	Sun,
	Thermometer,
	Waves,
	Wind,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GridCard } from "./components/GridCard";
import { InsightCard } from "./components/InsightCard";
import { LocationSelector } from "./components/LocationSelector";
import { fetchInsight, fetchTideData } from "./services/geminiService";
import { fetchEnvironmentalData } from "./services/weatherService";
import { LOCATIONS, type LocationDashboardData, LocationDef } from "./types";

// --- Types & Constants ---
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 Hour
const CACHE_PREFIX = "omniview_v2_"; // New cache version

interface CacheEntry {
	timestamp: number;
	data: LocationDashboardData;
}

// --- Components ---

const LoadingSkeletonLine: React.FC<{ width?: string }> = ({
	width = "w-full",
}) => (
	<div className={`h-4 bg-slate-800/50 rounded animate-pulse ${width}`}></div>
);

const TideLevelVisual: React.FC<{ status: string; height: string }> = ({
	status,
	height,
}) => {
	const isRising = status === "Rising";
	const isFalling = status === "Falling";

	let waterHeight = "50%";
	if (isRising) waterHeight = "70%";
	if (isFalling) waterHeight = "30%";
	if (height === "--") waterHeight = "50%";

	const colorClass = isRising
		? "text-sky-400"
		: isFalling
			? "text-indigo-400"
			: "text-sky-200";
	const bgGradient = isRising
		? "from-sky-500/20 to-sky-600/20"
		: "from-indigo-500/20 to-indigo-600/20";

	return (
		<div className="relative w-full flex-1 min-h-[160px] bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 mb-4 flex flex-col justify-between group">
			<div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] z-0"></div>
			<div
				className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-in-out z-10`}
				style={{ height: waterHeight }}
			>
				<div className="absolute -top-5 left-0 w-[200%] h-12 overflow-hidden animate-wave">
					<svg
						viewBox="0 0 1200 120"
						preserveAspectRatio="none"
						className={`w-full h-full ${colorClass} opacity-30 fill-current`}
					>
						<path d="M0,0 C150,60 350,0 600,30 C850,60 1050,0 1200,30 V120 H0 V0 Z" />
					</svg>
				</div>
				<div
					className={`w-full h-full bg-gradient-to-t ${bgGradient} backdrop-blur-[1px]`}
				></div>
			</div>
			<div className="relative z-20 p-4 flex flex-col justify-between h-full items-start w-full">
				<div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-sm mb-auto">
					{isRising && (
						<ArrowUp className="text-sky-400 animate-pulse" size={18} />
					)}
					{isFalling && (
						<ArrowDown className="text-indigo-400 animate-pulse" size={18} />
					)}
					{!isRising && !isFalling && (
						<Minus className="text-slate-400" size={18} />
					)}
					<span className="text-lg font-bold text-white tracking-wide">
						{status}
					</span>
				</div>
				<div className="text-xs font-mono text-sky-200 bg-sky-900/60 px-2 py-1 rounded border border-sky-700/30 self-end">
					Max {height}
				</div>
			</div>
		</div>
	);
};

// --- Main App ---

const App: React.FC = () => {
	const [selectedLocId, setSelectedLocId] = useState<string>(LOCATIONS[0].id);
	const [data, setData] = useState<LocationDashboardData | null>(null);
	const [isUpdating, setIsUpdating] = useState<boolean>(false);
	const [insightLoading, setInsightLoading] = useState<boolean>(false);

	// Debug Mode State
	const [debugMode, setDebugMode] = useState<boolean>(false);

	// Helper to get full location object
	const getLocDef = (id: string) => LOCATIONS.find((l) => l.id === id)!;

	// Initial State: Default empty data structure
	const getEmptyData = (): LocationDashboardData => ({
		weather: {
			temperature: "--",
			condition: "Loading...",
			windSpeed: "--",
			cloudCover: "--",
		},
		sun: {
			sunrise: "--:--",
			sunset: "--:--",
			goldenHourMorning: "--:--",
			goldenHourEvening: "--:--",
		},
		moon: { phase: "--", rise: "--:--", illumination: "--" },
		tides: {
			firstHigh: "--:--",
			firstLow: "--:--",
			secondHigh: "--:--",
			secondLow: "--:--",
			heightHigh: "--",
			status: "Slack",
		},
		insight: null,
		lastUpdated: "--:--",
	});

	// Enable Debug Mode with Shift + D
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.shiftKey && e.key.toLowerCase() === "d") {
				setDebugMode((prev) => !prev);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const loadData = useCallback(async (locId: string, force = false) => {
		const locDef = getLocDef(locId);
		const cacheKey = `${CACHE_PREFIX}${locId}`;
		const cachedString = localStorage.getItem(cacheKey);
		let currentData = getEmptyData();
		let needFetch = true;

		// 1. Try Cache
		if (cachedString) {
			const entry: CacheEntry = JSON.parse(cachedString);
			currentData = entry.data;
			setData(entry.data); // Immediate Render

			const age = Date.now() - entry.timestamp;
			if (!force && age < CACHE_DURATION_MS) {
				needFetch = false;
			}
		} else {
			setData(currentData);
		}

		if (!needFetch) return;

		setIsUpdating(true);
		setInsightLoading(true);

		try {
			// A. Fast Data (Weather/Sun/Moon)
			const envPromise = fetchEnvironmentalData(locDef);
			// B. Medium Data (Tides)
			const tidePromise = fetchTideData(locDef.name);

			const [envData, tideData] = await Promise.all([envPromise, tidePromise]);

			const newData: LocationDashboardData = {
				...currentData,
				...envData,
				tides: tideData,
				lastUpdated: new Date().toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				}),
			};

			setData(newData);
			localStorage.setItem(
				cacheKey,
				JSON.stringify({ timestamp: Date.now(), data: newData }),
			);

			// C. Slow Data (Insight)
			const insight = await fetchInsight(locDef.name, newData);

			const finalData = { ...newData, insight };
			setData(finalData);
			localStorage.setItem(
				cacheKey,
				JSON.stringify({ timestamp: Date.now(), data: finalData }),
			);
		} catch (e) {
			console.error("Data update chain failed", e);
		} finally {
			setIsUpdating(false);
			setInsightLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData(selectedLocId);
	}, [selectedLocId, loadData]);

	// Background Prefetch
	useEffect(() => {
		const timer = setTimeout(() => {
			LOCATIONS.forEach((loc) => {
				if (loc.id === selectedLocId) return;
				const key = `${CACHE_PREFIX}${loc.id}`;
				if (!localStorage.getItem(key)) {
					console.log("Background prefetching:", loc.name);
					fetchEnvironmentalData(loc).then((env) => {
						fetchTideData(loc.name).then((tides) => {
							const empty = getEmptyData();
							const data = {
								...empty,
								...env,
								tides,
								lastUpdated: "Background",
							};
							localStorage.setItem(
								key,
								JSON.stringify({ timestamp: Date.now(), data }),
							);
						});
					});
				}
			});
		}, 3000);
		return () => clearTimeout(timer);
	}, [selectedLocId]);

	return (
		<div className="min-h-screen p-4 sm:p-6 md:p-8 max-w-7xl mx-auto relative">
			{/* Debug Mode Injector */}
			{debugMode && (
				<style>{`
          * { outline: 1px solid rgba(255, 0, 0, 0.4) !important; }
        `}</style>
			)}

			{debugMode && (
				<div className="fixed top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-50 font-mono">
					DEBUG MODE ACTIVE
				</div>
			)}

			<header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
				<div>
					<h1 className="text-4xl font-light tracking-tight text-white mb-2">
						Omni<span className="font-bold text-sky-400">View</span>
					</h1>
					<p className="text-slate-400 text-sm max-w-md">
						Atmospheric intelligence for photographers.
					</p>
				</div>

				<div className="flex flex-col items-start md:items-end gap-3">
					<LocationSelector
						currentLocationId={selectedLocId}
						onSelect={setSelectedLocId}
						disabled={isUpdating && !data}
					/>
					<div className="flex items-center gap-3">
						<button
							onClick={() => loadData(selectedLocId, true)}
							disabled={isUpdating}
							className="text-xs text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-1 group"
						>
							<RefreshCw
								size={12}
								className={`transition-all ${isUpdating ? "animate-spin text-sky-400" : "group-hover:rotate-180"}`}
							/>
							{isUpdating
								? "Updating..."
								: `Updated ${data?.lastUpdated || "--"}`}
						</button>
					</div>
				</div>
			</header>

			{/* NEW LAYOUT: 4 Columns. 
          Row 1: Conditions (1), Sun (1), Moon (1), Tides (Right col, span vertical).
          Row 2: Insight (Span 3)
      */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">
				{/* 1. CONDITIONS */}
				<GridCard
					title="Conditions"
					icon={<CloudRain size={16} />}
					className="lg:col-span-1"
				>
					{!data ? (
						<div className="animate-pulse bg-slate-800 h-24 rounded"></div>
					) : (
						<div className="flex flex-col justify-between h-full min-h-[140px]">
							<div className="flex items-start justify-between">
								<div>
									<div className="text-4xl font-light text-white">
										{data.weather.temperature}
									</div>
									<div className="text-sm text-slate-400 mt-1">
										{data.weather.condition}
									</div>
								</div>
								<Thermometer className="text-orange-400 opacity-80" size={24} />
							</div>
							<div className="grid grid-cols-2 gap-2 mt-4">
								<div className="bg-slate-900/40 p-2 rounded border border-slate-700/30">
									<div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
										<Wind size={10} /> Wind
									</div>
									<div className="text-sm text-slate-200">
										{data.weather.windSpeed}
									</div>
								</div>
								<div className="bg-slate-900/40 p-2 rounded border border-slate-700/30">
									<div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
										<Droplets size={10} /> Cloud
									</div>
									<div className="text-sm text-slate-200">
										{data.weather.cloudCover}
									</div>
								</div>
							</div>
						</div>
					)}
				</GridCard>

				{/* 2. SUN */}
				<GridCard
					title="Sun"
					icon={<Sun size={16} />}
					className="lg:col-span-1"
				>
					{!data ? (
						<div className="animate-pulse bg-slate-800 h-24 rounded"></div>
					) : (
						<div className="space-y-4 flex flex-col justify-center h-full min-h-[140px]">
							<div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
								<div>
									<div className="text-xs text-orange-400/80 mb-0.5">
										Sunrise
									</div>
									<div className="text-xl text-white font-medium">
										{data.sun.sunrise}
									</div>
								</div>
								<div>
									<div className="text-xs text-indigo-400/80 mb-0.5 text-right">
										Sunset
									</div>
									<div className="text-xl text-white font-medium text-right">
										{data.sun.sunset}
									</div>
								</div>
							</div>
							<div>
								<div className="flex items-center gap-2 mb-1">
									<span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
									<span className="text-xs text-slate-400 uppercase">
										Golden Hour
									</span>
								</div>
								<div className="text-sm text-slate-200 font-mono">
									{data.sun.goldenHourMorning}
								</div>
							</div>
						</div>
					)}
				</GridCard>

				{/* 3. MOON */}
				<GridCard
					title="Moon"
					icon={<Moon size={16} />}
					className="lg:col-span-1"
				>
					{!data ? (
						<div className="animate-pulse bg-slate-800 h-24 rounded"></div>
					) : (
						<div className="flex flex-col justify-between h-full gap-2 min-h-[140px]">
							<div className="flex items-center gap-4 mt-2">
								<div className="w-14 h-14 shrink-0 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center relative overflow-hidden shadow-inner">
									<div className="absolute inset-0 bg-slate-200 rounded-full opacity-10 translate-x-2"></div>
									<Moon size={20} className="text-slate-400" />
								</div>
								<div>
									<div className="text-base text-white font-medium leading-tight mb-1">
										{data.moon.phase}
									</div>
									<div className="text-xs text-slate-400">
										{data.moon.illumination} Illum.
									</div>
								</div>
							</div>
							<div className="text-xs text-slate-500 text-center bg-slate-900/30 py-2 rounded mt-2">
								Rise: {data.moon.rise}
							</div>
						</div>
					)}
				</GridCard>

				{/* 4. TIDES - Anchor Column (Vertical) */}
				<GridCard
					title="Tide Schedule"
					icon={<Waves size={16} />}
					className="lg:col-span-1 lg:row-span-2 bg-blue-950/20"
				>
					{!data ? (
						<div className="animate-pulse h-full bg-slate-800 rounded"></div>
					) : (
						<div className="flex flex-col h-full">
							<TideLevelVisual
								status={data.tides.status}
								height={data.tides.heightHigh}
							/>
							<div className="space-y-4 relative pl-2 pb-2 mt-2">
								<div className="absolute left-[15px] top-2 bottom-4 w-0.5 bg-slate-800"></div>

								<div className="relative pl-8 group">
									<div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] z-10"></div>
									<div className="flex justify-between items-baseline">
										<span className="text-xs text-sky-400 font-semibold">
											High Tide
										</span>
										<span className="text-lg text-white font-mono">
											{data.tides.firstHigh}
										</span>
									</div>
								</div>

								<div className="relative pl-8 group opacity-80">
									<div className="absolute left-2 top-2 w-2 h-2 rounded-full bg-slate-600 border border-slate-900 z-10"></div>
									<div className="flex justify-between items-baseline">
										<span className="text-xs text-slate-500">Low Tide</span>
										<span className="text-base text-slate-300 font-mono">
											{data.tides.firstLow}
										</span>
									</div>
								</div>

								{data.tides.secondHigh && data.tides.secondHigh !== "--:--" && (
									<div className="relative pl-8 group">
										<div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-sky-500/50 z-10"></div>
										<div className="flex justify-between items-baseline">
											<span className="text-xs text-sky-400/80">High Tide</span>
											<span className="text-base text-white/90 font-mono">
												{data.tides.secondHigh}
											</span>
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</GridCard>

				{/* 5. INSIGHT - Full Width Footer */}
				<GridCard
					title="Creative Proposal"
					icon={<Waves size={16} />}
					className="lg:col-span-3 bg-gradient-to-r from-slate-800 to-slate-900"
					noPadding={true}
				>
					{!data?.insight || insightLoading ? (
						<div className="flex-1 p-6 flex flex-col justify-center gap-4">
							{/* Skeleton Loading State - Subtle and Non-Intrusive */}
							{data?.insight ? (
								<div className="opacity-50 grayscale pointer-events-none h-full">
									<InsightCard insight={data.insight} />
								</div>
							) : (
								<div className="w-full h-full flex flex-col md:flex-row gap-6">
									<div className="flex-1 space-y-4">
										<LoadingSkeletonLine width="w-1/3" />
										<LoadingSkeletonLine width="w-3/4" />
										<LoadingSkeletonLine width="w-1/2" />
									</div>
									<div className="w-64 space-y-3">
										<LoadingSkeletonLine />
										<LoadingSkeletonLine />
									</div>
								</div>
							)}
							{insightLoading && (
								<div className="absolute top-6 right-6 flex items-center gap-2">
									<span className="relative flex h-2 w-2">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
										<span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
									</span>
									<span className="text-[10px] uppercase tracking-widest text-slate-500">
										AI Processing
									</span>
								</div>
							)}
						</div>
					) : (
						<InsightCard insight={data.insight} />
					)}
				</GridCard>
			</div>
			<footer className="mt-12 text-center text-slate-600 text-xs">
				<p>
					OmniView © {new Date().getFullYear()}. Weather data via Open-Meteo.
					Tide & Insight via Gemini.
				</p>
				<p className="mt-2 text-slate-700">Press Shift+D for Debug View</p>
			</footer>
		</div>
	);
};

export default App;
