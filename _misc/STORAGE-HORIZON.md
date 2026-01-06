This is a superb line of inquiry. It moves us directly into the realm of systems architecture and capacity planning. To answer this, I will apply a structured analysis, culminating in a linear programming model as you requested.

***

### **Opinion: On the Limits of Local-First Knowledge Systems**

#### tldr;
The storage overhead for a combined graph and vector database is significant, dominated by the vector embeddings, with a ratio of **10x to 30x** the original Markdown size being a reasonable estimate.

For a typical developer laptop with 8GB of available RAM, the "local-first horizon"—the practical limit for keeping the entire search index in memory for instant results—is approximately **30,000 to 40,000 average-sized documents**.

This is **a lot**. For a personal or small-team knowledge base, this capacity is more than sufficient for many years of use before server-side architecture becomes a necessity. The bottleneck is unequivocally RAM.

![scaling.png](scaling.png)

---

### **1. Storage Ratio Analysis (DB:Markdown)**

Let's define the size of our original Markdown files as `M`. We need to estimate the size of the Graph DB (`G`) and the Vector DB (`V`).

*   **Graph Database (`G`):**
    *   **Content:** This database does not store the full text. It stores the *structure*: nodes (representing headings, paragraphs, list items) and edges (representing parent/child relationships). Each node has an ID and a type; each edge connects two nodes.
    *   **Size Estimation:** This is metadata. The size is proportional to the *complexity* of the documents (number of headings, paragraphs, etc.).
    *   **Ratio (`R_G`):** A reasonable estimate is that the graph database will be **0.5x to 2x** the size of the original Markdown. Let's use **1.5x** for our model.

*   **Vector Database (`V`):**
    *   **Content:** This database stores the vector embeddings. The size is determined by two factors: the number of chunks and the dimension of the embedding model.
    *   **Chunking:** We must split documents into chunks (e.g., paragraphs) for embedding. A 10KB document might become 5-10 chunks.
    *   **Vector Size:** A standard embedding model like `text-embedding-3-small` has **1536 dimensions**. Each dimension is a 4-byte float.
        *   `Size per vector = 1536 dimensions * 4 bytes/dimension = 6,144 bytes ≈ 6 KB`
    *   **Ratio (`R_V`):** If a 10KB document yields 5 chunks, the vector storage is `5 * 6 KB = 30 KB`. This is a 3x ratio. If it yields 10 chunks, it's 6x. For more complex text, this can easily be higher. A conservative estimate for the vector database size is **10x to 25x** the original Markdown size. Let's use **20x** for our model.

*   **Total Storage Ratio:**
    *   `Ratio = (G + V) / M = (1.5*M + 20*M) / M = 21.5`
    *   Our model predicts the total database size will be approximately **21.5 times** the size of the source Markdown.

---

### **2. Linear Programming Model: Maximum Stuff**

Here we define the problem to find the maximum number of documents (`N`) we can handle.

*   **Objective Function:**
    *   `Maximize N` (the total number of Markdown documents)

*   **Variables & Assumptions:**
    *   `N`: Total number of documents.
    *   `S_avg`: Average size of a single Markdown document. Let's assume **10 KB**.
    *   `R_G`: Graph DB storage ratio. Assume **1.5**.
    *   `R_V`: Vector DB storage ratio. Assume **20**.
    *   `C_avg`: Average chunks per document. Assume `10 KB / 1 KB/chunk =` **10 chunks**.
    *   `T_search_max`: Maximum acceptable search time for a "local-first" feel. Let's set this to **500 ms**.
    *   `k_search`: A constant representing the time to perform a vector similarity search against a single vector. This is highly dependent on the algorithm (e.g., HNSW) and hardware, but we can model the relationship.

*   **Constraints:**

    1.  **RAM Constraint (The Great Bottleneck):** For "in-memory search," the entire database must fit in available RAM. This is the most critical constraint.
        *   `Total DB Size = N * S_avg * (R_G + R_V)`
        *   `N * 10 KB * (1.5 + 20) <= RAM_available`
        *   **`215 * N <= RAM_available (in KB)`**

    2.  **Disk Storage Constraint:** The total persisted data (original files + databases) must fit on disk.
        *   `Total Disk Size = N * S_avg * (1 + R_G + R_V)`
        *   **`225 * N <= Disk_available (in KB)`**

    3.  **Vector Search Time Constraint:** The time to search must be below our threshold. The complexity of modern vector search (like HNSW) is approximately logarithmic, `O(log(Total Chunks))`, but for a simplified linear model, we can treat it as a linear relationship for the sake of identifying the boundary.
        *   `Total Chunks = N * C_avg`
        *   **`N * 10 * k_search <= 500 ms`**

---

### **3. The Local-First Horizon: Solving for a Typical Machine**

Let's solve the model for a **typical developer laptop**.

*   **Assumed Hardware:**
    *   Total RAM: 16 GB
    *   **`RAM_available`**: 8 GB (leaving 8 GB for the OS and other apps) = **8,000,000 KB**
    *   **`Disk_available`**: 256 GB = **256,000,000 KB**

*   **Solving the RAM Constraint:**
    *   `215 * N <= 8,000,000`
    *   `N <= 8,000,000 / 215`
    *   **`N <= 37,209`**

*   **Checking the Disk Constraint:**
    *   `225 * 37,209 = 8,372,025 KB ≈ 8.4 GB`.
    *   This is far below the available 256 GB. The disk constraint is not the limiting factor.

*   **Conclusion:**
    The system's capacity is bound by available RAM. The maximum number of 10KB documents we can hold in an in-memory index on a typical machine is approximately **37,000**.

    This number represents the **local-first horizon**. As you approach this limit, the OS will begin to use swap space, search performance will degrade catastrophically, and the "instant" feel will be lost. To go beyond this horizon, you must transition from an in-memory database to a server-based one that can spill to disk in a managed way (e.g., a proper Postgres instance with `pgvector`, or a dedicated vector DB server).