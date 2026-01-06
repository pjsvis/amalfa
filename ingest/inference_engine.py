"""
Inference Engine for Polyvis Local-First Classifier.

Provides confident predictions with actionability thresholds
for integration with the Harvester pipeline.

Usage:
    from inference_engine import ConceptClassifier
    
    engine = ConceptClassifier()
    result = engine.analyze("The Noosphere is the sphere of thought.")
    # {'prediction': 'DEF_CANDIDATE', 'confidence': 0.95, 'is_actionable': True}
"""

import json
from pathlib import Path
import torch
from setfit import SetFitModel


class ConceptClassifier:
    """
    Local-first text classifier for semantic extraction.
    
    Identifies high-value text (definitions, directives) that should
    be passed to the "Net" (Llama.cpp) for structured extraction.
    """
    
    def __init__(self, model_path: str | Path | None = None):
        """
        Initialize the classifier by loading the trained model.
        
        Args:
            model_path: Path to the trained SetFit model directory.
                       Defaults to ./polyvis_classifier_v1
        """
        if model_path is None:
            model_path = Path(__file__).parent / "polyvis_classifier_v1"
        else:
            model_path = Path(model_path)
        
        print(f"Loading Classifier from {model_path}...")
        
        # Load the fine-tuned SetFit model
        self.model = SetFitModel.from_pretrained(str(model_path))
        
        # Load the integer-to-label mapping
        with open(model_path / "label_map.json", "r") as f:
            self.id2label = json.load(f)
    
    def analyze(self, text: str, threshold: float = 0.75) -> dict:
        """
        Analyze text and return prediction with confidence.
        
        Args:
            text: The text to classify
            threshold: Confidence threshold for actionability (default: 0.75)
        
        Returns:
            dict with keys:
                - text_fragment: Truncated input text
                - prediction: Class label (DEF_CANDIDATE, DIR_CANDIDATE, etc.)
                - confidence: Probability score (0.0 - 1.0)
                - is_actionable: True if confidence > threshold AND not NOISE_CHAT
        """
        # Get probabilities for each class
        probs = self.model.predict_proba([text])[0]
        
        # Find the predicted class
        pred_id = int(torch.argmax(torch.tensor(probs)))
        confidence = float(probs[pred_id])
        label = self.id2label[str(pred_id)]
        
        # Determine if this is actionable (high confidence, not noise)
        is_actionable = (
            confidence > threshold and 
            label in ('DEF_CANDIDATE', 'DIR_CANDIDATE')
        )
        
        return {
            "text_fragment": text[:50] + "..." if len(text) > 50 else text,
            "prediction": label,
            "confidence": round(confidence, 4),
            "is_actionable": is_actionable
        }
    
    def batch_analyze(self, texts: list[str], threshold: float = 0.75) -> list[dict]:
        """Analyze multiple texts at once (more efficient)."""
        return [self.analyze(t, threshold) for t in texts]


# --- CLI Test ---
if __name__ == "__main__":
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
        
        status_icon = "🟢" if result['is_actionable'] else "⚪"
        print(f"{status_icon} [{result['prediction']}] ({result['confidence']}): {result['text_fragment']}")
