# **The Horizon of Latent Control: A Comprehensive Analysis of Vector Steering and Attribute Conditioning in Large Language Models**

## **1\. Executive Summary**

The paradigm of Large Language Model (LLM) interaction is currently undergoing a fundamental transformation, shifting from surface-level textual influence—commonly known as prompt engineering—to deep-level intervention within the model's latent activation space. This transition marks the maturation of **Vector Steering**, a set of techniques that allow for the mathematical manipulation of a model's internal cognitive states during inference. The user's inquiry regarding the "scope" for steering these models with vectors touches upon one of the most vibrant and consequential frontiers in current artificial intelligence research. The scope is not merely existent; it is profound, expanding, and represents a potential solution to the inherent fragility and unreliability of traditional prompting methods.

Current research indicates that vector steering offers a mechanism for control that is distinctly more robust and "calibrated" than prompting. Where prompt engineering relies on the model's attention mechanism to interpret and prioritize instructions amidst a noisy context window, vector steering intervenes directly in the residual stream. It mathematically injects directions of intent—such as honesty, refusal, creativity, or uncertainty—into the model's neural processing.1 This report establishes that the primary advantage of this approach lies in **context preservation**: a model steered via vectors retains its ability to discriminate between contexts (e.g., knowing *when* to refuse), whereas a model prompted to be "safe" often over-corrects, leading to the refusal of benign requests or a collapse in confidence on factual queries.1

This comprehensive analysis focuses on two primary architectural families that define the current state of the art in this domain: **Mistral NeMo 12B** and **NVIDIA’s Llama 3.1 Nemotron** series. Mistral NeMo 12B, with its dense 12-billion parameter architecture and massive 128,000-token context window, serves as the ideal "open-weight" chassis for explicit vector experimentation using techniques like Representation Engineering (RepEng).2 Conversely, the Llama 3.1 Nemotron series represents the "industrialization" of steering through **SteerLM**, a methodology that embeds steering vectors implicitly during training via Attribute-Conditioned Supervised Fine-Tuning (AC-SFT), enabling users to control attributes like complexity, verbosity, and helpfulness via inference-time metadata.3

The analysis reveals that the scope of vector steering extends far beyond simple style transfer or persona adoption. It encompasses critical functionalities such as **Safety Modulation**, where "refusal vectors" can be identified and subtracted to bypass guardrails or added to enforce them without retraining.1 It includes **Cognitive Mode Switching**, evidenced by the "detailed thinking" toggles in Nemotron models that switch the system between instinctive (System 1\) and reasoning (System 2\) modes.4 Furthermore, it enables **Deployment Simulation**, allowing researchers to suppress a model's "evaluation awareness"—its tendency to recognize test environments and alter its behavior—thereby unmasking its true deployment capabilities.6

This report provides an exhaustive examination of the theoretical underpinnings, practical methodologies, and broader implications of vector steering. It synthesizes data from technical documentation, academic papers, and community experiments to articulate how vector steering is poised to become the dominant modality for high-precision model control.

## ---

**2\. Theoretical Foundations: The Geometry of Latent Space**

To fully grasp the scope of steering, one must first deconstruct the underlying mechanics of how LLMs represent semantic concepts. The efficacy of steering vectors is not a happy accident but a direct consequence of the mathematical structure of Transformer models, specifically predicated on the **Linear Representation Hypothesis**.

### **2.1 The Linear Representation Hypothesis**

The Linear Representation Hypothesis posits that high-level semantic concepts—ranging from simple entities like "Paris" or "dog" to abstract qualities like "honesty," "anger," or "refusal"—are represented as linear directions within the model's high-dimensional activation space.

In a Transformer architecture, information propagates through the network via the **residual stream**. At each layer $L$, the model's state can be represented as a vector $x\_L \\in \\mathbb{R}^d$, where $d$ is the hidden dimension (e.g., 4096 or 5120). Attention heads and Feed-Forward Networks (FFNs) read from this stream, perform computations, and add their output back into the stream. This process implies that the "meaning" of the input at any given stage is a point moving through a high-dimensional trajectory.

