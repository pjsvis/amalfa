#!/bin/bash

# 1. Create the Hazard Lab
mkdir -p experiments/enlightenment
cd experiments/enlightenment

# 2. Update .gitignore (Crucial: Don't commit 10GB of AI)
# We append to the root .gitignore if these rules aren't there
if ! grep -q "experiments/enlightenment/models" ../../.gitignore; then
    echo -e "\n# Enlightenment Experiment\nexperiments/enlightenment/models/\nexperiments/enlightenment/venv/\nexperiments/enlightenment/__pycache__/\n*.gguf" >> ../../.gitignore
    echo "✅ Added safety rules to .gitignore"
fi

# 3. Create Python Virtual Environment
echo "🐍 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

# 4. Install Dependencies
# repeng: The control vector library
# torch/transformers: For calculating the vector
echo "⬇️ Installing PyTorch and Transformers (this may take a minute)..."
pip install torch transformers repeng tqdm notebook

# 5. Clone llama.cpp (for the server)
if [ ! -d "llama.cpp" ]; then
    echo "🏗️ Cloning and building llama.cpp..."
    git clone https://github.com/ggerganov/llama.cpp
    cd llama.cpp
    make -j4  # Build the server
    cd ..
fi

echo "✅ Environment Ready in experiments/enlightenment/"
echo "   Next Step: Download the Llama-3 Model."