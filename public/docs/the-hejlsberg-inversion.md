# The Hejlsberg Inversion

**Status:** Core Directive (PHI-15)

> "Sometimes, rather than asking your AI to do the job, it is better to ask your AI to write a program to do the job." — Anders Hejlsberg

## The Principle
Large Language Models are **Probabilistic** (they guess). Code is **Deterministic** (it executes).

To build reliable systems, we must invert the workflow:
* **Amateur Mode:** Ask the LLM to perform the task (e.g., "Summarize these 100 files").
    * *Result:* Hallucinations, truncation, variance.
* **Engineer Mode:** Ask the LLM to write a script to perform the task (e.g., "Write a Python script to extract H1 tags").
    * *Result:* 100% accuracy, repeatable, version-controlled.