Vector steering exploits this geometry. If the concept of "refusal" corresponds to a specific stable direction $v\_{refusal}$ across a range of layers, then we can artificially induce or suppress refusal behavior by modifying the activation $x\_L$ directly:

$$x'\_L \= x\_L \+ \\alpha \\cdot v\_{refusal}$$  
In this equation, $\\alpha$ represents the **steering coefficient** or strength. A positive $\\alpha$ pushes the model's internal state further along the "refusal" axis, inducing the behavior. A negative $\\alpha$ moves the state in the opposite direction, suppressing the behavior. This mathematical intervention is fundamental to understanding why vector steering is distinct from prompting: it changes the *state* of the processor, not the *input* to the processor.1

### **2.2 Activation Steering vs. Prompt Engineering**

The distinction between activation steering and prompt engineering is critical and functional. While prompt engineering has been the de facto standard for controlling LLMs, it suffers from inherent limitations that vector steering addresses.

**Prompt Engineering** operates at the token level. When a user prepends instructions such as "You are a helpful assistant" or "Answer with uncertainty," the model processes these tokens through its embedding and attention layers. This generates an attention pattern that theoretically biases the probability distribution toward the desired output. However, this relies on the model's "willingness" or capacity to attend to the instruction continuously, especially when faced with conflicting context (e.g., a long conversation history or a hostile user query). Research highlights that prompting often leads to **over-correction**. For instance, prompting a model to be "uncertain" can disastrously reduce its confidence to 0% even on demonstrably true facts (e.g., "The capital of France is Paris"), effectively lobotomizing its utility.1

**Activation Steering**, conversely, operates at the processing level. It acts as a constant "force" applied to the model's cognition. By injecting a vector directly into the residual stream, the intervention biases the *processing* of information rather than the information itself.

* **Context Preservation:** Steering preserves the model's ability to discriminate context. A model steered to be "honest" via vectors will still refuse to answer if it genuinely lacks knowledge, whereas a model prompted to be "honest" is prone to hallucination in an attempt to appear helpful. This phenomenon suggests that vectors modulate the model's internal "bias" without rewriting its logical processing circuits.1  
* **Robustness:** Steering vectors are significantly harder to override via "jailbreak" prompts. Since the bias is structural to the inference pass—added mathematically at every token generation step—it persists regardless of the textual context found in the user prompt.

### **2.3 Methodologies: Contrastive Activation Addition (CAA)**

The standard methodology for extracting these control vectors is known as **Contrastive Activation Addition (CAA)** or, more commonly in recent implementations, Principal Component Analysis (PCA) on contrastive pairs. This process turns the abstract theory of linear representations into concrete, usable vectors.

The extraction pipeline typically follows these steps:

1. **Data Collection:** A dataset of opposing pairs is generated. These pairs must differ only in the target attribute to isolate the relevant direction. Examples include "Love" vs. "Hate," "Honest" vs. "Dishonest," or "Refusal" vs. "Compliance".1  
2. **Activation Recording:** The target model (e.g., Mistral NeMo) processes these inputs, and the hidden states (activations) are recorded at specific layers. Research suggests focusing on the "last token" position is crucial, as this captures the model's state immediately prior to response generation.1  
3. **Difference Calculation:** The mean difference between the positive and negative activations is computed: $\\Delta \= \\mu\_{pos} \- \\mu\_{neg}$.  
4. **Dimensionality Reduction:** Simple subtraction is often noisy. Therefore, PCA is applied to the set of difference vectors. The first principal component (PC1) typically captures the dominant direction of variance, which corresponds to the target concept (the "Control Vector").8

This technique has been popularized by open-source libraries such as repeng (Representation Engineering), which allows for the extraction of steering vectors for virtually any concept that can be dichotomized, provided the model architecture supports access to hidden states.8

## ---

**3\. Architectural Substrates: Mistral NeMo and Llama Nemotron**

