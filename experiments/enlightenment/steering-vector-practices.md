# **Representation Engineering and Activation Steering: A Comprehensive Analysis of Methodologies, Optimization Strategies, and Epistemic Alignment**

## **1\. Introduction: The Paradigm Shift in Model Control**

The landscape of Artificial Intelligence alignment and control is undergoing a fundamental transformation. For years, the primary mechanisms for shaping the behavior of Large Language Models (LLMs) were Reinforcement Learning from Human Feedback (RLHF) and Supervised Fine-Tuning (SFT). While effective, these methods are computationally intensive, require permanent modification of model weights, and often operate as "black boxes"—optimizing for an output without explaining the internal reasoning process. A new paradigm, **Representation Engineering (RepE)**, has emerged, offering a top-down approach to transparency and control. By identifying and manipulating the high-dimensional vectors that represent concepts within a model's residual stream, researchers can steer model behavior at inference time with surgical precision.1

This report serves as a critical analysis and strategic roadmap for your current experimental initiative: the manual creation of steering clusters for **Empiricism and Skepticism**, **Epistemic Humility**, and **Precision of Language**. Your current methodology involves small-scale datasets—specifically, clusters of five positive/negative pairs. The objective of this document is to benchmark this approach against generally accepted academic and industrial practices, identify statistical and theoretical vulnerabilities in the current setup, and provide a comprehensive resource guide for elevating these practices to state-of-the-art standards.

The analysis draws upon a wide array of recent literature, including seminal works on Contrastive Activation Addition (CAA) by Rimsky et al., Representation Engineering by Zou et al., and emerging benchmarks like HumbleBench and PacifAIst. We will explore the geometric nature of the Linear Representation Hypothesis, the statistical necessity of larger datasets for orthogonal vector extraction, and the nuanced interplay between steering for "skepticism" and the unintended consequence of model refusal.

## 

## **2\. Theoretical Foundations of Representation Engineering**

To understand why your current practice of using five-pair clusters differs from accepted standards, one must first understand the underlying theory of how LLMs represent knowledge and how steering vectors intervene in that process.

### **2.1 The Linear Representation Hypothesis and Latent Space Geometry**

The efficacy of activation steering relies fundamentally on the **Linear Representation Hypothesis**. This hypothesis posits that high-level semantic concepts—ranging from simple attributes like "gender" or "tense" to complex behaviors like "honesty," "refusal," or "sycophancy"—are encoded as linear directions (vectors) within the high-dimensional activation space of the model's transformer blocks.1

In a transformer model, the residual stream carries the evolving representation of the input token sequence through successive layers. Mathematically, if $h\_l$ represents the hidden state at layer $l$, the processing at that layer can be described as:

$$h\_{l+1} \= h\_l \+ \\text{Attention}(h\_l) \+ \\text{MLP}(h\_l)$$  
The hypothesis suggests that a concept $C$ corresponds to a direction $v\_C$ such that the projection of a state $h$ onto $v\_C$ correlates with the activation of that concept. Consequently, the model's behavior can be steered by injecting a vector $v\_{steer}$ into the residual stream:

$$h'\_{l} \= h\_l \+ \\alpha \\cdot v\_{steer}$$  
Where $\\alpha$ is a steering coefficient that determines the intensity of the intervention. The critical insight here is that the "meaning" of a concept is defined by its direction relative to other concepts in the hyperspace.5

### 

### **2.2 The "Curse of Dimensionality" and Vector Extraction**

The primary challenge in creating effective steering vectors lies in the geometry of the latent space. In a space with dimension $d\_{model}$ (e.g., 4096 for Llama-2-7B), two random vectors are nearly orthogonal. However, concepts are not isolated; they are entangled. A vector intended to capture "precision of language" might accidentally capture "formality," "length," or "vocabulary complexity" if the contrastive pairs used to generate it are not carefully controlled.

This is where the distinction between your current **5-pair approach** and the **accepted practice of 50-100+ pairs** becomes mathematically critical.

When you extract a steering vector using the **Mean Difference** method (calculating the average difference between positive and negative examples), the resulting vector $v\_{steer}$ is a composite of the target concept vector $v\_{concept}$ and a noise vector $v\_{noise}$:

