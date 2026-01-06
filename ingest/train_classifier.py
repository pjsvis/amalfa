"""
SetFit Classifier Trainer for Polyvis Local-First Pipeline.

Trains a lightweight text classifier to identify:
- DEF_CANDIDATE: Definitions suitable for the Conceptual Lexicon
- DIR_CANDIDATE: Directives/rules for operational heuristics
- LOCUS_SHIFT: Context change signals
- NOISE_CHAT: General conversation (filtered out)

Usage:
    python train_classifier.py
"""

import json
import os
from pathlib import Path
from datasets import Dataset
from setfit import SetFitModel, Trainer

# --- Configuration ---
DATA_FILE = Path(__file__).parent / "training_data.json"
OUTPUT_DIR = Path(__file__).parent / "polyvis_classifier_v1"
BASE_MODEL = "sentence-transformers/paraphrase-mpnet-base-v2"


def load_data(filepath: Path) -> tuple[Dataset, dict]:
    """Loads JSON data and converts it to a Hugging Face Dataset."""
    print(f"Loading data from {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    texts = [item['text'] for item in data]
    labels = [item['label'] for item in data]
    
    # Create label mappings
    unique_labels = sorted(set(labels))
    label2id = {label: i for i, label in enumerate(unique_labels)}
    id2label = {i: label for label, i in label2id.items()}
    
    print(f"Found classes: {unique_labels}")
    
    label_ids = [label2id[l] for l in labels]
    
    dataset = Dataset.from_dict({
        "text": texts,
        "label": label_ids
    })
    
    return dataset, id2label


def train_and_save():
    """Train the SetFit model and save to disk."""
    
    # 1. Prepare Data
    train_dataset, id2label = load_data(DATA_FILE)
    
    # 2. Load Base Model
    print(f"Loading base model: {BASE_MODEL}...")
    model = SetFitModel.from_pretrained(BASE_MODEL)
    
    # 3. Create Trainer (SetFit 1.0+ API)
    print("Initializing trainer...")
    trainer = Trainer(
        model=model,
        train_dataset=train_dataset,
        column_mapping={"text": "text", "label": "label"}
    )
    
    # 4. Train
    print("Training started (this may take a minute)...")
    trainer.train()
    
    # 5. Save Model and Label Mapping
    print(f"Saving model to {OUTPUT_DIR}...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    model.save_pretrained(OUTPUT_DIR)
    
    with open(OUTPUT_DIR / "label_map.json", "w") as f:
        json.dump(id2label, f, indent=2)
    
    print("✅ Model saved successfully.")

    # --- Sanity Check ---
    print("\n--- Running Sanity Check ---")
    test_cases = [
        ("The Noosphere is the sphere of human thought.", "DEF_CANDIDATE"),
        ("Always verify outputs before committing.", "DIR_CANDIDATE"),
        ("Let's switch to the database topic.", "LOCUS_SHIFT"),
        ("Sounds good, let's proceed.", "NOISE_CHAT")
    ]
    
    for text, expected in test_cases:
        preds = model.predict([text])
        predicted_label = id2label[int(preds[0])]
        status = "✅" if predicted_label == expected else "❌"
        print(f"{status} '{text[:40]}...' -> {predicted_label} (expected: {expected})")


if __name__ == "__main__":
    train_and_save()