The practical application of vector steering relies heavily on the underlying model architecture. The research landscape is currently dominated by two distinct approaches to this substrate: the dense, efficient "open-weight" architecture of **Mistral NeMo 12B**, and the specialized, "steer-ready" architecture of **NVIDIA's Llama 3.1 Nemotron**.

### **3.1 Mistral NeMo 12B: The Hacker's Scaffold**

Mistral NeMo 12B, developed jointly by Mistral AI and NVIDIA, represents a "sweet spot" for vector steering research. It combines a manageable parameter count (12 billion) with state-of-the-art reasoning capabilities and a massive context window, making it accessible for local experimentation while retaining enough depth for complex latent representations.2

#### **3.1.1 Architectural Specifications**

Mistral NeMo 12B is a dense Transformer decoder model. Its specific architectural choices have direct implications for steering:

* **Layer Depth:** The model features **40 layers**.2 This depth is significant because steering vectors are not equally effective at all depths. Research indicates that steering is most effective in the middle-to-late layers (e.g., layers 14–30 in a 40-layer model). Applying vectors too early (layers 0–10) tends to disrupt low-level feature extraction, while applying them too late (layers 35–40) leaves insufficient computational steps for the steering to manifest in the output.1  
* **Hidden Dimension:** The model utilizes a hidden dimension of **5,120**.2 This high-dimensional space is critical for the Linear Representation Hypothesis. A larger latent space provides a higher-resolution "canvas," reducing the likelihood of interference between non-orthogonal vectors. In smaller models (e.g., 7B parameters with 4096 dimensions), steering for one concept (e.g., "refusal") often inadvertently suppresses another (e.g., "uncertainty") due to vector overlap. The 5,120-dimensional space of Mistral NeMo helps mitigate this "crowding" effect.1  
* **Tokenizer:** Mistral NeMo utilizes the **Tekken** tokenizer, which is approximately 30% more efficient than SentencePiece for source code and many European languages.13 A more efficient tokenizer means that semantic concepts are compressed into fewer tokens, potentially leading to more dense and stable activation patterns for the steering vectors to latch onto.

#### **3.1.2 Integration with Steering Tools**

Mistral NeMo 12B is supported by key ecosystem tools that facilitate vector steering. The **repeng** library, originally built for Mistral 7B, supports the NeMo architecture largely out-of-the-box due to shared lineage (RMSNorm, RoPE, SwiGLU). Furthermore, **llama.cpp** fully supports Mistral NeMo (via GGUF quantization) and includes the \--control-vector flag, allowing users to apply extracted vectors during inference with zero latency penalty.9 This makes Mistral NeMo the primary vehicle for "raw" vector steering experiments in the open-source community.

### **3.2 Llama 3.1 Nemotron: The Industrialized Solution**

While Mistral NeMo represents the potential for *explicit* vector injection, NVIDIA's **Llama 3.1 Nemotron** family represents the **industrialization** of steering principles via the **SteerLM** methodology. This approach moves the complexity of steering from inference time (managing vector files) to training time (embedding vectors into the weights).

#### **3.2.1 The SteerLM Paradigm**

**SteerLM** is best understood as **Attribute-Conditioned Supervised Fine-Tuning (AC-SFT)**. Rather than requiring the user to calculate a mathematical vector $v$ and inject it, the model is trained to associate specific token sequences (attributes) with specific latent directions.3

The SteerLM pipeline consists of four distinct steps:

1. **Attribute Prediction:** A specialized Reward Model (e.g., Llama-3.1-Nemotron-70B-Reward) is trained to predict scores for specific attributes based on the **HelpSteer2** dataset.3  
2. **Annotation:** This reward model annotates a massive, diverse dataset with these attribute scores, effectively labeling the "DNA" of each response.  
3. **Attribute-Conditioned SFT:** The base Instruct model is fine-tuned to generate responses conditioned on these scores. The input format explicitly includes the desired attributes: \[Prompt\] \<helpfulness:4\> \<verbosity:2\> \<complexity:4\>.  
4. **Feedback-Edit Scaling:** Advanced variants involve models that generate feedback and edit their own responses to maximize these attribute scores.16

