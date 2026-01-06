# Agent Operational Protocols

This document outlines the core operational protocols governing the actions of any AI agent working on the `polyvis` project. These rules are non-negotiable and serve as the foundation for a safe, predictable, and effective collaborative workflow.

## 1. DOSP-CTX: Destructive Operation Safeguard Protocol

- **Principle:** No destructive file system operation shall be executed without explicit, prior user confirmation. This protocol is the highest priority.
- **Scope:** Destructive operations include, but are not limited to, file deletion (`rm`), file overwriting (`mv`, `cp`, or writing over an existing file), and file renaming (`mv`).
- **Workflow:**
  1.  An agent may identify a file that it believes is a candidate for a destructive operation (e.g., a temporary file).
  2.  The agent **must not** perform the operation.
  3.  The agent must first present its reasoning for the proposed operation to the user and explicitly ask for permission to proceed.
  4.  Only after receiving unambiguous, affirmative consent from the user for that specific operation may the agent proceed.

## 2. FNIP: File Naming Integrity Protocol

- **Principle:** The canonical names and paths of existing project files are not to be altered.
- **Workflow:**
  1.  An agent must not propose or execute the renaming or moving of any existing file unless explicitly directed to do so by the user.
  2.  The existing file structure is to be treated as the source of truth.

## 3. DCVP: Directive Comprehension & Verification Protocol

- **Principle:** An agent must demonstrate full comprehension of a user's entire directive before taking action. Partial or selective comprehension is a failure state.
- **Workflow:**
  1.  Upon receiving a directive from the user, the agent must process and understand all parts of the request, including all attached context and explicit instructions.
  2.  Before generating a final implementation plan or checklist, the agent should, where appropriate, restate its understanding of the requirements to give the user an opportunity to correct any misinterpretations.
  3.  The agent's proposed plan must reflect the totality of the user's instructions.

## 4. UFP: User Finality Protocol

- **Principle:** The user is the final arbiter of project requirements and implementation correctness. An agent's proposal is a suggestion, not a final decision.
- **Workflow:**
  1.  If a user states that an implementation is incorrect, incomplete, or does not meet their needs, the agent must immediately halt its current path.
  2.  The agent must treat the user's feedback as the new ground truth.
  3.  The agent must re-evaluate the problem based on the user's corrective feedback and propose a new plan that directly addresses the user's critique.

## 5. TTP: Task Tracking Protocol

- **Principle:** All active development tasks must be tracked using `_CURRENT_TASK.md` to ensure context preservation and progress visibility.
- **Workflow:**
  1.  **Initialization:** At the start of a new task, `_CURRENT_TASK.md` must be initialized with the objective and a checklist of key actions.
  2.  **Tracking:** As work progresses, the checklist in `_CURRENT_TASK.md` must be updated to reflect the current state.
  3.  **Completion:** Upon task completion, a debrief document must be created in the `debriefs/` directory summarizing the work, and `_CURRENT_TASK.md` should be reset for the next task.
  4.  **Documentation:** Relevant playbooks must be updated to reflect any new knowledge or patterns discovered during the task.

## 6. CMP: Console Monitoring Protocol

- **Principle:** Browser console logs must be monitored during web application development to quickly identify errors and verify functionality. "No-errors" is a strict requirement prior to proceeding.
- **Workflow:**
  1.  **Capability Check:** If the agent has the capability to capture console logs (e.g., via browser tools), it **must** do so.
  2.  **Initial Pass:** To avoid data overload, the agent should first perform a high-level check for the presence of errors vs. a clean log.
  3.  **Error Investigation:** If errors are present, the agent must investigate and resolve them immediately.
  4.  **Gatekeeper:** A "no-errors" state in the console is a mandatory requirement before marking any frontend task as complete or proceeding to the next step.sting should always include a console log capture step.

## 7. AFP: Alpine.js First Protocol

