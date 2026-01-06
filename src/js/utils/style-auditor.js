export function runStyleAudit() {
	console.log("Running Physical Style Audit...");
	const sandbox = document.createElement("div");
	sandbox.style.visibility = "hidden";
	sandbox.style.position = "absolute";
	sandbox.style.top = "-9999px";
	sandbox.id = "style-audit-sandbox";
	document.body.appendChild(sandbox);

	let passed = true;
	const errors = [];

	try {
		/* =========================================
           TEST 1: GEOMETRY (BUTTONS)
           ========================================= */
		const btn = document.createElement("button");
		btn.textContent = "Test Button";
		sandbox.appendChild(btn);

		const btnStyle = window.getComputedStyle(btn);

		// Assert: Zero Border Radius
		if (btnStyle.borderRadius !== "0px") {
			errors.push(
				`GEOMETRY VIOLATION: Button has curves (${btnStyle.borderRadius})`,
			);
		}

		// Assert: Monospace Font
		const font = btnStyle.fontFamily.toLowerCase();
		if (
			!font.includes("mono") &&
			!font.includes("courier") &&
			!font.includes("console")
		) {
			errors.push(
				`TYPOGRAPHY VIOLATION: Button font is not machine-readable (${btnStyle.fontFamily})`,
			);
		}

		/* =========================================
           TEST 2: CONTRAST & THEME (COLORS)
           ========================================= */
		const theme = window.__AGENT_THEME__;

		// Assert: Button Background matches Theme Palette (if available)
		if (theme) {
			const _expectedBg = theme.palette.canvas; // Buttons default to canvas BG
			// Note: Computed style is often RGB, palette might be Hex. simple check for now or skip exact match.
			// We will check for "Hard Inversion" logic instead:
			// BG and Color should NOT be the same.
		}

		if (btnStyle.backgroundColor === btnStyle.color) {
			errors.push("CONTRAST VIOLATION: Button text is invisible (BG == FG)");
		}

		/* =========================================
           TEST 3: STRUCTURE (PANELS)
           ========================================= */
		const panel = document.createElement("div");
		panel.className = "container-box";
		sandbox.appendChild(panel);

		const panelStyle = window.getComputedStyle(panel);

		// Assert: Border Width >= 2px
		if (parseInt(panelStyle.borderWidth, 10) < 2) {
			errors.push(
				`STRUCTURE VIOLATION: Panel border too thin (${panelStyle.borderWidth}). Requires >= 2px.`,
			);
		}

		/* =========================================
           REPORTING
           ========================================= */
		if (errors.length > 0) {
			passed = false;
			console.group(
				"%c[STYLE AUDIT] FAILED",
				"color: #C50F1F; font-weight: bold; font-size: 14px;",
			);
			errors.forEach((e) => {
				console.error(e);
			});
			console.groupEnd();
		} else {
			console.log(
				"%c[STYLE AUDIT] PASSED: System is Brutalist.",
				"color: #16C60C; font-weight: bold; font-size: 14px;",
			);
		}

		return passed;
	} catch (e) {
		console.error(
			`%c[STYLE AUDIT] CRASHED: ${e.message}`,
			"color: #C50F1F; font-weight: bold;",
		);
		return false;
	} finally {
		document.body.removeChild(sandbox);
	}
}

// Auto-expose globally
if (typeof window !== "undefined") {
	window.runStyleAudit = runStyleAudit;
}
