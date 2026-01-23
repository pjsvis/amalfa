# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: d1a5e50f-0c41-45a5-abe3-c9d3cc74ded4 -->

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

---

### [ ] Step: Create Provider Abstraction

Create the base provider interface and directory structure.

**Files to create:**
- `src/sidecars/lang-extract/providers/__init__.py`
- `src/sidecars/lang-extract/providers/base.py`

**Tasks:**
1. Create `providers/` directory
2. Implement abstract `LanguageModelProvider` base class
3. Define `extract_graph(text: str) -> str` interface
4. Create provider factory function in `__init__.py`

**Verification:**
- Base class is abstract (cannot be instantiated)
- Factory function can be imported

---

### [ ] Step: Extract Gemini Logic into Provider

Refactor existing Gemini code into the new provider pattern.

**Files to create/modify:**
- Create: `src/sidecars/lang-extract/providers/gemini.py`
- Modify: `src/sidecars/lang-extract/server.py`

**Tasks:**
1. Move Gemini logic from `server.py` to `gemini.py`
2. Implement `LanguageModelProvider` interface
3. Update `server.py` to use provider factory with Gemini
4. Ensure backward compatibility

**Verification:**
- Existing Gemini functionality works unchanged
- `GEMINI_API_KEY` still recognized
- No breaking changes to MCP tool interface

---

### [ ] Step: Implement Ollama Provider

Create the new Ollama provider with local and remote support.

**Files to create:**
- `src/sidecars/lang-extract/providers/ollama.py`

**Tasks:**
1. Implement `OllamaLanguageModelProvider` class
2. Add connection handling (local/remote URLs)
3. Implement authentication logic (API key, headers)
4. Add safety warnings (localhost + API key)
5. Implement error handling and timeouts
6. Format prompts for Ollama's `/api/generate` endpoint

**Verification:**
- Can connect to local Ollama (http://localhost:11434)
- Can connect to remote Ollama with API key
- Warning shown for unusual configurations
- Clear error messages on connection failures

---

### [ ] Step: Update Configuration and Dependencies

Update server.py and dependencies to support provider selection.

**Files to modify:**
- `src/sidecars/lang-extract/server.py`
- `src/sidecars/lang-extract/pyproject.toml`

**Tasks:**
1. Add provider selection logic based on env vars
2. Update `extract_graph` tool to use selected provider
3. Add `ollama` or `requests` to dependencies
4. Maintain backward compatibility (default to Gemini)

**Verification:**
- `LANGEXTRACT_PROVIDER` env var controls provider
- Falls back to Gemini if not specified
- Dependencies install correctly with `uv sync`

---

### [ ] Step: Integration Testing

Test the implementation end-to-end with TypeScript client.

**Files to create/modify:**
- Create: `scripts/test-langextract-ollama.ts` (test script)
- Modify: `src/lib/sidecar/LangExtractClient.ts` (pass env vars)

**Tasks:**
1. Update TypeScript client to pass new env vars
2. Create test script for Ollama provider
3. Test local Ollama scenario
4. Test remote Ollama scenario (if available)
5. Test Gemini backward compatibility
6. Validate JSON output with Zod schemas

**Verification:**
- Local Ollama extraction works
- Remote Ollama extraction works (with credentials)
- Gemini extraction still works
- Zod validation passes for all providers

---

### [ ] Step: Documentation and Cleanup

Update documentation and run linters.

**Files to modify:**
- `src/sidecars/lang-extract/README.md`
- `playbooks/lang-extract-playbook.md`

**Tasks:**
1. Update sidecar README with Ollama configuration
2. Add examples for local and remote usage
3. Update playbook with troubleshooting steps
4. Run Python linters (ruff, mypy if available)
5. Run TypeScript checks (biome)

**Verification:**
- All linters pass
- Documentation is clear and accurate
- Examples can be copy-pasted

---

### [ ] Step: Report

Write completion report to `{@artifacts_path}/report.md` describing:
- What was implemented
- How the solution was tested
- The biggest issues or challenges encountered
- Configuration examples for users