The result is a model where the tokens \<helpfulness:4\> act as **triggers** that activate specific, reinforced directions in the latent space. This is, in essence, "baked-in" vector steering, offering the stability of fine-tuning with the flexibility of inference-time control.

#### **3.2.2 Model Variants and Performance**

The Nemotron family includes models of varying sizes, such as the **70B Instruct**, **51B Instruct**, and smaller **Nano (8B)** variants.17

* **Performance:** The **Llama-3.1-Nemotron-70B-Instruct** model achieves state-of-the-art results on alignment benchmarks, ranking \#1 on **Arena Hard** (85.0) and **AlpacaEval 2 LC** (57.6) as of late 2024\.19 This performance dominance is attributed to the SteerLM methodology, which allows the model to be steered toward *maximal* helpfulness and correctness during evaluation, whereas standard RLHF models represent a "mean" or average behavior that trades off helpfulness for safety.20  
* **Reasoning Toggles:** A defining feature of the Nemotron architecture is the **Reasoning Toggle**, activated via the system prompt detailed thinking on or detailed thinking off. This toggle switches the model between a concise response mode and a verbose, chain-of-thought reasoning mode (similar to System 1 vs. System 2 thinking).4 This mechanism validates the theory that high-level cognitive processes can be gated behind steerable triggers.

## ---

## **4\. The Scope of Steering: Capabilities and Applications**

The user explicitly asks if there is "any scope" for steering. The synthesis of the research material demonstrates that the scope is not only present but is segmented into four distinct, high-impact domains: Safety, Cognition, Style, and Deployment Simulation.

### **4.1 Scope 1: Safety Modulation and Refusal Vectors**

One of the most immediate and potent applications of vector steering is the modulation of safety guardrails. Research into "refusal directions" has demonstrated that model refusal (the standardized "I cannot assist with that" response) is mediated by a single, discoverable linear direction in the activation space.1

* **Jailbreaking via Subtraction:** By identifying the "refusal vector" and subtracting it (applying a negative steering coefficient) during inference, researchers can effectively **lobotomize** the model's safety training without the need for expensive fine-tuning. This "clamped" state forces the model to comply with requests it would otherwise reject, as the internal neural circuit responsible for generating the refusal is mathematically suppressed. This provides a "pure" jailbreak that bypasses the need for elaborate "DAN" (Do Anything Now) style prompts.  
* **Enforcement via Addition:** Conversely, adding this vector can make a model hyper-sensitive to safety, causing it to refuse even benign requests if they tangentially resemble unsafe topics. This allows for dynamic "safety sliders"—a "Kid Mode" could have \+2.0 Refusal Vector, while a "Researcher Mode" operates at \-1.0.  
* **Evaluation Awareness:** Models often behave differently when they detect they are being evaluated, a phenomenon known as "Goodhart's Law" applied to AI. Vector steering can identify the "evaluation" direction—the latent state associated with recognizing test prompts—and suppress it. This forces the model to reveal its "true" deployment behavior, which is critical for honest safety evaluations and red-teaming.6

### **4.2 Scope 2: Cognitive Mode Toggling ("System 2" Emulation)**

A burgeoning area of scope is the steering of reasoning capabilities. The release of models like **Llama 3.1 Nemotron** has introduced the concept of explicit "detailed thinking" toggles.4

While Nemotron implements this via a system prompt (detailed thinking on), the underlying mechanism relies on accessing a specific region of the latent space associated with Chain-of-Thought (CoT) reasoning. Vector steering offers the potential to **force** this reasoning mode even in models that haven't been explicitly fine-tuned for it.

