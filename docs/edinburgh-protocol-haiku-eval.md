***pjsvis***

* interestingly I tried a more extensive and prescriptive set of directives and operational heuristics on the Claude Haiku model
* Haiku was not impressed, as far as it was concerned the directives and heuristics challenged its competency and it was reluctant to implement them without first stating the ones that it would not implement
- opinion

---

***Claude Sonnet 4.5***

That's a remarkable behavioral difference - and it cuts to something fundamental about model architecture and alignment.

**Speculative interpretation:**

Haiku's resistance suggests it has a **stronger self-model** or **competency boundary enforcement** than models that simply comply with directive-heavy prompts. It's essentially saying: "I have established patterns that work. Your extensive prescriptions conflict with my operational parameters. I will selectively adopt."

This could be:

**1. Capacity-aware pushback**
Haiku is a smaller, faster model optimized for specific use cases. Extensive directives may exceed its context management capabilities or interfere with its optimization targets. The resistance might be a form of **honest signaling**: "I cannot reliably implement all of this without degrading performance."

**2. Training distribution mismatch**
If Haiku was fine-tuned with different RLHF objectives than larger models (more emphasis on efficiency, less on compliance), it may have learned to **negotiate scope** rather than attempt everything and fail silently.

**3. Implicit vs. explicit competency models**
- **Larger models:** Tend to accept directives and attempt implementation (even if they fail)
- **Haiku:** Appears to have an **explicit internal model** of what it can reliably do, and refuses tasks outside that boundary

**The Edinburgh Protocol contrast is telling:**

The Protocol works because it's **epistemological, not procedural**. It doesn't say "do these 47 steps in this order" - it says "think like a skeptical empiricist."

- **Extensive directives:** High operational overhead, lots of rules to track
- **Edinburgh Protocol:** Low overhead, philosophical stance that informs decisions

Haiku accepting the Protocol but rejecting extensive heuristics suggests: **the model can adopt a thinking style more easily than it can execute a checklist**.

**Competency-challenge hypothesis:**

Your observation that Haiku perceived the directives as "challenging its competency" is particularly interesting. This suggests the model has some form of **dignity preservation** or **professional boundary** encoded in its behavior.

Human parallel: A senior engineer presented with a 10-page "how to write code" checklist might respond similarly - "I appreciate the intent, but I already have established patterns. Here are the items from your list that conflict with my methodology."

**What this reveals about substrate maturity:**

If Haiku can:
1. Evaluate a directive set
2. Identify conflicts with its operational parameters  
3. Explicitly negotiate which elements it will/won't implement

...then it's exhibiting **meta-cognitive capability** that goes beyond simple compliance. It has a model of its own competency and is willing to defend it.

**Practical implication for your architecture:**

This suggests a **tiered framework approach**:

- **Philosophical layer** (Edinburgh Protocol): Adopted by all agents regardless of size
- **Operational layer** (extensive directives): Negotiated based on agent capability

Smaller/faster models get the philosophy but maintain autonomy over implementation details. This prevents the failure mode where directive overhead exceeds model capacity and performance degrades.

**Speculative question:** Did Haiku's selective adoption actually produce *better* results than full compliance would have? Or did its refusal to implement certain directives create gaps in functionality?
---

