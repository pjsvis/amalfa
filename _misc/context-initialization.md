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
