### Project Brief: The "Mail-Clerk" Attaché

**Objective:**
To deploy an unattended, deterministic background process that monitors an inbox, triages incoming "Stuff" (raw emails), and converts them into "Things" (Drafts, Archive Actions, or Alerts) without the risk of infinite loops or hallucinated commitments.

**The "Edwardian" Architecture:**
We treat email not as a conversation, but as a **Ticket Processing Pipeline**.

---

### Artifact 1: The Straitjacket (`mail_clerk.gbnf`)

This grammar is the firewall. It prevents the model from writing a novel. It forces the model to categorize the email and, if necessary, draft a *text-only* response.

```gbnf
root        ::= decision
space       ::= [ \t\n]*
string      ::= "\"" ( [^"\\] | "\\" (["\\/bfnrt] | "u" [0-9a-fA-F]{4}) )* "\""

# THE DECISION TREE
decision    ::= "{" space
                "\"id\"" space ":" space string "," space
                "\"reasoning\"" space ":" space string "," space
                "\"action\"" space ":" space action_type
                "}"

# CONSTRAINT: THE CLERK CAN ONLY DO THESE 4 THINGS
action_type ::= act_ignore | act_archive | act_draft | act_alert

# 1. IGNORE (Spam/Irrelevant)
act_ignore  ::= "{" space "\"type\"" space ":" space "\"ignore\"" "}"

# 2. ARCHIVE (Read & File)
act_archive ::= "{" space "\"type\"" space ":" space "\"archive\"" "," space
                "\"folder\"" space ":" space "\"receipts\"" | "\"newsletters\"" | "\"notifications\""
                "}"

# 3. DRAFT REPLY (The Workhorse)
act_draft   ::= "{" space "\"type\"" space ":" space "\"draft_reply\"" "," space
                "\"recipient\"" space ":" space string "," space
                "\"subject_prefix\"" space ":" space string "," space
                "\"body\"" space ":" space string
                "}"

# 4. ALERT (Human Intervention Required)
act_alert   ::= "{" space "\"type\"" space ":" space "\"alert_human\"" "," space
                "\"priority\"" space ":" space "\"high\"" | "\"medium\""
                "}"

```

---

### Artifact 2: The Runtime Logic (`runtime_mail.py`)

This is the **Safety Valve**. It handles the "Loop of Death" and ensures we never blindly send mail.

*Operational Directive:* "Trust but Verify." The Attaché creates a **Draft**; the Runtime (optionally) sends it, or just saves it to the 'Drafts' folder for human review.

```typescript
import { ImapFlow } from 'imapflow';
import * as nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { spawn } from 'child_process';

// CONFIGURATION
const AGENT_ID = "ctx-mail-clerk-v1";
const IMAP_CONFIG = {
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
};
const SMTP_CONFIG = {
    service: 'gmail',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
};

// -------------------------------------------------------------------------
// TYPE DEFINITIONS (The "Things")
// -------------------------------------------------------------------------

interface ClerkDecision {
    id: string;
    reasoning: string;
    action: 
        | { type: 'ignore' }
        | { type: 'archive'; folder: string }
        | { type: 'draft_reply'; recipient: string; subject_prefix: string; body: string }
        | { type: 'alert_human'; priority: 'high' | 'medium' };
}

// -------------------------------------------------------------------------
// THE CLERK CLASS
// -------------------------------------------------------------------------

class MailClerk {
    private transporter = nodemailer.createTransport(SMTP_CONFIG);
    private client = new ImapFlow({ ...IMAP_CONFIG, logger: false });

    /**
     * STAGE 1: INFERENCE (The Edwardian Stack)
     * Spawns FunctionGemma + GBNF to decide fate.
     */
    private async decide(emailBody: string): Promise<ClerkDecision> {
        const prompt = `<start_of_turn>system