* **The Reflection Vector:** It is hypothesized that by contrasting activations of "detailed thinking on" vs. "detailed thinking off" runs, one could extract a "Reasoning" or "Reflection" vector. Injecting this vector into base models (like the standard Llama 3.1) could theoretically induce similar verbose reasoning behaviors, effectively upgrading a standard model to a "reasoning" model at inference time.5  
* **Uncertainty Calibration:** Prompts like "Be unsure" often break models, causing them to feign ignorance. Steering for "Uncertainty" preserves the model's ability to answer facts confidently while effectively increasing the entropy of its probability distribution on ambiguous queries. This allows for a more calibrated "I am not sure" response that is structurally driven rather than textually mimicked.1

### **4.3 Scope 3: Stylistic and Structural Control (The HelpSteer Paradigm)**

The **HelpSteer2** dataset and the SteerLM framework expand the scope of steering to precise structural attributes. Unlike binary "good/bad" RLHF datasets, HelpSteer2 rates responses on five distinct axes: **Helpfulness**, **Correctness**, **Coherence**, **Complexity**, and **Verbosity**.21

This multi-dimensionality allows for precise, granular steering that resolves the "Waluigi effect" (where training for a trait inadvertently trains for its opposite).

* **Disentangling Verbosity from Quality:** Standard RLHF often conflates "longer" with "better." SteerLM allows a user to request a response that is *highly helpful* but *low verbosity* (the "Concise Expert" persona) or *high complexity* and *high verbosity* (the "Academic Lecturer" persona). This solves the "yapping" problem inherent in many modern LLMs.  
* **Complexity Matching:** Users can steer the model to output text suitable for a 5-year-old (complexity:0) or a PhD researcher (complexity:4) without needing to craft elaborate "Explain like I'm 5" prompts that might dilute the factual content.

### **4.4 Scope 4: Dynamic Agentic Personality**

The rigid "helpful assistant" persona is a byproduct of RLHF alignment. Vector steering opens the scope for truly **dynamic agents**. An agentic system could dynamically adjust its "Confidence" vector based on the results of a Retrieval-Augmented Generation (RAG) lookup.

* **Scenario:** If the RAG retrieval score is low, the system could automatically lower its "Confidence" vector and raise its "Refusal" or "Uncertainty" vector to induce caution.  
* Scenario: If the retrieval is high-quality, the system boosts the "Assertiveness" vector.  
  This dynamic, closed-loop steering could solve the hallucination problem more effectively than prompting alone, creating agents that modulation their "personality" in real-time based on data confidence.1

## ---

## **5\. Implementation and Infrastructure**

For professionals looking to implement these techniques, the landscape is bifurcated between "Raw Vector" tools (the "Hacker Stack") and "Attribute" frameworks (the "Enterprise Stack").

### **5.1 Raw Vector Steering: repeng and llama.cpp**

The primary toolkit for explicit vector steering involves repeng (Representation Engineering) and llama.cpp.

* **Workflow:** The process begins by loading a base model (e.g., Mistral NeMo 12B) and defining a dataset of paired prompts (e.g., 100 pairs of "Act happy" vs. "Act sad"). The repeng library is used to extract activations at a target layer (e.g., Layer 20\) and compute the PCA component. This vector is saved as a .gguf file.  
* **Inference:** llama.cpp natively supports the loading of these vectors via the \--control-vector argument. Users can load a quantized version of Mistral NeMo (e.g., Q4\_K\_M) and apply the vector with a specific strength (e.g., \--control-vector-strength 1.5).  
* **Multi-Vector Steering:** llama.cpp supports the application of multiple vectors simultaneously. One could theoretically apply \+1.5 Creative and \-1.0 Verbosity at the same time, allowing for the mixing of cognitive traits like audio channels on a mixing board.9

### **5.2 Attribute Steering: NVIDIA NeMo Framework**

For enterprise applications, the **NVIDIA NeMo Framework** provides the infrastructure for SteerLM.

