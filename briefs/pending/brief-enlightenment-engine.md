### Project Brief: The Enlightenment Engine

**Codename:** `SCOT.TERM`
**Objective:** To build a sovereign, aesthetic, "Slow TV" installation that perpetually cycles through the wisdom of the Scottish Enlightenment.

---

### 1. The Corpus (The "Stuff")

We need high-volume, high-quality text. We are not just looking for "famous quotes"; we want deep cuts, paragraphs of reasoning, and sudden strikes of clarity.

**The Authors (The "Gang"):**

* **Francis Hutcheson:** The Moral Sense. (Key Vibe: Benevolence, Virtue).
* **David Hume:** The Great Skeptic. (Key Vibe: Reason vs. Passion, Causality).
* **Adam Smith:** The Observer. (Key Vibe: Sympathy, Markets, Sentiments).
* **Thomas Reid:** The Common Sense. (Key Vibe: Perception, Reality).
* **Adam Ferguson:** The Historian. (Key Vibe: Civil Society, Corruption).
* *Strictly Excluded:* Jeremy Bentham (The Utility Man).

**Sourcing Strategy:**

1. **Project Gutenberg:** Download the full `.txt` versions of *The Theory of Moral Sentiments*, *A Treatise of Human Nature*, etc.
2. **The "Wisdom Miner" (Super-Grep):** We write a simple script to extract paragraphs between 100-500 characters.
3. **Manual Curation:** We review the "mined" blocks and delete the boring ones (e.g., "In the previous chapter we discussed..."). We keep the gold.

---

### 2. The Schema (The Structure)

We store the wisdom in a local SQLite file (`enlightenment.db`). It is relational, typed, and portable.

**Table: `wisdom**`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PK` | Unique ID. |
| `author` | `TEXT` | e.g., "DAVID HUME" (Used for Color Logic). |
| `text` | `TEXT` | The quote itself. |
| `work` | `TEXT` | The source book (e.g., "Treatise"). Optional. |
| `length` | `INTEGER` | Character count (Used to calculate "Reading Time"). |

---

### 3. The Build System (The "Press")

We use **Bun** + **TypeScript** to mint the database. This script runs once (or whenever we add new texts).

* **Input:** A folder `corpus/` containing `hume.txt`, `smith.txt`, etc.
* **Process:**
1. Reads each file.
2. Splits content by double-newlines (paragraphs).
3. Filters out garbage (too short/too long).
4. Injects into `enlightenment.db`.


* **Output:** A single binary file: `enlightenment.db` (~5MB).

---

### 4. The UI (The Terminal)

A single `index.html` file. No frameworks. No build step. Just the DOM and the Ghost of the 18th Century.

**The "Flavin" Logic (Color Mapping):**
The interface changes its entire color palette based on who is speaking.

* **Hutcheson:** Phosphor Green (`#33ff00`) — *Nature/Virtue*
* **Hume:** Ice Blue (`#00ffff`) — *Cool Skepticism*
* **Smith:** Amber Gold (`#ffaa00`) — *Value/Commerce*
* **Reid:** Stark White (`#ffffff`) — *Common Sense*
* **Ferguson:** Magenta (`#ff00ff`) — *Civic Passion*

**The Animation (The "Glitch"):**

* **Decrypt:** Text resolves **Right-to-Left** (from the future).
* **Jitter:** Variable-width characters (Japanese/Math symbols) cause the text string to mechanically vibrate as it decrypts.
* **Dissolve:** Text erodes back into noise **Left-to-Right** before vanishing.

**The Pacing (Slow TV):**

* It is not a slideshow. It is an installation.
* **State 1:** Darkness (2s).
* **State 2:** Decrypting (3s).
* **State 3:** Display (Reading Time + 5s "Soak" time).
* **State 4:** Dissolving (2s).
* *Repeat.*

---

### 5. Next Actions

1. **You:** Scrape Project Gutenberg for the texts.
2. **Me (Future Session):** Provide the "Wisdom Miner" regex script to clean the raw text.
3. **We:** Drop the files into the `polyvis` repo, run the Press, and deploy the HTML.

**Ctx / Session Closed.**
*Exitus Acta Probat.*