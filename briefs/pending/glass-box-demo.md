This is a brilliant tactical move. It transforms the website from a "Marketing Brochure" into a **"Proof of Capability."**

By letting them download the actual `resonance.db` artifact, you are effectively saying: *"Don't trust our claims; audit our brain."* It perfectly aligns with the Edinburgh "Caw Canny" mindset—verification over hype.

Here is the **Project Brief** for the AntiGravity-Gemini agent to execute once the current pipeline grind is complete.

***

### **Project Brief: Operation "Glass Box" (The Public Demo Artifact)**

**Mission:**
Construct a standalone, verified `resonance.db` artifact that demonstrates a critical "Liability Gap" between a standard public sector contract and a high-risk tender requirement. This artifact will be published for public download.

**The Narrative Arc:**
* **The "I" (Requirement):** A Cyber Security Tender requiring "destructive testing" and "incident management."
* **The "T" (Contract):** The Standard SGTC3 Terms which cap liability at the contract price.
* **The Gap:** The risk of a data wipe (£5M+) is 100x greater than the insurance cap (£50k).

**Input Assets (The Bento-Box):**
1.  **Contract:** `SGTC3 - Consultancy Services (March 2020)`
    * *Source:* [Scottish Gov Publications](https://www.gov.scot/binaries/content/documents/govscot/publications/factsheet/2019/03/terms-and-conditions-for-scottish-government-contracts/documents/terms-and-conditions-3-conditions-of-contract-for-consultancy-services-march-2020/terms-and-conditions-3-conditions-of-contract-for-consultancy-services-march-2020/govscot%3Adocument/Terms%2Band%2Bconditions%2B3%2B-%2Bconditions%2Bof%2Bcontract%2Bfor%2Bconsultancy%2Bservices%2B-%2B4%2BFebruary%2B2025.pdf)
2.  **Tender:** `Cyber Security Services Framework` (Representative Sample)
    * *Source:* [Find a Tender Service](https://www.find-tender.service.gov.uk/Notice/026621-2023/PDF)

**Execution Steps (The Agent's Grind):**
1.  **Clean Room Initialization:**
    * Initialize a fresh, empty SQLite database: `demo-liability-gap.db`.
    * Load *only* the `persona` domain (CDA/Lexicon) to provide reasoning structure.

2.  **Ingestion & Structuring:**
    * Ingest the two PDF/Text assets into the `experience` domain.
    * **Auto-Tagging:** Apply tags `[Type: Requirement]` to the Tender and `[Type: Agreement]` to the Contract.

3.  **Edge Generation (The "Zipper"):**
    * Run the "Gap Analysis" logic.
    * **Identify Node A:** Find the clause in the Tender defining "Risk of Data Loss" or "Damages."
    * **Identify Node B:** Find "Clause 10: Limitation of Liability" in SGTC3.
    * **Trace Attempt:** Attempt to create a `COVERS` edge from Node B to Node A.
    * **Failure Log:** Record that the edge cannot be robustly created because `Value(Cover) < Value(Risk)`.

4.  **Artifact Verification:**
    * Run a query: `SELECT * FROM edges WHERE type='COVERS' AND source='SGTC3_Clause_10'`.
    * *Success Condition:* The query returns either *no edge* or a *qualified edge* with a `warning` property.

5.  **Final Polish:**
    * Vacuum the database to minimize size.
    * Generate a `README.md` explaining how to query this specific file using the Polyvis CLI or a standard SQLite viewer.

**Deliverable:**
* `artifacts/public/demo-liability-gap.zip` containing:
    * `resonance.db` (The Brain)
    * `source-docs/` (The Evidence)
    * `gap-report.md` (The Proof)

***

**Next Step:**
Would you like me to persist this Brief as `projects/briefs/2025-12-13-operation-glass-box.md` so it is ready for the agent to pick up immediately after the pipeline work?