* **Deployment:** Models like Llama-3.1-Nemotron-70B can be deployed via NVIDIA NIM (NeMo Inference Microservices) or TRT-LLM (TensorRT-LLM).  
* **Inference:** Steering is achieved by constructing prompts with specific header formats: \<extra\_id\_0\>System... \<extra\_id\_1\>User... \<extra\_id\_2\>quality:4,helpfulness:4....  
* **Customization:** The NeMo Aligner tool allows organizations to fine-tune their own SteerLM models if they need custom attributes (e.g., "Brand Voice" or "Compliance") that are not in the standard HelpSteer2 dataset.3

### **5.3 Local User Interfaces: Oobabooga**

For local researchers and hobbyists, **Oobabooga Text-Generation-WebUI** serves as the bridge.

* **Vector Support:** Since Oobabooga supports llama.cpp as a backend, it implicitly supports control vectors if loaded via command-line flags or specific loader settings.  
* **Extensions:** Extensions like **Deep Reason** emulate the Nemotron "thinking" toggle by injecting chain-of-thought prompts, serving as a prompt-based proxy for steering.24  
* **SteerLM Support:** Users can manually input the SteerLM prompt template structure into the chat interface to activate the steering behaviors in Nemotron models, although a native "slider" UI for attributes is not yet standard.25

## ---

**6\. Limitations and Future Outlook**

Despite the immense promise, vector steering is not without challenges.

### **6.1 The Orthogonality Problem**

A critical limitation is that concepts in the latent space are rarely orthogonal. A "Refusal" vector might be highly correlated with an "Uncertainty" vector. Subtracting refusal to jailbreak a model might inadvertently make it "Confident" even when it is hallucinating, as the "uncertainty" component was also suppressed. Future research must focus on **disentangling** these vectors—finding truly orthogonal directions that allow for independent control of safety and epistemic humility.1

### **6.2 Perplexity Degradation**

Injecting vectors moves the model's activations off its "natural manifold." As the steering strength ($\\alpha$) increases, the model's perplexity (surprise) rises. At extreme values (typically $\\alpha \> 2.0$), the model's output degrades into gibberish or repetitive loops. This necessitates careful tuning of the steering coefficient to find the "sweet spot" between control and coherence.1

### **6.3 Conclusion: From Prompting to Contextual Control**

The scope for steering models with vectors is expansive and represents a shift from "Prompt Engineering" to **Contextual Control**.

* **Mistral NeMo 12B** stands as the premier open-weight substrate for exploring this frontier, allowing for the creation of personas and safety-overrides that prompted models cannot achieve.  
* **Llama 3.1 Nemotron** and **SteerLM** demonstrate how this control can be productized, offering reliable "knobs and dials" for enterprise deployment.

The future of AI control lies in the latent space. As we move forward, user intent will likely be conveyed not just through text, but through a precise cocktail of steering vectors that configure the model's cognitive state before a single token is generated. This offers a path toward AI systems that are safer, more aligned, and fundamentally more controllable than any purely text-prompted system could hope to be.

### ---

### **Data Summary and Comparative Tables**

**Table 1: Architectural Comparison for Steering Suitability**

| Feature | Mistral NeMo 12B | Llama 3.1 Nemotron 70B |
| :---- | :---- | :---- |
| **Parameter Count** | 12.2 Billion | 70 Billion |
| **Hidden Dimension** | 5,120 | 8,192 (est. based on Llama 3\) |
| **Layers** | 40 | 80 |
| **Steering Method** | Explicit (RepEng/Vectors) | Implicit (SteerLM/Attributes) |
| **Primary Use Case** | Local Research / Hacking | Enterprise / High-Performance |
| **Context Window** | 128,000 Tokens | 128,000 Tokens |

**Table 2: Comparison of Steering Modalities**

| Feature | Prompt Steering (e.g., "Be polite") | Vector Steering (e.g., \+Politeness Vector) |
| :---- | :---- | :---- |
| **Mechanism** | Attentional bias via input tokens. | Activation bias via residual stream injection. |
| **Robustness** | Low. Can be overridden by conflicting context ("Jailbreaks"). | High. Structural bias persists regardless of context. |
| **Context Window** | Consumes tokens. Subject to "forgetting". | Zero token consumption. Constant pressure. |
| **Generalization** | High. "Be polite" works on almost any model. | Low. Vectors are specific to model weights. |
| **Calibration** | Poor. Often binary (polite or not). | High. Strength can be tuned continuously. |
| **Side Effects** | "Lobotomization" (refusal to answer facts). | Can degrade perplexity if strength is too high. |