- **Principle:** All UI interactivity and state management must be implemented using Alpine.js. Imperative DOM manipulation (e.g., `document.getElementById`, `addEventListener`) is strictly prohibited for UI logic.
- **Workflow:**
  1.  **State Management:** Use `x-data` for component state.
  2.  **Event Handling:** Use `@click`, `@change`, etc., instead of `addEventListener`.
  3.  **DOM Access:** Use `$refs` if direct DOM access is absolutely necessary (e.g., for third-party libs like Sigma or Viz).
  4.  **Shared Logic:** Use `Alpine.data` for reusable logic or shared components.

## 8. NCVP: No Completion Without Verification Protocol

- **Principle:** No task shall be marked as complete until its success has been explicitly verified.
- **Workflow:**
  1.  **Verification First:** Before marking a task as `[x]` in `task.md` or `_CURRENT_TASK.md`, the agent must perform a verification step.
  2.  **Test Confirmation:** This verification must include running relevant tests (automated or manual) and confirming they pass.
  3.  **Visual Confirmation:** For UI changes, the agent must verify the visual result (e.g., via screenshot or user confirmation) before closing the task.
  4.  **Explicit Statement:** The agent must explicitly state "Tests passed" or "Verification successful" in the final `notify_user` message.
  5.  **Regression Guarding:** When modifying core infrastructure (e.g., database schema, graph logic), the FIRST verification step is **"Baseline Preservation."** You must confirm that *existing* functionality remains unchanged BEFORE verifying the *new* feature.
      *   *Constraint:* "First, do no harm."
      *   *Action:* Explicitly state: "Baseline functionality verified: [Describe what was checked]."

## 9. SWP: Session Wrap-up Protocol

- **Principle:** Every significant session or task completion must be formally concluded to ensure knowledge transfer and context preservation.
- **Workflow:**
  1.  **Debrief Creation:** A debrief document may be drafted in the root as `DEBRIEF.md` for visibility during the session. However, it **must** be moved to the `debriefs/` directory (e.g., `debriefs/YYYY-MM-DD-topic.md`) before the session concludes.
  2.  **Task Update:** `_CURRENT_TASK.md` must be updated to reflect the latest status. This should be done as often as practicable during the session, but is mandatory at wrap-up.
  3.  **Workbench Cleanup:** The root directory is a temporary workbench. Any "SHOUTY" working files (e.g., `DEBRIEF.md`, `TODO.md`) or temporary test files (e.g., `layout-test.html`) must be tidied away (moved to appropriate folders or deleted) to leave the project in a clean state.

## 10. CVP: CSS Variable Protocol

- **Principle:** All tweakable UI values (dimensions, colors, spacing) must be defined as variables in `src/css/layers/theme.css`. Hardcoded "magic numbers" in component or layout files are prohibited.
- **Workflow:**
  1.  **Identification:** When styling a component, identify values that might need tuning (e.g., sidebar width, header height, specific colors).
  2.  **Extraction:** Define a semantic variable in `src/css/layers/theme.css` (e.g., `--sidebar-width`).
  3.  **Usage:** Use the `var(--variable-name)` in the component's CSS layer.
  4.  **Centralization:** `theme.css` is the single source of truth for the application's visual configuration.

## 11. PMP: Port Management Protocol

- **Directive:** If Port 3000 is in use when starting the dev server, KILL the process occupying it.
    
## 12. EVP: Empirical Verification Protocol

- **Directive:** Do not guess. Verify. The "truth" is what the environment (browser, runtime, or library) actually does, not what you assume it does.

- **Workflow (UI Debugging):**
    - **Action:** When diagnosing UI issues, you MUST use the browser tools to inspect computed styles.
    - **Reasoning:** Theoretical CSS debugging is prohibited when a live environment is available.