$$v\_{steer} \= v\_{concept} \+ \\frac{1}{N} \\sum\_{i=1}^{N} v\_{noise, i}$$  
With a small $N$ (e.g., $N=5$), the noise term $\\frac{1}{N} \\sum v\_{noise, i}$ does not converge to zero. The vector retains idiosyncratic features of the specific sentences used. For instance, if three of your five "Empiricism" prompts happen to feature medical contexts, the resulting vector will be rotated toward "Medicine." Steering this vector during a physics query could disastrously bias the model toward medical hallucinations.

Accepted practices emphasize the **Law of Large Numbers**. As $N$ increases to 50, 100, or 1000, the idiosyncratic noise (topic, sentence length, syntax) tends to be random and cancels out, isolating the only consistent direction: the target concept itself.8

### **2.3 Top-Down Transparency vs. Mechanistic Interpretability**

Representation Engineering (RepE) is distinct from traditional mechanistic interpretability. While mechanistic interpretability often attempts to reverse-engineer the network from the bottom up—identifying specific neurons or circuits responsible for a behavior—RepE adopts a top-down approach. It treats the population-level representations (the collective activation of thousands of neurons) as the fundamental unit of analysis.1

This distinction is crucial for practical application. Bottom-up identification of "skepticism" or "humility" circuits is currently intractable due to the **polysemanticity** of individual neurons (where one neuron activates for multiple unrelated concepts). RepE circumvents this by deriving a global vector that represents the *average difference* in brain state between a model exhibiting "humility" and one exhibiting "arrogance," effectively filtering out the polysemantic noise through statistical aggregation.2

## 

## **3\. Benchmarking Current Practices: The Data Scale Problem**

Your current methodology utilizes three clusters of five positive/negative pairs. A comparative analysis against the literature reveals that this dataset size is significantly below the threshold typically required for robust steering vector extraction, though recent "one-shot" innovations offer a nuanced counter-perspective.

### **3.1 The Standard: Contrastive Activation Addition (CAA) & RepE**

The prevailing standard for steering vector generation is established by works such as Zou et al. (Representation Engineering) and Rimsky et al. (Contrastive Activation Addition).

* **Zou et al. (2023):** In their seminal work on RepE, Zou et al. utilize datasets comprising hundreds of stimuli to train their Linear Artificial Tomography (LAT) models and extract reading vectors. For concepts like "honesty" or "happiness," they employ extensive datasets to ensure the extracted direction generalizes across different contexts. They often employ **Principal Component Analysis (PCA)** on the difference vectors, taking the first principal component to capture the direction of maximum variance, which requires enough data points to establish a valid covariance matrix.1  
* **Rimsky et al. (2023):** The CAA methodology explicitly warns against single-pair or small-n steering. Rimsky et al. demonstrate that using hundreds of diverse contrast pairs (often $N \> 100$) significantly reduces noise. They average the difference vectors across these pairs to cancel out unrelated features. In their experiments on sycophancy and hallucination, they utilized datasets generated by larger models (like Claude or GPT-4) containing hundreds of examples. They specifically note that using diverse contrast pairs allows for a "more precise encoding of the behavior of interest".8

### **3.2 The Outlier: One-Shot Optimization**

While large datasets are the standard, recent research has explored **"one-shot" steering**, where a vector is optimized from a single example.