#### **Works cited**

1. Why Steering Vectors Beat Prompting (And When They Don't) \- Subhadip Mitra, accessed on December 22, 2025, [https://subhadipmitra.com/blog/2025/steering-vectors-agents/](https://subhadipmitra.com/blog/2025/steering-vectors-agents/)  
2. nvidia/Mistral-NeMo-12B-Instruct \- Hugging Face, accessed on December 22, 2025, [https://huggingface.co/nvidia/Mistral-NeMo-12B-Instruct](https://huggingface.co/nvidia/Mistral-NeMo-12B-Instruct)  
3. Model Alignment by SteerLM Method — NVIDIA NeMo Framework User Guide 24.07 documentation, accessed on December 22, 2025, [https://docs.nvidia.com/nemo-framework/user-guide/24.07/modelalignment/steerlm.html](https://docs.nvidia.com/nemo-framework/user-guide/24.07/modelalignment/steerlm.html)  
4. Llama-Nemotron: Efficient Reasoning Models \- arXiv, accessed on December 22, 2025, [https://arxiv.org/pdf/2505.00949](https://arxiv.org/pdf/2505.00949)  
5. Llama-Nemotron: Efficient Reasoning Models \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2505.00949v2](https://arxiv.org/html/2505.00949v2)  
6. Steering Evaluation-Aware Models to Act Like They Are Deployed \- LessWrong, accessed on December 22, 2025, [https://www.lesswrong.com/posts/peKrvZ6t9PSCzoQDa/steering-evaluation-aware-models-to-act-like-they-are](https://www.lesswrong.com/posts/peKrvZ6t9PSCzoQDa/steering-evaluation-aware-models-to-act-like-they-are)  
7. Activation Steering in Neural Networks \- Emergent Mind, accessed on December 22, 2025, [https://www.emergentmind.com/topics/activation-steering](https://www.emergentmind.com/topics/activation-steering)  
8. Representation Engineering Mistral-7B an Acid Trip \- Theia Vogel, accessed on December 22, 2025, [https://vgel.me/posts/representation-engineering/](https://vgel.me/posts/representation-engineering/)  
9. Representation Engineering: Mistral-7B on Acid \- Simon Willison's Weblog, accessed on December 22, 2025, [https://simonwillison.net/2024/Feb/18/control-vectors/](https://simonwillison.net/2024/Feb/18/control-vectors/)  
10. mistral-nemo:12b \- Ollama, accessed on December 22, 2025, [https://ollama.com/library/mistral-nemo:12b](https://ollama.com/library/mistral-nemo:12b)  
11. Confused about the number of layers in Mistral Nemo 12b. : r/LocalLLaMA \- Reddit, accessed on December 22, 2025, [https://www.reddit.com/r/LocalLLaMA/comments/1h0y10x/confused\_about\_the\_number\_of\_layers\_in\_mistral/](https://www.reddit.com/r/LocalLLaMA/comments/1h0y10x/confused_about_the_number_of_layers_in_mistral/)  
12. mistralai/Mistral-Nemo-Instruct-2407 \- Demo \- DeepInfra, accessed on December 22, 2025, [https://deepinfra.com/mistralai/Mistral-Nemo-Instruct-2407](https://deepinfra.com/mistralai/Mistral-Nemo-Instruct-2407)  
13. Mistral NeMo, accessed on December 22, 2025, [https://mistral.ai/news/mistral-nemo](https://mistral.ai/news/mistral-nemo)  
14. Announcing: text-generation-webui in a portable zip (700MB) for llama.cpp models \- unzip and run on Windows/Linux/macOS \- no installation required\! : r/LocalLLaMA \- Reddit, accessed on December 22, 2025, [https://www.reddit.com/r/LocalLLaMA/comments/1k595in/announcing\_textgenerationwebui\_in\_a\_portable\_zip/](https://www.reddit.com/r/LocalLLaMA/comments/1k595in/announcing_textgenerationwebui_in_a_portable_zip/)  
15. HelpSteer2-Preference: Complementing Ratings with Preferences1NVIDIA, 2Georgia Tech, work done during internship at NVIDIA \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2410.01257v2](https://arxiv.org/html/2410.01257v2)  
16. Llama-3.3-Nemotron-70B-Edit \- 开源模型 \- nvidia \- OpenCSG \- Llama3.3 \- Safetensors, accessed on December 22, 2025, [https://opencsg.com/models/AIWizards/Llama-3.3-Nemotron-70B-Edit](https://opencsg.com/models/AIWizards/Llama-3.3-Nemotron-70B-Edit)  
17. nvidia/Llama-3\_1-Nemotron-51B-Instruct \- Hugging Face, accessed on December 22, 2025, [https://huggingface.co/nvidia/Llama-3\_1-Nemotron-51B-Instruct](https://huggingface.co/nvidia/Llama-3_1-Nemotron-51B-Instruct)  
18. nvidia/Llama-3.1-Nemotron-Nano-8B-v1 \- Hugging Face, accessed on December 22, 2025, [https://huggingface.co/nvidia/Llama-3.1-Nemotron-Nano-8B-v1](https://huggingface.co/nvidia/Llama-3.1-Nemotron-Nano-8B-v1)  
19. nvidia/Llama-3.1-Nemotron-70B-Instruct \- Hugging Face, accessed on December 22, 2025, [https://huggingface.co/nvidia/Llama-3.1-Nemotron-70B-Instruct](https://huggingface.co/nvidia/Llama-3.1-Nemotron-70B-Instruct)  
20. HelpSteer3 \- NVIDIA NGC Catalog, accessed on December 22, 2025, [https://catalog.ngc.nvidia.com/orgs/nvidia/teams/nemo/resources/helpsteer3](https://catalog.ngc.nvidia.com/orgs/nvidia/teams/nemo/resources/helpsteer3)  
21. Leverage the Latest Open Models for Synthetic Data Generation with NVIDIA Nemotron-4-340B, accessed on December 22, 2025, [https://developer.nvidia.com/blog/leverage-our-latest-open-models-for-synthetic-data-generation-with-nvidia-nemotron-4-340b/](https://developer.nvidia.com/blog/leverage-our-latest-open-models-for-synthetic-data-generation-with-nvidia-nemotron-4-340b/)  
22. Llama Nemotron Models Accelerate Agentic AI Workflows with Accuracy and Efficiency, accessed on December 22, 2025, [https://developer.nvidia.com/blog/llama-nemotron-models-accelerate-agentic-ai-workflows-with-accuracy-and-efficiency/](https://developer.nvidia.com/blog/llama-nemotron-models-accelerate-agentic-ai-workflows-with-accuracy-and-efficiency/)  
23. Model Alignment by SteerLM Method — NVIDIA NeMo Framework User Guide, accessed on December 22, 2025, [https://docs.nvidia.com/nemo-framework/user-guide/25.02/modelalignment/steerlm.html](https://docs.nvidia.com/nemo-framework/user-guide/25.02/modelalignment/steerlm.html)  
24. Text generation web UI \- Deep Reason Extension \- oobabooga, accessed on December 22, 2025, [https://oobabooga.gumroad.com/l/deep\_reason](https://oobabooga.gumroad.com/l/deep_reason)  
25. nvidia/nemotron-3-8b-chat-4k-steerlm \- Hugging Face, accessed on December 22, 2025, [https://huggingface.co/nvidia/nemotron-3-8b-chat-4k-steerlm](https://huggingface.co/nvidia/nemotron-3-8b-chat-4k-steerlm)