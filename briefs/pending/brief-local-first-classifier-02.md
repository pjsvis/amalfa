**Locus Tag:** `[Locus: Implementation_SetFit_Classifier]`

Initiating **Phase 2 (Automate)** of the Local-First Conceptual Classifier project.

Below are the three necessary artifacts to bootstrap the system: the **Data Skeleton**, the **Training Script**, and the **Requirements**. This adheres to **OH-084 (Type-Safe Implementation)** where applicable, though Python is the industry standard for this specific ML task.

### Artifact 1: Data Skeleton (`training_data.json`)

*Context: This is the "seed" data. You will need to populate this with about 8-10 real examples per category from our chat logs to make it effective.*

```json
[
  {
    "text": "The Noosphere is the sphere of human thought, mind, and intellectual activity.",
    "label": "DEF_CANDIDATE"
  },
  {
    "text": "Mentation is the internal cognitive processing by which an entity transforms stuff into things.",
    "label": "DEF_CANDIDATE"
  },
  {
    "text": "Before analyzing an image, first describe its objective content.",
    "label": "DIR_CANDIDATE"
  },
  {
    "text": "Always use the It might be a good idea to invocation for complex suggestions.",
    "label": "DIR_CANDIDATE"
  },
  {
    "text": "Let's switch gears and talk about the architecture of the AntiGravity IDE.",
    "label": "LOCUS_SHIFT"
  },
  {
    "text": "Moving on to the topic of Ursula Le Guin.",
    "label": "LOCUS_SHIFT"
  },
  {
    "text": "That sounds like a plan, proceed.",
    "label": "NOISE_CHAT"
  },
  {
    "text": "Can you check the weather in Edinburgh?",
    "label": "NOISE_CHAT"
  }
]

```

### Artifact 2: The Trainer (`train_classifier.py`)

*Context: This script utilizes `setfit` to fine-tune a lightweight Sentence Transformer. It is designed to run locally on a CPU or consumer GPU.*

```python
import json
from datasets import Dataset
from setfit import SetFitModel, SetFitTrainer

# --- Configuration ---
DATA_FILE = "training_data.json"
OUTPUT_DIR = "./polyvis_classifier_v1"
# We use a small, fast base model optimized for sentence similarity
BASE_MODEL = "sentence-transformers/paraphrase-mpnet-base-v2"

def load_data(filepath):
    """Loads JSON data and converts it to a Hugging Face Dataset."""
    print(f"Loading data from {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Extract columns
    texts = [item['text'] for item in data]
    labels = [item['label'] for item in data]
    
    # Create a mapping for string labels to integers (SetFit needs ints)
    unique_labels = list(set(labels))
    label2id = {label: i for i, label in enumerate(unique_labels)}
    id2label = {i: label for label, i in label2id.items()}
    
    print(f"Found classes: {unique_labels}")
    
    # Convert labels to IDs
    label_ids = [label2id[l] for l in labels]
    
    dataset = Dataset.from_dict({
        "text": texts,
        "label": label_ids
    })
    
    return dataset, id2label

def train_and_save():
    # 1. Prepare Data
    train_dataset, id2label = load_data(DATA_FILE)
    
    # 2. Load Base Model
    print(f"Loading base model: {BASE_MODEL}...")
    model = SetFitModel.from_pretrained(BASE_MODEL)
    
    # 3. Create Trainer
    print("Initializing trainer...")
    trainer = SetFitTrainer(
        model=model,
        train_dataset=train_dataset,
        loss_class="CosineSimilarityLoss",
        metric="accuracy",
        batch_size=16,
        num_iterations=20, # Number of text pairs to generate for contrastive learning
        num_epochs=1,      # One epoch is usually enough for Few-Shot
        column_mapping={"text": "text", "label": "label"}
    )
    
    # 4. Train
    print("Training started (this may take a minute)...")
    trainer.train()
    
    # 5. Save Model and Label Mapping
    print(f"Saving model to {OUTPUT_DIR}...")
    model.save_pretrained(OUTPUT_DIR)
    
    # Save the label mapping as a separate JSON for the inference engine to use later
    with open(f"{OUTPUT_DIR}/label_map.json", "w") as f:
        json.dump(id2label, f)
        
    print("DONE. Model ready for inference.")

    # --- Quick Sanity Check ---
    print("\n--- Running Sanity Check ---")
    test_text = "The protocol requires us to verify the image first."
    preds = model([test_text])
    predicted_label = id2label[int(preds[0])]
    print(f"Input: '{test_text}'")
    print(f"Predicted: {predicted_label}")

if __name__ == "__main__":
    train_and_save()

```

### Artifact 3: Requirements (`requirements.txt`)

```text
setfit
datasets
scikit-learn
torch

```

### Next Steps (The "Gumption" Protocol)

1. **Populate:** Edit `training_data.json` and add ~8 real examples from our recent chat history for each category.
2. **Install:** Run `pip install -r requirements.txt`.
3. **Execute:** Run `python train_classifier.py`.
4. **Verify:** Check the console output. If the "Sanity Check" correctly identifies the test sentence as a `DIR_CANDIDATE` (or similar), we have a working prototype.

**Would you like me to simulate the "Inference" code snippet next, so you can see how to call this model from within the AntiGravity IDE?**