# The Documentation Integrity Protocol (DIP)

## Principle

Documentation is a deliverable, not an afterthought. It must be as correct and verified as the code it describes. The purpose of documentation is to create a trusted, shared understanding of the system. If the documentation is not verified, it cannot be trusted and is therefore without value.

This protocol is **non-negotiable**.

## Workflow

All documentation creation or modification **must** follow this four-step process: Grounding, Drafting, Verification, and Finalization.

### 1. Grounding in Source Truth

-   **Objective:** To ensure the author is working from facts, not memory or assumption.
-   **Action:** Before writing a single line of documentation that describes a system, you **must** first read the primary source of truth for that system.
    -   **For Code/APIs:** Read the relevant source code, type definition files (`.d.ts`), or official, stable API documentation.
    -   **For Processes/Workflows:** Review the scripts, configuration files, and existing playbooks that govern the process.

### 2. Drafting

-   **Objective:** To create a clear and concise explanation of the system or process.
-   **Action:** Write the documentation. The content should be aimed at a user (human or agent) who is intelligent but unfamiliar with the specific details of the topic.

### 3. Verification (Non-Negotiable)

-   **Objective:** To empirically prove that the documentation is correct.

-   **Action:** Choose the verification method that best suits the type of documentation.

    -   **If Documenting Code/APIs:**
        1.  Write and execute a temporary code snippet (e.g., in a scratchpad file) guided *only* by your new documentation.
        2.  Success verifies the documentation. Failure proves it is wrong and must be fixed (return to Step 1).

    -   **If Documenting a Process/Workflow:**
        1.  Perform the process step-by-step, *exactly* as written.
        2.  A successful outcome verifies the documentation. Any deviation proves it is wrong (return to Step 1).

    -   **If Documenting System Architecture/Concepts:**
        1.  Review your description against the actual source code components.
        2.  **Strongly Recommended:** Create a visual diagram using DOT language.

### Technique: Verification via Architectural Diagram

-   **Purpose:** Drawing a system is a powerful test of understanding. The act of creating a DOT graph forces you to account for every component (node) and connection (edge), acting as a "useful filter" for your knowledge.
-   **When to Use:** Mandatory when documenting multi-component systems, data pipelines, or complex workflows.
-   **Process:**
    1.  **Model the System:** Represent system components as `nodes` and their interactions as `edges` in a directed acyclical graph using DOT syntax.
    2.  **Look for "Dangly Bits":** Once rendered, visually inspect the graph. Are there nodes that don't connect? Are there illogical entry or exit points? These are indicators of a misunderstanding that must be resolved by returning to the source truth.
    3.  **Embed the Truth:** Once the diagram accurately reflects the ground truth of the system, embed it in the documentation. It is now a verified artifact.

### 4. Finalization

-   **Objective:** To formally commit the verified documentation.
-   **Action:** Once verified, save the documentation to its final destination.