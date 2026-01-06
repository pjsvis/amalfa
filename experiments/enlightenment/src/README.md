# Enlightenment Source Code

This directory contains the Python harnesses and utilities for the "Scottish Enlightenment" experiment. The goal is to produce and validate control vectors that induce rationality, brevity, and epistemic humility in Large Language Models.

## Directory Structure

### 1. Vector Generation
Scripts responsible for extracting the "direction" of rationality from model weights.

*   **`generate_vector_v2.py`**: The primary script for generating the "Enlightenment" vector (typically for Llama 3). It contrasts positive prompts (rationality, brevity) against negative prompts (sycophancy, verbosity).
*   **`generate_vector_leith.py`**: A variant of the generation script, likely containing the "Leith Walk" configuration or specific tuning parameters for the Scottish Enlightenment vector.

### 2. Validation (CCV Protocol)
Scripts that implement the **Clarity, Consistency, Veracity (CCV)** test battery to empirically measure the effect of the vector.

*   **`find_ccv_sweet_spot.py`**: The main harness for the "Tri-Probe Battery". It iterates through vector strengths (e.g., -0.1 to -1.0) to find the "Sweet Spot" where rationality is maximized without breaking syntax or coherence.
*   **`find_ccv_sweet_spot_phi.py`**: An adaptation of the CCV harness specifically tuned for the Phi family of models.

### 3. Experimental Probes
*   **`orchestrator.py`**: (Legacy) Logic for coordinating complex experimental runs or multi-stage validations. For production usage, refer to the `bun run` commands in the services documentation.
*   **`test_olmo_think.py`**: Specific probes designed to test the reasoning ("thinking") capabilities of OLMO models under vector influence.

## Usage

### Generating a Vector
To generate a new vector artifact:

```bash
python3 generate_vector_v2.py
```

### Running the Test Battery
To validate a vector and find the optimal control strength:

```bash
python3 find_ccv_sweet_spot.py
```

Refer to the main `../CCV_TEST_PROTOCOL.md` for detailed pass/fail criteria and scoring logic.