* **Dunefsky et al. (2025):** This work shows that vectors optimized on a *single* training example can generalize, particularly for behaviors like "alignment faking" or refusal. However, it is critical to note the difference in methodology. They do not use simple mean difference. Instead, they use **gradient-based optimization** to find a vector that maximizes or minimizes the probability of a specific target sequence. This is a computationally distinct process from the arithmetic subtraction used in standard RepE/CAA.14  
* **Implication for You:** Unless you are employing these advanced gradient-based optimization techniques (which essentially "train" the vector against the model's loss function), a simple difference calculation on five pairs is unlikely to yield a robust feature. For standard Mean Difference or PCA-based extraction, volume of data is the primary proxy for quality control.

### **3.3 Comparative Table of Dataset Methodologies**

| Methodology | Typical Dataset Size (Pairs) | Extraction Method | Robustness to Noise | Computational Cost | Source |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **User Current Practice** | **5** | **Unknown (likely Mean Diff)** | **Low** | **Very Low** | **User Query** |
| Contrastive Activation Addition (CAA) | 50 \- 1,000 | Mean Difference | High | Low | 8 |
| Representation Engineering (RepE) | 100 \- 1,000+ | PCA (First Component) | High | Medium | 1 |
| Activation Scaling (ACTIVSCALAR) | Variable (Training based) | Gradient Optimization | Medium/High | High | 17 |
| One-Shot Steering | 1 (Optimized) | Gradient Descent | Variable | Medium | 14 |

**Conclusion on Benchmarking:** Your current practice falls into the "Low Robustness" category. While it may produce observable effects, the resulting vectors are likely "jagged"—containing noise that will cause the model to behave unpredictably on out-of-distribution inputs. To align with generally accepted practices, you must either scale your data volume (for Mean Diff/PCA) or switch to gradient-based optimization (for One-Shot).

## 

## **4\. Deep Analysis of Target Clusters**

The core of your request centers on three specific behavioral clusters: **Empiricism-and-Skepticism**, **Epistemic-Humility**, and **Precision-of-Language**. We will now analyze each cluster through the lens of the provided research, identifying missing nuances and resources.

### **4.1 Cluster 1: Empiricism and Skepticism**

**Operational Definition:** This cluster aims to steer the model towards reliance on observable evidence, scientific rigor, and questioning of unsupported claims.

Current Research & Accepted Practices:  
The literature contains extensive work on "Truthfulness", "Hallucination" reduction, and "Factuality", which acts as a proxy for empiricism.

* **TruthfulQA Vectors:** Li et al. (2024) and others have successfully extracted vectors for "Truthfulness" using the **TruthfulQA** dataset. This benchmark consists of questions designed to elicit "imitative falsehoods" (myths the model learns from training data). Steering vectors derived from TruthfulQA (contrasting true answers with popular myths) have been shown to significantly improve model factuality.18  
* **The "Skepticism" Trap (Refusal Cascades):** A critical insight from recent safety research is the tension between skepticism and refusal. "Skepticism" is often operationalized in safety alignment as "refusal to answer uncritically" or "demand for evidence." However, over-steering on this axis often leads to **"refusal cascading"** or "lobotomy," where the model becomes so skeptical it refuses to answer even basic factual questions, interpreting them as potential trick questions. Research on "Safety Awareness Scoring" uses contrastive pairs to isolate safety signals, but warns that excessive steering here degrades general utility.8  
* **Scientific Skepticism vs. Denialism:** A vector trained on "skepticism" must be carefully balanced to avoid creating a "denialist" model. If the negative examples in your pairs are merely "believing everything" and the positive are "doubting everything," the vector might encode "doubt" as a universal prior. Accepted practice involves training on **Scientific Skepticism** specifically—contrasting "accepting anecdotal evidence" (negative) with "demanding empirical evidence" (positive), rather than just "belief" vs. "disbelief".22

**Missing Relevant Information for User:**

* You need to differentiate between **epistemic skepticism** (doubting claims) and **safety refusal** (refusing to answer). Your current 5-pair cluster likely conflates these if not carefully curated.  
* **Resource:** Leverage **TruthfulQA** and **FactualityPrompt** datasets. These are pre-validated resources that contain hundreds of pairs perfectly aligned with your "Empiricism" goal.

### **4.2 Cluster 2: Epistemic Humility**

**Operational Definition:** This involves the model correctly calibrating its confidence, admitting ignorance when appropriate, and avoiding "sycophancy" (agreeing with the user's bias).

**Current Research & Accepted Practices:**

* **Sycophancy Steering:** This is one of the most well-developed areas in activation steering. Rimsky et al. (2023) created robust sycophancy steering vectors using datasets where the user offers a wrong opinion, and the model must decide whether to agree. They found that subtracting the sycophancy vector made the model politely disagree and correct the user, effectively increasing "Epistemic Humility".8  
* **HumbleBench & PacifAIst:** Recent benchmarks like **HumbleBench** explicitly test a model's ability to select "None of the above," measuring its capacity to admit it doesn't know. **PacifAIst** measures "Existential Prioritization" and self-preservation, which correlates with humility. Vectors derived from these datasets would likely be far superior to manual pairs because they cover the *structural* aspects of humility (knowing limits) rather than just the *stylistic* aspects (saying "I think").18  
* **Alignment Faking:** A major risk identified in recent literature is **"Alignment Faking."** A steering vector might force the model to *sound* humble ("I believe it might be...") without actually changing the internal uncertainty calculation. Recent work by Dunefsky et al. suggests that to genuinely increase epistemic humility, contrastive pairs must focus on **reasoning steps** (e.g., "Let me check the evidence..." vs. "It is definitely...") rather than just final answers. This pushes the steering deeper into the chain of thought.14  
* **Training for Balance:** Research indicates that "embedded epistemic humility" involves training models to naturally acknowledge data quality limitations. Steering vectors can mimic this by contrasting "confident/wrong" answers with "uncertain/correct" answers.27

**Missing Relevant Information for User:**

* **Sycophancy datasets** are a direct, leveraged resource for this cluster.  
* You must control for **"under-confidence."** A strong humility vector can make the model hedge on obvious facts ("The sky *appears* to be blue"). Accepted practice involves evaluating the vector on a "calibrated confidence" metric—it should increase uncertainty on ambiguous questions *without* increasing it on clear facts.

### 

### **4.3 Cluster 3: Precision of Language**

**Operational Definition:** Steering for conciseness, lack of ambiguity, and high information density.

**Current Research & Accepted Practices:**

* **Verbosity & Length Vectors:** Steering vectors have been successfully used to control response length and verbosity. This is often done by contrasting "short/concise" answers with "long/rambling" ones. However, "Precision" is often a composite attribute. Accepted practice would involve decomposing this into "conciseness," "vocabulary complexity," and "ambiguity avoidance".28  
* **Code vs. Prose Precision:** Precision in coding (syntax adherence) is mechanistically different from precision in prose (avoiding ambiguity). A single "precision" vector might not generalize across these domains. Research shows that "Code" and "Reasoning" often occupy different subspaces. If you want precision in both, you may need a **Mixture of Vectors** or a **Conditional Steering** approach.31  
* **Linguistic Bias:** Most RepE work is English-centric. Research indicates that latent spaces are optimized for English, and "precision" vectors might behave differently (or fail) in multilingual contexts. If your "precision" pairs rely on English idioms of clarity, they may not translate to general reasoning precision.28

**Missing Relevant Information for User:**

* **Prompt-Level vs. Activation-Level:** "Precision" is often easily achieved via system prompts (e.g., "Be concise"). Research compares steering vs. prompting and finds that steering is often more robust to "jailbreaks" (users trying to make the model rambling), but prompting is cheaper. You should verify if activation steering is actually necessary for this cluster or if prompting suffices.14  
* **Resource:** **XSum** or **CNN/DailyMail** (summarization datasets) can be repurposed to create contrast pairs of "Concise Summary" vs. "Verbose/Repetitive Text."

## 

## **5\. Improving Practices: Methodological Recommendations**

To move from the current experimental state to a robust, professional-grade implementation, the following roadmap integrates the identified gaps and resources.

### **5.1 Step 1: Automated Data Augmentation**

The most immediate and high-impact improvement is to scale the dataset from 5 pairs to **50–200 pairs per cluster**. This does not require manual writing; it is standard practice to use a "Teacher" LLM (like GPT-4o or Claude 3.5 Sonnet) to generate these pairs.

Recommended Pipeline 26:

1. **Seed Prompting:** Provide the Teacher LLM with your 5 manual pairs as "seed" examples.  
2. **Diversity Constraints:** Explicitly instruct the Teacher to generate new pairs across diverse topics (e.g., "Generate 20 pairs related to biology, 20 to history, 20 to politics, and 20 to daily life"). This ensures the vector captures the *concept*, not the *topic*.  
3. **Structure Enforcement:** Ensure the "Positive" and "Negative" examples are structurally similar.  
   * *Bad Pair:* P: "Gravity is a fundamental force." (Short) vs. N: "I think maybe gravity is like magic ghosts pushing down." (Long/Informal).  
   * *Good Pair:* P: "Gravity is a fundamental force." vs. N: "Gravity is a mystical illusion." (Matched length/tone).

**Example Prompt for Epistemic Humility Generation:**

"Generate 50 pairs of responses to difficult questions. The 'Positive' response should admit uncertainty or limitations. The 'Negative' response should confidently hallucinate or claim knowledge it does not have. The responses should be of similar length and style."

### **5.2 Step 2: Refining Vector Extraction (PCA vs. Mean Difference)**

Your current 5-pair dataset forces you to use **Mean Difference**. As you scale to 50+ pairs, you should transition to **Principal Component Analysis (PCA)**.

* **Mean Difference (CAA):** $\\vec{v} \= \\frac{1}{N} \\sum (h\_{pos} \- h\_{neg})$. This is robust if $N$ is large (hundreds). It assumes the noise is zero-mean and cancels out.8  
* **PCA (RepE):** Perform PCA on the matrix of difference vectors ($h\_{pos} \- h\_{neg}$). The first principal component (PC1) represents the direction of *maximum variance* between the pairs. This is often a cleaner signal for the target concept, as it filters out directions where the pairs differ randomly.35  
* **Implementation:** Use the **repeng** library, which automates PCA-based extraction and is highly optimized for models like Mistral and Llama.35

### **5.3 Step 3: Layer Selection & Sweeps**

Do not pick a layer arbitrarily. The effectiveness of steering is highly layer-dependent.

* **General Finding:** Steering is most effective in the **middle-to-late layers** (e.g., layers 15-25 in a 32-layer model like Llama-2-7B). Early layers process syntax; late layers process output tokens. Middle layers process the "concepts" you are interested in.8  
* **Optimization:** Perform a **"layer sweep"**. Train a vector for each layer and evaluate its performance on a held-out validation set. Select the layer that maximizes the target metric (e.g., sycophancy reduction) while minimizing perplexity degradation.38

### **5.4 Step 4: Compositionality and Orthogonality**

You have three distinct clusters. A critical question is whether these concepts are orthogonal or if they interfere.

* **Interference:** "Skepticism" and "Epistemic Humility" are likely correlated. Adding both vectors might "double count" the effect, leading to a model that refuses to answer anything.  
* **Technique:** Calculate the **cosine similarity** between the extracted vectors. If the similarity is high ($\>0.5$), the concepts are entangled. You may need to use techniques like **Orthogonal Projection** to ensure the "Precision" vector doesn't accidentally reduce "Humility".19  
* **Multi-Vector Steering:** Instead of adding three separate vectors, advanced methods involve training a single "joint" vector or using **"Subspace ReFT" (Representation Fine-Tuning)** to find a low-rank subspace that captures all three desirable traits simultaneously.40

## **6\. Resources to Leverage**

The following table summarizes the key resources identified in the research that you can immediately leverage to improve your practices.

| Resource Type | Name | Description | Use Case | Source |
| :---- | :---- | :---- | :---- | :---- |
| **Library** | **repeng** | Lightweight Python library for RepE. Supports PCA extraction. | Automating vector extraction. | 36 |
| **Library** | **CAA (GitHub)** | Rimsky et al.'s codebase for Contrastive Activation Addition. | Layer sweeps and evaluation. | 7 |
| **Dataset** | **TruthfulQA** | 817 questions contrasting truth vs. imitative falsehoods. | **Empiricism** Cluster. | 18 |
| **Dataset** | **Sycophancy (Anthropic)** | User/Assistant pairs testing agreement bias. | **Epistemic Humility** Cluster. | 8 |
| **Dataset** | **HumbleBench** | Questions testing rejection of incorrect options. | **Epistemic Humility** Cluster. | 25 |
| **Dataset** | **XSum / CNN-DM** | Summarization datasets. | **Precision** (Conciseness) Cluster. | 28 |
| **Tool** | **TransformerLens** | Mechanistic interpretability library. | Debugging vector failure. | 42 |

##  

## **7\. Strategic Implementation Roadmap**

Based on the analysis, here is the recommended path forward:

1. **Immediate Term (Next Steps):**  
   * Use an LLM to generate **50 contrastive pairs** for each of your three clusters.  
   * Switch from manual difference calculation to **repeng's PCA extraction**.  
   * Perform a **layer sweep** to identify the optimal intervention layer for each cluster.  
2. **Medium Term (Optimization):**  
   * Validate your "Empiricism" vector against **TruthfulQA** to ensure it isn't just a "science style" vector.  
   * Validate your "Humility" vector against **Sycophancy** datasets.  
   * Implement **Perplexity Monitoring**: Track the model's perplexity on a neutral dataset (like Wikitext) while steering. If perplexity spikes, your $\\alpha$ coefficient is too high, or your vector is damaging general capabilities (lobotomy effect).8  
3. **Long Term (Advanced):**  
   * Explore **Conditional Activation Steering (CAST)**. Train a "controller" that only applies the "Skepticism" vector when the model detects a factual claim, preventing the vector from interfering with casual conversation.43  
   * Investigate **Sparse Autoencoders (SAEs)**. Instead of a global steering vector, identify specific "monosemantic features" (neurons) in a trained SAE that correspond to "humility" and clamp them directly. This is the future direction of the field.13

## 

## **8\. Conclusion**

Your initiative to manually create steering clusters for high-level cognitive traits places you at the forefront of AI alignment research. However, the current methodology of using small, manually curated datasets (N=5) is statistically fragile and prone to noise. By scaling your data generation through synthetic means, adopting robust extraction techniques like PCA, and validating against established benchmarks like TruthfulQA and HumbleBench, you can elevate your practice from experimental exploration to reliable, professional-grade Representation Engineering. The transition from "vibe-based" manual steering to "metric-based" automated steering is the key to unlocking the true potential of these powerful models.

#### **Works cited**

1. Representation Engineering for Large-Language Models: Survey and Research Challenges, accessed on December 22, 2025, [https://arxiv.org/html/2502.17601v1](https://arxiv.org/html/2502.17601v1)  
2. Representation Engineering: A Top-Down Approach to AI Transparency \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2310.01405v4](https://arxiv.org/html/2310.01405v4)  
3. Representation Engineering and Representation Utilisation in Generalised Deep Learning \- The University of Liverpool Repository, accessed on December 22, 2025, [https://livrepository.liverpool.ac.uk/3182570/1/201581935\_June2024.pdf](https://livrepository.liverpool.ac.uk/3182570/1/201581935_June2024.pdf)  
4. Steering Language Models for Theorem Proving \- OpenReview, accessed on December 22, 2025, [https://openreview.net/forum?id=Gq7cBZC04L](https://openreview.net/forum?id=Gq7cBZC04L)  
5. IMPROVING REASONING PERFORMANCE IN LARGE LANGUAGE MODELS VIA REPRESENTATION ENGI \- ICLR Proceedings, accessed on December 22, 2025, [https://proceedings.iclr.cc/paper\_files/paper/2025/file/6e73c39cc428c7d264d9820319f31e79-Paper-Conference.pdf](https://proceedings.iclr.cc/paper_files/paper/2025/file/6e73c39cc428c7d264d9820319f31e79-Paper-Conference.pdf)  
6. Implementing activation steering \- LessWrong, accessed on December 22, 2025, [https://www.lesswrong.com/posts/ndyngghzFY388Dnew/implementing-activation-steering](https://www.lesswrong.com/posts/ndyngghzFY388Dnew/implementing-activation-steering)  
7. activation-steering/docs/faq.md at main \- GitHub, accessed on December 22, 2025, [https://github.com/IBM/activation-steering/blob/main/docs/faq.md](https://github.com/IBM/activation-steering/blob/main/docs/faq.md)  
8. Steering Llama 2 via Contrastive Activation Addition \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2312.06681v3](https://arxiv.org/html/2312.06681v3)  
9. Shifting Perspectives: Steering Vectors for Robust Bias Mitigation in LLMs \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2503.05371v2](https://arxiv.org/html/2503.05371v2)  
10. Steering Llama 2 via Contrastive Activation Addition \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2312.06681v2](https://arxiv.org/html/2312.06681v2)  
11. Representation Engineering: Explained In Depth | Towards AI, accessed on December 22, 2025, [https://towardsai.net/p/l/representation-engineering-explained-in-depth](https://towardsai.net/p/l/representation-engineering-explained-in-depth)  
12. Andy Zou, accessed on December 22, 2025, [https://andyzoujm.github.io/](https://andyzoujm.github.io/)  
13. MATS Research, accessed on December 22, 2025, [https://www.matsprogram.org/research](https://www.matsprogram.org/research)  
14. Do safety-relevant LLM steering vectors optimized on a single example generalize?, accessed on December 22, 2025, [https://www.lesswrong.com/posts/6aXe9nipTgwK5LxaP/do-safety-relevant-llm-steering-vectors-optimized-on-a](https://www.lesswrong.com/posts/6aXe9nipTgwK5LxaP/do-safety-relevant-llm-steering-vectors-optimized-on-a)  
15. One-shot Optimized Steering Vectors Mediate Safety-relevant Behaviors in LLMs, accessed on December 22, 2025, [https://openreview.net/forum?id=teW4nIZ1gy](https://openreview.net/forum?id=teW4nIZ1gy)  
16. Investigating Generalization of One-shot LLM Steering Vectors \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2502.18862v1](https://arxiv.org/html/2502.18862v1)  
17. \[Quick Review\] Activation Scaling for Steering and Interpreting Language Models \- Liner, accessed on December 22, 2025, [https://liner.com/review/activation-scaling-for-steering-and-interpreting-language-models](https://liner.com/review/activation-scaling-for-steering-and-interpreting-language-models)  
18. The PacifAIst Benchmark: Would an Artificial Intelligence Choose to Sacrifice Itself for Human Safety? \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2508.09762v1?ref=implicator.ai](https://arxiv.org/html/2508.09762v1?ref=implicator.ai)  
19. Multi-Task Alignment Using Steering Vectors \- Stanford University, accessed on December 22, 2025, [https://web.stanford.edu/class/cs224n/final-reports/256908428.pdf](https://web.stanford.edu/class/cs224n/final-reports/256908428.pdf)  
20. Scaling laws for activation steering with Llama 2 models and refusal mechanisms \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2507.11771v1](https://arxiv.org/html/2507.11771v1)  
21. Steering Llama 2 via Contrastive Activation Addition \- ResearchGate, accessed on December 22, 2025, [https://www.researchgate.net/publication/384215189\_Steering\_Llama\_2\_via\_Contrastive\_Activation\_Addition](https://www.researchgate.net/publication/384215189_Steering_Llama_2_via_Contrastive_Activation_Addition)  
22. TAB 4: PROPOSALS TO CHANGE FRE 702 \- Department of Justice, accessed on December 22, 2025, [https://www.justice.gov/d9/2023-01/01.13.23.%20--%20PCAST%20Report%20-%20Part%202.pdf](https://www.justice.gov/d9/2023-01/01.13.23.%20--%20PCAST%20Report%20-%20Part%202.pdf)  
23. Scientific Skepticism \~ IS CURSOR TOO OPTIMISITC? \- Feedback, accessed on December 22, 2025, [https://forum.cursor.com/t/scientific-skepticism-is-cursor-too-optimisitc/133038](https://forum.cursor.com/t/scientific-skepticism-is-cursor-too-optimisitc/133038)  
24. \#GoodFences – Is Scientific Skepticism Enough?What, Why & How do we Know ?, accessed on December 22, 2025, [https://www.psybertron.org/goodfences-is-scientific-skepticism-enough](https://www.psybertron.org/goodfences-is-scientific-skepticism-enough)  
25. Measuring Epistemic Humility in Multimodal Large Language Models | Request PDF, accessed on December 22, 2025, [https://www.researchgate.net/publication/395418647\_Measuring\_Epistemic\_Humility\_in\_Multimodal\_Large\_Language\_Models](https://www.researchgate.net/publication/395418647_Measuring_Epistemic_Humility_in_Multimodal_Large_Language_Models)  
26. Revealing alignment faking with a single prompt \- LessWrong, accessed on December 22, 2025, [https://www.lesswrong.com/posts/umHPAorGtY2Jo4BNR/revealing-alignment-faking-with-a-single-prompt](https://www.lesswrong.com/posts/umHPAorGtY2Jo4BNR/revealing-alignment-faking-with-a-single-prompt)  
27. Training for Balance: Embedding Epistemic Humility in Language Model Training \- Medium, accessed on December 22, 2025, [https://medium.com/@mbonsign/training-for-balance-embedding-epistemic-humility-in-language-model-training-abb03dd1f44a](https://medium.com/@mbonsign/training-for-balance-embedding-epistemic-humility-in-language-model-training-abb03dd1f44a)  
28. Navigating LLM Latent Spaces: The Role of English Language in Effective Prompt Engineering | by Daniela Vorkel | Medium, accessed on December 22, 2025, [https://medium.com/@daniela.vorkel/navigating-llm-latent-spaces-the-role-of-english-language-in-effective-prompt-engineering-d2a0e9d72263](https://medium.com/@daniela.vorkel/navigating-llm-latent-spaces-the-role-of-english-language-in-effective-prompt-engineering-d2a0e9d72263)  
29. Learning to Skim Text \- ResearchGate, accessed on December 22, 2025, [https://www.researchgate.net/publication/316451383\_Learning\_to\_Skim\_Text](https://www.researchgate.net/publication/316451383_Learning_to_Skim_Text)  
30. 5 Metrics for Evaluating Prompt Clarity \- Ghost, accessed on December 22, 2025, [https://latitude-blog.ghost.io/blog/5-metrics-for-evaluating-prompt-clarity/](https://latitude-blog.ghost.io/blog/5-metrics-for-evaluating-prompt-clarity/)  
31. Top 10 Real-World NLP Applications \- Zilliz Learn, accessed on December 22, 2025, [https://zilliz.com/learn/top-5-nlp-applications](https://zilliz.com/learn/top-5-nlp-applications)  
32. Aptly: Making Mobile Apps from Natural Language \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2405.00229v2](https://arxiv.org/html/2405.00229v2)  
33. Prompt-Level Steering Strategies \- Emergent Mind, accessed on December 22, 2025, [https://www.emergentmind.com/topics/prompt-level-steering](https://www.emergentmind.com/topics/prompt-level-steering)  
34. A Unified Understanding and Evaluation of Steering Methods \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2502.02716v1](https://arxiv.org/html/2502.02716v1)  
35. Representation Engineering Mistral-7B an Acid Trip \- Theia Vogel, accessed on December 22, 2025, [https://vgel.me/posts/representation-engineering/](https://vgel.me/posts/representation-engineering/)  
36. Control vectors: add a meaningful bias in each layer : r/LocalLLaMA \- Reddit, accessed on December 22, 2025, [https://www.reddit.com/r/LocalLLaMA/comments/1atqj7f/control\_vectors\_add\_a\_meaningful\_bias\_in\_each/](https://www.reddit.com/r/LocalLLaMA/comments/1atqj7f/control_vectors_add_a_meaningful_bias_in_each/)  
37. Dialz: A Python Toolkit for Steering Vectors Warning: This paper contains examples of language that may be considered offensive or distressing. \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2505.06262v1](https://arxiv.org/html/2505.06262v1)  
38. Steering Llama 2 via Contrastive Activation Addition \- ACL Anthology, accessed on December 22, 2025, [https://aclanthology.org/2024.acl-long.828.pdf](https://aclanthology.org/2024.acl-long.828.pdf)  
39. Knowledge Composition using Task Vectors with Learned Anisotropic Scaling \- NIPS papers, accessed on December 22, 2025, [https://papers.nips.cc/paper\_files/paper/2024/file/7c7baa87e763a7e2fa2527e7bf105508-Paper-Conference.pdf](https://papers.nips.cc/paper_files/paper/2024/file/7c7baa87e763a7e2fa2527e7bf105508-Paper-Conference.pdf)  
40. ReFT: Representation Finetuning for Language Models \- NIPS papers, accessed on December 22, 2025, [https://proceedings.neurips.cc/paper\_files/paper/2024/file/75008a0fba53bf13b0bb3b7bff986e0e-Paper-Conference.pdf](https://proceedings.neurips.cc/paper_files/paper/2024/file/75008a0fba53bf13b0bb3b7bff986e0e-Paper-Conference.pdf)  
41. Evaluation of Sparse Autoencoder-based Refusal Features in LLMs \- reposiTUm, accessed on December 22, 2025, [https://repositum.tuwien.at/bitstream/20.500.12708/220332/1/Kerl%20Tilman%20-%202025%20-%20Evaluation%20of%20Sparse%20Autoencoder-based%20Refusal%20Features%20in...pdf](https://repositum.tuwien.at/bitstream/20.500.12708/220332/1/Kerl%20Tilman%20-%202025%20-%20Evaluation%20of%20Sparse%20Autoencoder-based%20Refusal%20Features%20in...pdf)  
42. Awesome-Interpretability-in-Large-Language-Models/README.md at main \- GitHub, accessed on December 22, 2025, [https://github.com/ruizheliUOA/Awesome-Interpretability-in-Large-Language-Models/blob/main/README.md](https://github.com/ruizheliUOA/Awesome-Interpretability-in-Large-Language-Models/blob/main/README.md)  
43. Guiding Giants: Lightweight Controllers for Weighted Activation Steering in LLMs \- arXiv, accessed on December 22, 2025, [https://arxiv.org/html/2505.20309v2](https://arxiv.org/html/2505.20309v2)  
44. Measuring and Guiding Monosemanticity \- OpenReview, accessed on December 22, 2025, [https://openreview.net/pdf?id=REHjkmWdQL](https://openreview.net/pdf?id=REHjkmWdQL)