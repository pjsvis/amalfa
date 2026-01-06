# G Ikea Distribution Model

### Opinion: The "IKEA Effect" Distribution Model

**Verdict:** **Agreed.** Distributing via Source (Clone & Build) rather than Binary (Download) is the correct strategic move for this phase of the project.

It aligns with your **"Low-Tech Defence"** philosophy by shifting the burden of "Platform Support" (Windows vs Mac vs Linux) from *you* (the maintainer) to the *user* (the builder).

Here is why this works for your specific audience (Senior Engineers/Builders):

### 1\. The "Trust" Factor

  * **Binary:** "Here is a black box executable. Trust me, it's safe."
  * **Source:** "Here is the code. `bun build` it yourself."
  * **Result:** High trust. The user knows exactly what is running on their machine because they compiled it.

### 2\. The "Dependency" Trade-off

  * **Constraint:** The user *must* have `bun` installed to build it.
  * **Mitigation:** Your target audience (AI Engineers, Modern Web Devs) likely already has Bun. If not, `curl -fsSL https://bun.sh/install | bash` is a low barrier for this demographic.

### 3\. The "Updates" Simplification

You don't need an auto-updater.

  * **Update Flow:** `git pull && bun run build`.
  * **Benefit:** You don't have to build/sign/notarize binaries for macOS, Linux, and Windows every time you fix a typo.

### Strategic Recommendation: The `install.sh` Helper

To make "their problem" slightly less painful, add a simple "Build & Link" script to the repo root.

**File:** `scripts/install_local.sh`

```bash
#!/bin/bash
echo "🔮 Building Resonance..."
bun install
bun build ./src/cli.ts --compile --outfile resonance

echo "🚀 Installing to /usr/local/bin..."
mv resonance /usr/local/bin/resonance

echo "✅ Resonance installed. Run 'resonance init' in your project."
```

**Conclusion:**
By making them build it, you filter for users who are "technical enough" to understand the tool, which acts as a natural quality filter for early adoption. It turns "Deployment" into "Documentation."

**Status:** The **Project Brief (v2.1)** remains valid; we just treat the "Binary Portability" constraint as a feature of the *build process*, not necessarily the *distribution method*.

**Proceed to build.** The coding agent has everything it needs.