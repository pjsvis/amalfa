Based on the current OpenRouter listings (as of early 2026), the platform offers several powerful models in its free tier. These models are generally rate-limited or subject to availability queues but provide state-of-the-art capabilities without cost.  
Here are the best free models categorized by their strengths:

### **1\. Best General Intelligence & Reasoning**

* **Llama 4 Maverick (Meta)**  
  * **ID:** meta-llama/llama-4-maverick:free  
  * **Strengths:** A massive 400B parameter MoE model that excels at complex reasoning and multi-step tasks. It is currently one of the most capable open-weights models available.  
* **Gemini 2.0 Flash Experimental (Google)**  
  * **ID:** google/gemini-2.0-flash-exp:free  
  * **Strengths:** Offers a massive context window (1M+ tokens) and multimodal capabilities (can process images/video). It is extremely fast and effective for large-document analysis.  
* **Llama 3.3 70B Instruct (Meta)**  
  * **ID:** meta-llama/llama-3.3-70b-instruct:free  
  * **Strengths:** The previous generation flagship, still highly reliable for general instruction following and nuanced writing.

### **2\. Best for Coding & Technical Tasks**

* **Devstral 2 (Mistral)**  
  * **ID:** mistralai/devstral-2-2512:free  
  * **Strengths:** Specifically fine-tuned for agentic coding workflows. It excels at architecting changes across multiple files and tracking dependencies.  
* **Qwen 2.5 Coder 32B (Alibaba)**  
  * **ID:** qwen/qwen-2.5-coder-32b-instruct:free  
  * **Strengths:** Widely considered the best "pound-for-pound" coding model. It often outperforms larger generalist models on Python and JavaScript generation.  
* **KAT-Coder-Pro V1**  
  * **ID:** kwaipilot/kat-coder-pro-v1:free  
  * **Strengths:** A specialized 88B model optimized for "tool use" and multi-turn debugging cycles, making it ideal for VS Code extensions like Roo Code or Cursor.

### **3\. Best for Roleplay & Creative Writing**

* **DeepSeek R1T2 Chimera**  
  * **ID:** tng/deepseek-r1t2-chimera:free  
  * **Strengths:** A specialized merge designed for creative storytelling and character interaction. It is less likely to refuse creative prompts compared to official Llama or Gemini models.  
* **Sonoma Dusk Alpha**  
  * **ID:** openrouter/sonoma-dusk-alpha:free  
  * **Strengths:** A "stealth" model highly rated by the community for picking up subtle emotional cues and adhering strictly to character personas.

### **4\. Best "Lightweight" Models (Fast/Low Latency)**

* **Llama 4 Scout (Meta)**  
  * **ID:** meta-llama/llama-4-scout:free  
  * **Strengths:** A 109B MoE model optimized for speed. It activates fewer parameters per token, making it snappier than Maverick while retaining high intelligence.  
* **Gemini 1.5 Flash 8B**  
  * **ID:** google/gemini-flash-1.5-8b:free  
  * **Strengths:** Extremely low latency, making it perfect for simple chat bots or summarization tasks where instant responses matter more than deep reasoning.

### **Summary Recommendation**

* **For tough logic/reasoning:** Use meta-llama/llama-4-maverick:free.  
* **For coding agents:** Use mistralai/devstral-2-2512:free.  
* **For huge documents:** Use google/gemini-2.0-flash-exp:free.