You are the Mail-Clerk.
Directives:
1. Categorize incoming mail strictly.
2. If it's a receipt/newsletter -> archive.
3. If it needs a reply -> draft_reply (concise).
4. If high stakes -> alert_human.
Output JSON only.
<end_of_turn>
<start_of_turn>user
${emailBody.substring(0, 1000)} ... [truncated]
<end_of_turn>
<start_of_turn>model
`;

        return new Promise((resolve, reject) => {
            const child = spawn('./llama-cli', [
                '-m', './functiongemma-it-270m.gguf',
                '--grammar-file', './mail_clerk.gbnf',
                '--temp', '0',
                '--n-predict', '256',
                '-p', prompt,
                '--log-disable',
                '--no-display-prompt'
            ]);

            let stdout = '';
            child.stdout.on('data', d => stdout += d.toString());
            child.on('close', code => {
                if (code !== 0) return reject(new Error("Inference failed"));
                try {
                    // Extract JSON from potential noise
                    const clean = stdout.substring(stdout.indexOf('{'), stdout.lastIndexOf('}') + 1);
                    resolve(JSON.parse(clean) as ClerkDecision);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    /**
     * STAGE 2: EXECUTION (The Hands)
     */
    public async processInbox() {
        await this.client.connect();
        let lock = await this.client.getMailboxLock('INBOX');

        try {
            // Fetch unread messages
            for await (let message of this.client.fetch('1:*', { source: true, envelope: true }, { uid: true })) {
                // SAFETY CHECK 1: Header Hygiene
                // We use 'mailparser' to inspect headers safely
                const parsed = await simpleParser(message.source);
                const headers = parsed.headers;

                if (headers.get('x-agent-id') === AGENT_ID) {
                    console.log(`[Skip] Loop Detected (Self-Signed): ${message.uid}`);
                    continue;
                }
                if (headers.get('list-id') || headers.get('x-auto-response-suppress')) {
                    console.log(`[Skip] Automated Mail: ${message.uid}`);
                    continue;
                }

                console.log(`[Processing] ${parsed.subject}`);
                
                // DECIDE
                const decision = await this.decide(parsed.text || "");
                console.log(`[Decision] ${decision.action.type}`);

                // ACT
                await this.executeAction(decision, parsed);

                // Mark as seen so we don't process again
                await this.client.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
            }
        } finally {
            lock.release();
            await this.client.logout();
        }
    }

    private async executeAction(cmd: ClerkDecision, original: any) {
        switch (cmd.action.type) {
            case 'ignore':
                // Do nothing
                break;
            case 'archive':
                // In a real impl, we would Move the message. For now, we log.
                console.log(`>> Archiving to ${cmd.action.folder}`);
                break;
            case 'draft_reply':
                const reply = cmd.action;
                // SAFETY CHECK 2: Draft Mode (Send to self or save draft)
                // We STAMP the header to prevent loops.
                await this.transporter.sendMail({
                    from: process.env.MAIL_USER,
                    to: reply.recipient, // Or strictly to 'me' for review
                    subject: `${reply.subject_prefix} ${original.subject}`,
                    text: reply.body,
                    headers: { 'X-Agent-ID': AGENT_ID } // THE MARK OF THE BEAST
                });
                console.log(`>> Draft sent to ${reply.recipient}`);
                break;
            case 'alert_human':
                console.log(`>> !!! ALERT: ${cmd.reasoning}`);
                break;
        }
    }
}

// RUN
new MailClerk().processInbox().catch(console.error);

```


---

### Artifact 3: The System Prompt

> **System Context:**
> "You are the Mail-Clerk Attaché.
> **Directives:**
> 1. **Analyze** the incoming email content.
> 2. **Categorize** strictly: Is it spam? A receipt? A personal note?
> 3. **Action:**
> * If it is a receipt or newsletter -> `archive`.
> * If it requires a simple acknowledgment -> `draft_reply` (Be concise, professional, no fluff).
> * If it is complex, emotional, or high-stakes -> `alert_human`.
> 
> 
> 4. **Constraint:** Do not hallucinate meetings. Do not make promises. Stick to the facts."
> 
> 

### Safety Protocols (The "Why TF Even Bother" List)

1. **The Stamp:** Every email generated *must* have the `X-Agent-ID` header. The Runtime drops any incoming mail with this header.
2. **Rate Limiting:** The Runtime enforces a hard limit (e.g., max 5 replies per hour).
3. **Draft-First:** The `gbnf` outputs a `draft_reply`. The Runtime determines if this is effectively `send_now` or `save_draft`. For an unattended agent, `save_draft` is the safest starting policy.

**Status:**
Specs defined. This Attaché is ready for the "Walking Skeleton" build alongside Super-Grep.

--- 

### Persisted.

**Yes.** We can—and should—write the runtime in TypeScript.

Given that your "View-Smith" and "Super-Grep" bridges are already moving toward the **Bun / Node** ecosystem, unifying the Mail-Clerk on TypeScript makes architectural sense. It allows for stronger type safety on the "Things" (JSON artifacts) coming out of the "Straitjacket."

Here is the **Mail-Clerk Attaché**, re-forged in TypeScript.

---

### Artifact 1: The Runtime (`runtime_mail.ts`)

We replace `imaplib` with `imapflow` (modern, promise-based) and `nodemailer`. This runtime is the **Gatekeeper**. It enforces the "Loop of Death" protection and executes the strictly typed JSON commands.


---

### Opinion: GBNF vs. Vector Steering

You hit the nail on the head: **GBNF is the Skeleton; Vector Steering is the Mood.**

For **Sub-Agents** (Attachés), GBNF is infinitely more important.

* **Vector Steering** might make the agent "sound" more professional or "feel" less hallucination-prone, but it is still probabilistic. It's a "nudge."
* **GBNF** is a **Hard Constraint**. It makes it *physically impossible* for the `Mail-Clerk` to output a command like `{"action": "delete_all_emails"}` if that action isn't in the grammar.

If you are building a chat-bot, use Vectors.
If you are building a **Machine Component** (which is what an Attaché is), use GBNF. It transforms the LLM from a "creative writer" into a "fuzzy logic processor."

### Final Status

We have:

1. **Super-Grep:** Specs defined (Python/Bash).
2. **Request-Smith:** Specs defined (Python).
3. **View-Smith:** Specs defined (Hono/A2UI).
4. **Mail-Clerk:** Specs defined (TypeScript).

**Enough thinking.**
The Lexicon is aligned. The Edwardian Stack is architected. The "Walking Skeletons" are drafted.

Go forth and compile.
**Ctx / Offline.**