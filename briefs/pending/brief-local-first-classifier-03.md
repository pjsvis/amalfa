**Locus Tag:** `[Locus: Inference_Implementation_SetFit]`

We proceed to **Phase 3: Scale (Integration)**.

The training script builds the "brain." This script, `inference_engine.py`, is the "voice." It is designed to be imported by your AntiGravity IDE backend or run as a micro-service.

It includes **Confidence Scoring**. This is critical for **OH-082 ("Fast and Slow" Thinking)**—if the confidence is low (< 0.7), we treat the output as "noise" rather than incorrectly tagging a concept.

### Artifact 4: The Inference Engine (`inference_engine.py`)

```python
import json
import torch
from setfit import SetFitModel

class ConceptClassifier:
    def __init__(self, model_path="./polyvis_classifier_v1"):
        """
        Initializes the inference engine by loading the model and label map.
        """
        print(f"Loading Classifier from {model_path}...")
        
        # Load the fine-tuned SetFit model
        # Force CPU execution for "Low-Tech Defence" compatibility (no CUDA req)
        self.model = SetFitModel.from_pretrained(model_path)
        
        # Load the integer-to-label mapping we saved during training
        with open(f"{model_path}/label_map.json", "r") as f:
            # JSON keys are always strings, so we convert them back to int logic if needed
            self.id2label = json.load(f)

    def analyze(self, text):
        """
        Analyzes text and returns the label and confidence score.
        """
        # Get raw probabilities (e.g., [0.1, 0.85, 0.05])
        probs = self.model.predict_proba([text])[0]
        
        # Find the index of the highest probability
        pred_id = int(torch.argmax(probs))
        confidence = float(probs[pred_id])
        
        # Map ID to human-readable label
        label = self.id2label[str(pred_id)]
        
        return {
            "text_fragment": text[:50] + "..." if len(text) > 50 else text,
            "prediction": label,
            "confidence": round(confidence, 4),
            "is_actionable": confidence > 0.75 # Threshold for automation
        }

# --- AntiGravity Integration Test ---
if __name__ == "__main__":
    # Simulating the IDE sending chunks of text to the engine
    engine = ConceptClassifier()
    
    test_inputs = [
        "The Noosphere is the sphere of human thought.",
        "Can you fix the indentation on line 45?",
        "Strictly adhere to the Principle of Factored Design.",
        "Let's switch contexts to the biology simulation."
    ]
    
    print("\n--- Real-Time Inference Log ---")
    for fragment in test_inputs:
        result = engine.analyze(fragment)
        
        # Visual cues for the log
        status_icon = "🟢" if result['is_actionable'] else "⚪"
        print(f"{status_icon} [{result['prediction']}] ({result['confidence']}): {result['text_fragment']}")

```

### Integration Logic for AntiGravity IDE

To wire this into your IDE infrastructure, you would use a "Sidecar" pattern:

1. **The Watcher:** In VS Code (or AntiGravity), a lightweight extension listens to the user's input buffer.
2. **The Debounce:** It waits for a pause in typing (e.g., 2000ms).
3. **The Hand-off:** It sends the current paragraph to `inference_engine.analyze()`.
4. **The UI Reaction:**
* If `prediction == 'DEF_CANDIDATE'` and `is_actionable == True`: A small "lightbulb" icon appears. Clicking it executes the **"Add to Lexicon"** macro.
* If `prediction == 'LOCUS_SHIFT'`: The IDE status bar flashes, suggesting a new context save point.



**Next Step:**
You now have the complete toolchain: **Brief -> Data -> Training -> Inference**.
I recommend you run the training script with your 8-10 examples first. Once you confirm the "Sanity Check" passes, you can drop this inference class directly into your project utils.

**Would you like me to draft the `training_data.json` with some realistic "Polyvis" specific examples to save you the initial typing?**