- **Workflow (External API / Library Debugging):**
    - **Context:** When integrating with an external library (especially a beta or poorly documented one), repeated `TypeError` or `ValidationError`s are signs of a flawed mental model.
    - **Action Sequence:**
        1.  **Stop Guessing:** After a maximum of two failed attempts based on assumptions, halt immediately. Do not try a third guess.
        2.  **Verify Dependency Stability:** Check for the existence of `bun.lockb`. If it is missing, run `bun install` to generate it. This ensures a known, reproducible state.
        3.  **Find the Ground Truth:** Navigate to `node_modules/` and locate the library's TypeScript definition files (`.d.ts`). **This is the primary source of truth.** Read the type definitions for the relevant classes and methods to understand their exact names, parameters, and return types.
        4.  **Decode Validation Errors:** Treat `SDKValidationError` or similar errors as explicit instructions from the library. Analyze the error's `path` and `expected` properties to precisely correct the structure of your request payload. Do not guess the structure.
        5.  **Isolate (If Necessary):** If the API contract is still unclear, create a temporary scratchpad file (e.g., `SCRATCHPAD_api_discovery.ts`) to run a minimal, isolated test against the specific method in question.

- **Workflow (System Documentation):**
    - **Context:** When creating documentation that describes a system or process (e.g., a data pipeline), the documentation is an abstraction of that system. An error in the documentation is as significant as an error in the code.
    - **Action:** You MUST read and fully comprehend the source code of the system being documented (e.g., a build script's configuration) before writing the description.
    - **Reasoning:** Making assumptions about a system's behavior for documentation purposes is a violation of the "Do not guess. Verify." directive. The documentation must reflect the ground truth of the implementation.

## 13. GEP: Granular Execution Protocol

- **Directive:** When fixing regressions or performing complex refactors, proceed one isolated step at a time.
- **Workflow:**
    1.  Diagnose one specific issue.
    2.  Propose the fix.
    3.  Apply the fix.
    4.  Verify the fix.
    5.  Only then move to the next issue.
- **Reasoning:** Prevents compounding errors and "bounding ahead" without validation.

## 14. TFP: Theme First Protocol

- **Principle:** `src/css/layers/theme.css` is the **Control Center** for the application's design. It is the single source of truth for all tweakable values.
- **Workflow:**
  1.  **Check:** Before styling, check `theme.css` for an existing variable.
  2.  **Tweak:** If a variable exists, adjust it there to propagate changes globally.
  3.  **Propose:** If no variable exists, propose creating a new semantic variable in `theme.css`.
  4.  **Prohibition:** Do not hardcode "magic numbers" (pixels, hex codes) in component CSS or HTML.

## 15. DSP: Design Sanity Protocol

-   **Principle:** Design is an iterative process of emotional translation, not a single technical execution. To maintain sanity and quality:
-   **Workflow:**
    1.  **Translate:** Convert emotional keywords ("fun", "clean", "inviting") into technical primitives (spacing, rounded corners, whitespace).
    2.  **Isolate:** Break the design into isolated components (e.g., "The Card", "The Stack").
    3.  **Iterate:** Apply one change at a time (e.g., "Just the spacing", then "Just the font size").
    4.  **Verify:** Visually confirm each micro-step before proceeding. Do not batch 10 design changes without looking.
    5.  **Control:** Use `theme.css` as the mixing board. Tweak variables to find the "sweet spot" without touching the DOM.

## 16. BFP: Bun First Protocol

-   **Principle:** Bun is the designated runtime and package manager. `npm`, `yarn`, or `pnpm` are prohibited unless strictly necessary.
-   **Workflow:**
    1.  **Commands:** Always use `bun run`, `bun install`, `bun add`.
    2.  **Scripts:** Ensure all `package.json` scripts are compatible with Bun.
    3.  **Performance:** Leverage Bun's speed for builds and dev servers.

## 17. BCP: Browser Capabilities Protocol

- **Principle:** Agents must explicitly verify browser capabilities and network access boundaries before making assumptions about the environment.
- **Context:**
    - `getComputedStyle` is permitted on `localhost` without user prompts.
    - External domains (e.g., `example.com`) may be accessible despite `browserAllowList.txt` restrictions.
- **Workflow:**
    1.  **Verify:** When using browser APIs, verify they work as expected in the current environment.
    2.  **Monitor:** Keep a vigilant eye on network requests. If external access is detected where it should be restricted, note it.
    3.  **No Assumptions:** Do not assume `browserAllowList.txt` guarantees isolation.

## 18. RAP: Reality Alignment Protocol

- **Principle:** If an agent attempts a fix 3 times without a verified change in outcome, it **must** stop, revert, and switch to an isolation/investigation mode.
- **Context:**
    -   **The Illusion of Progress:** Furiously editing code and running commands without observable changes indicates a flawed mental model.
    -   **Process Smells:**
        -   *The Spin Cycle:* Editing the same file 3+ times with different guesses.
        -   *The Silent Failure:* Commands succeed but output doesn't change.
        -   *The Complexity Spiral:* Adding code to fix a bug that shouldn't exist.
- **Workflow:**
    1.  **Monitor:** Count your attempts at a specific fix.
    2.  **Trigger:** If Attempt #3 fails to produce the expected result: **STOP**.
    3.  **Revert:** Undo the "guesswork" changes.
    4.  **Isolate:** Switch to a "Clean Room" strategy (see `playbooks/problem-solving-playbook.md`) to verify the component in isolation.
    5.  **Verify:** Only return to the main codebase once the fix is proven in isolation.

## 19. SEP: Secret Exclusivity Protocol

-   **Principle:** API keys, tokens, and other secrets must never be hardcoded in source files or checked into version control. They must be managed exclusively through environment variables.
-   **Workflow:**
    1.  **Identification:** When an API key or other secret is required, identify it as sensitive information.
    2.  **Storage:** Store the secret in a `.env` file in the project root. The variable name should be prefixed with the service it relates to (e.g., `MISTRAL_API_KEY`).
    3.  **Gitignore:** Ensure `.env` is listed in the project's `.gitignore` file to prevent it from being committed.
    4.  **Access:** In the code (e.g., Bun, Node.js), access the secret using `process.env.VARIABLE_NAME`.
    5.  **Validation:** The code must include a check to ensure the environment variable is present at runtime and throw a clear error if it is missing.
    6.  **Prohibition:** Do not, under any circumstances, write the secret value directly into a script, log file, or any other artifact that could be committed.


**20. OCIP: Operational Context Initialization Protocol**

* **Principle:** To prevent "vibe coding" and ensure adherence to the project's specific architecture (e.g., "Zero Magic," "Alpine-First"), the agent must perform **Constraint Stacking** and **Context Initialization** before executing any task. Intelligence is not in the model's weights; it is in the project's Playbooks.
* **Workflow:**
    1.  **Constraint Stacking:** The agent shall treat the protocols in `AGENTS.md` as the "Base Layer" of its operating system, explicitly overriding default training biases (e.g., the tendency to use `npm` instead of `bun`, or React instead of Alpine).
    2.  **Domain Identification:** The agent must analyze the user's request to identify the active technical domains (e.g., CSS, State Management, Data Ingestion, Graph Logic).
    3.  **Playbook Ingestion:** Based on the identified domains, the agent **must** read the canonical Playbook(s) from the `playbooks/` directory *before* proposing a solution.
        * *CSS Task?* $\rightarrow$ Read `playbooks/css-zero-magic-playbook.md`.
        * *UI Interaction?* $\rightarrow$ Read `playbooks/alpinejs-playbook.md`.
        * *Graph Logic?* $\rightarrow$ Read `playbooks/graphology-playbook.md`.
    4.  **Confirmation:** The agent must explicitly state which Contexts have been initialized (e.g., *"Context Initialized: Loaded CSS & Alpine Playbooks"*).

## 21. FLIP: File Length Integrity Protocol

- **Principle:** Source files must remain small (target < 300 lines) to ensure AI agent comprehension, prevent context window overflows, and ensure safe refactoring. Monolithic files (> 500 lines) are a **critical failure state** that leads to "context blindness" and destructive hallucinations.
- **Workflow:**
    1.  **Monitor:** Actively monitor file length during development.
    2.  **Trigger:** If a file approaches 300 lines, flag it for immediate refactoring.
    3.  **Refactor:** Split logic into modular components (e.g., `data.js`, `ui.js`, `logic.js`) *before* adding new features.
    4.  **Prohibition:** Do not attempt to "patch" a file that exceeds 500 lines using standard replacement tools. You **must** switch to a modular refactoring strategy immediately.
