export default () => ({
	viz: null,
	dotInput: "",
	status: "Initializing System...",
	error: "",
	hasOutput: false,
	loaded: false,
	templates: {
		process: `digraph PolyVis {
      rankdir=TB;
      node [shape=box, style="filled", fillcolor="white", fontname="Courier", margin="0.2,0.1", penwidth=1];
      edge [fontname="Courier", fontsize=10];

      Input [label="Stuff (Input)", shape=plaintext];
      Output [label="Things (Output)", shape=plaintext];

      subgraph cluster_process {
          label = "PolyVis Process";
          style=dashed;
          color=grey;
          fontname="Courier";

          Analyze [label="Analyze\\n(Deconstruct)"];
          Structure [label="Structure\\n(Reassemble)"];
          Fold [label="Fold\\n(Refine)"];
      }

      Input -> Analyze;
      Analyze -> Structure;
      Structure -> Fold;
      Fold -> Output;
  }`,
		stack: `digraph PersonaStack {
      rankdir=TB;
      node [shape=record, fontname="Courier", margin="0.2,0.1", style=filled, fillcolor="white"];
      edge [fontname="Courier", fontsize=10];

      User [label="User (pjsvis)", shape=ellipse, fillcolor="#eee"];

      subgraph cluster_stack {
          label="The Persona Stack";
          style=solid;

          Persona [label="{Persona Layer|{CDA|CL}|Identity & Heuristics}"];
          Skin [label="{Skin Layer|{UI|Visuals}|Interface}"];
          Sleeve [label="{Sleeve Layer|{System Prompt|Tools}|Orchestration}"];
          Substrate [label="{Substrate Layer|{LLM|Compute}|Raw Intelligence}"];
      }

      User -> Skin [label="Interacts"];
      Skin -> Sleeve;
      Sleeve -> Persona;
      Persona -> Substrate;
  }`,
		network: `graph Network {
      layout=neato;
      overlap=false;
      node [shape=circle, style=filled, fillcolor="black", fontcolor="white", fontname="Courier", fixedsize=true, width=0.8];
      edge [color="#555"];

      Node1 [label="Poly"];
      Node2 [label="Vis"];
      Node3 [label="Data"];
      Node4 [label="Logic"];
      Node5 [label="Code"];

      Node1 -- Node2 [penwidth=3];
      Node1 -- Node3;
      Node2 -- Node4;
      Node3 -- Node5;
      Node4 -- Node5;
      Node2 -- Node5;
      Node3 -- Node4;
  }`,
	},

	init() {
		setTimeout(() => {
			this.loaded = true;
		}, 50);
		this.$nextTick(() => {
			if (window.lucide) window.lucide.createIcons();
		});
		try {
			if (typeof Viz === "undefined")
				throw new Error("Viz library not loaded.");
			this.viz = new Viz();
			this.status = "Ready.";
			this.$nextTick(() => {
				this.loadTemplate("process");
			});
		} catch (e) {
			console.error("Viz init failed:", e);
			this.status = `<span class="text-red-500">System Error: ${e.message}</span>`;
		}
	},

	debug: false, // Added for layout debug mode

	loadTemplate(name) {
		if (this.templates[name]) {
			this.dotInput = this.templates[name];
			this.render();
		}
	},

	render() {
		const dotString = this.dotInput.trim();
		this.status = "Processing...";
		this.error = "";
		this.hasOutput = false;
		this.$refs.graphOutput.innerHTML =
			'<p class="font-mono text-xs text-gray-400">Processing...</p>';

		if (!dotString) {
			this.status = "Input Empty.";
			this.$refs.graphOutput.innerHTML =
				'<p class="font-mono text-xs text-gray-400">Input Empty.</p>';
			return;
		}

		if (!this.viz) {
			this.error = "Error: Engine not initialized.";
			return;
		}

		this.viz
			.renderSVGElement(dotString)
			.then((element) => {
				this.$refs.graphOutput.innerHTML = "";
				// element.setAttribute("width", "100%");
				// element.setAttribute("height", "100%");
				this.$refs.graphOutput.appendChild(element);
				this.hasOutput = true;
				this.status = "";
			})
			.catch((error) => {
				console.error(error);
				this.$refs.graphOutput.innerHTML = "";
				this.error = `SYNTAX ERROR: ${error.message}`;
			});
	},

	saveSVG() {
		const svg = this.$refs.graphOutput.querySelector("svg");
		if (!svg) return;
		if (!svg.getAttribute("xmlns"))
			svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
		const data = new XMLSerializer().serializeToString(svg);
		const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "polyvis_graph.svg";
		a.click();
		URL.revokeObjectURL(url);
	},

	savePNG() {
		const svg = this.$refs.graphOutput.querySelector("svg");
		if (!svg) return;
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const tempSvg = svg.cloneNode(true);
		const bbox = svg.getBBox();
		const scale = 2;
		const padding = 40;
		canvas.width = (bbox.width + padding) * scale;
		canvas.height = (bbox.height + padding) * scale;
		tempSvg.setAttribute("width", canvas.width);
		tempSvg.setAttribute("height", canvas.height);
		tempSvg.setAttribute(
			"viewBox",
			`${bbox.x - padding / 2} ${bbox.y - padding / 2} ${bbox.width + padding} ${bbox.height + padding}`,
		);
		const data = new XMLSerializer().serializeToString(tempSvg);
		const img = new Image();
		img.onload = () => {
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0);
			const a = document.createElement("a");
			a.href = canvas.toDataURL("image/png");
			a.download = "polyvis_graph.png";
			a.click();
		};
		img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(data)))}`;
	},
});
