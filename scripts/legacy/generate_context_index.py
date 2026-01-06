import os
import re
import json
import datetime

# CONFIGURATION
CONTEXT_DIR = "./context"
OUTPUT_FILE = "./context/context_index.json"

def parse_front_matter(content):
    """
    Extracts YAML-style front matter from markdown content.
    Uses regex to avoid external dependencies like PyYAML.
    """
    # Regex to find content between the first two '---' separators
    pattern = r"^---\s*\n(.*?)\n---\s*\n"
    match = re.search(pattern, content, re.DOTALL)
    
    if not match:
        return None

    yaml_block = match.group(1)
    metadata = {}
    
    # Simple line-by-line parsing
    for line in yaml_block.split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()
            
            # Handle list syntax [tag1, tag2]
            if value.startswith('[') and value.endswith(']'):
                value = [v.strip() for v in value[1:-1].split(',')]
            
            # Remove quotes if present
            elif value.startswith('"') and value.endswith('"'):
                value = value[1:-1]
            elif value.startswith("'") and value.endswith("'"):
                value = value[1:-1]
                
            metadata[key] = value
            
    return metadata

def generate_index():
    index_data = []
    
    # Check if directory exists
    if not os.path.exists(CONTEXT_DIR):
        print(f"Error: Directory '{CONTEXT_DIR}' not found.")
        return

    print(f"Scanning {CONTEXT_DIR} for memory blocks...")

    # Iterate through files
    for filename in os.listdir(CONTEXT_DIR):
        if filename.endswith(".md") and filename != "00_memory_blocks.md":
            filepath = os.path.join(CONTEXT_DIR, filename)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                metadata = parse_front_matter(content)
                
                if metadata:
                    # Add filename as a fallback ID if not provided
                    if 'id' not in metadata:
                        metadata['id'] = filename
                    
                    # Add the relative path so the Agent knows where to read the full content
                    metadata['filepath'] = filepath
                    
                    index_data.append(metadata)
                    print(f"  [+] Indexed: {filename}")
                else:
                    print(f"  [-] Skipped (No Front Matter): {filename}")
                    
            except Exception as e:
                print(f"  [!] Error reading {filename}: {e}")

    # Write to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2)

    print(f"\nSuccess! Index generated at: {OUTPUT_FILE}")
    print(f"Total entries: {len(index_data)}")

if __name__ == "__main__":
    generate_index()