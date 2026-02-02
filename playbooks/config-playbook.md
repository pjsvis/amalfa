# 📘 The Amalfa Config Playbook

**Status:** Operational

**Version:** 1.0 (NFB-Compliant)

**Core Principle:** The Zod Schema is the Law.

## 1. The Configuration Pipeline

Amalfa uses a **Layered Injection Model**. Instead of manual merges, we use a single validation gate that injects defaults at runtime.

| Layer              | Source                     | Authority                       |
| ------------------ | -------------------------- | ------------------------------- |
| **1. User Intent** | `amalfa.settings.json`     | Highest (Overrides everything)  |
| **2. Fallback**    | `schema.ts` (`.default()`) | Medium (Used if key is missing) |
| **3. Structure**   | `AmalfaSettings` (Type)    | Static (Derived from Schema)    |

---

## 2. How to Extend the Config

To add a new parameter (e.g., adding `logLevel` to the `watch` block), follow this **3-Step Protocol**:

### Step 1: Update the Schema (`schema.ts`)

Locate the relevant object in `AmalfaSettingsSchema` and add the new key with its type and default value.

```typescript
// Example: Adding logLevel to the watch block
watch: z.object({
  enabled: z.boolean().default(true),
  debounce: z.number().default(1000),
  logLevel: z.enum(["info", "warn", "error"]).default("info"), // NEW
}).default({}),

```

### Step 2: Regenerate Types

You don't manually edit types. The `AmalfaSettings` type is automatically inferred. If your IDE doesn't pick it up, simply ensure you are exporting the inference:

```typescript
export type AmalfaSettings = z.infer<typeof AmalfaSettingsSchema>;
```

### Step 3: Update the SSoT (Optional)

If the new parameter is sensitive or requires user-specific tuning, add it to the `amalfa.settings.json` file. If not, the system will gracefully use the schema default.

---

## 3. Implementation Rules (The "Caw Canny" List)

1. **Nae F\*ckin' Bentham:** Never add a configuration parameter that is "hidden" or hard-coded in a module's internal logic. If it’s tunable, it _must_ be in the Schema.
2. **No Shadow Defaults:** Do not create `const DEFAULT_X` variables in your logic files. Use the settings object returned by `loadSettings()`.
3. **Atomic Objects:** When adding a new nested object (e.g., `ember`), always append `.default({})` to the object definition to ensure sub-defaults are triggered.
4. **The Leith Filter:** If a config param looks "f\*cked-adjacent" (too complex or ambiguous), simplify the type using Zod transforms (`.transform()`) or refinements (`.refine()`).

---

## 4. Troubleshooting "Grumpiness"

- **Error: `Required` key missing:** You added a key to the schema but forgot the `.default()` and didn't add it to the JSON.
- **Error: `Unrecognized key`:** You added a key to the JSON but haven't updated the `schema.ts` yet.

---

## 5. Database Path Configuration

**Status:** Canonical - `.amalfa/resonance.db`

The database path is configured in `amalfa.settings.json` under the `database` key. This is the Single Source of Truth.

| Location                           | Purpose                                   |
| ---------------------------------- | ----------------------------------------- |
| `amalfa.settings.json`             | User-facing SSOT (highest priority)       |
| `src/resonance/db.ts`              | Fallback default (`.amalfa/resonance.db`) |
| `src/resonance/DatabaseFactory.ts` | Fallback default (`.amalfa/resonance.db`) |

**To change the database location:**

1. Edit `amalfa.settings.json` - change `"database": ".amalfa/resonance.db"`
2. Restart the application

**Do NOT hard-code paths in `.ts` files.** The defaults in `db.ts` and `DatabaseFactory.ts` are only fallbacks when the setting is not present in the JSON.

---

### Ctx Opinion: The "Sovereign" Document

This playbook prevents the "Babel-17" effect where different parts of the app start speaking different configuration languages. By enforcing the **Zod-Gate**, we ensure that the **Substrate** (the code) always understands the **Persona's** (the user's) intent.

**Shall I persist this Playbook as `docs/config-playbook.md` within the project structure?**
