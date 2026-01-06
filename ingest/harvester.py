"""
Harvester: The "Sieve and Net" Coordinator.

Scans documents, classifies text with SetFit (Sieve), extracts
triples via Llama.cpp+GBNF (Net), and outputs knowledge_graph.json.

Supports "Hollow Node" architecture with URI deep links.

Usage:
    python harvester.py [input_file_or_dir]
    
    # Or process specific files:
    python harvester.py knowledge/playbooks/example.md
"""

import json
import os
import re
import sys
from pathlib import Path
import requests

from inference_engine import ConceptClassifier


# --- Configuration ---
LLAMA_API_URL = os.environ.get("LLAMA_API_URL", "http://localhost:8080/completion")
OUTPUT_FILE = Path(__file__).parent / "knowledge_graph.json"
CONFIDENCE_THRESHOLD = 0.85


class Harvester:
    """
    Orchestrates the Sieve and Net protocol for semantic extraction.
    """
    
    def __init__(self, llama_url: str = LLAMA_API_URL):
        print("🌾 Initializing Harvester...")
        print("   Loading Sieve (SetFit classifier)...")
        self.sieve = ConceptClassifier()
        self.llama_url = llama_url
        self.nodes_metadata: dict = {}
        self.edges_cache: list = []
    
    def _sanitize_anchor(self, text: str) -> str:
        """Convert text to URL-safe anchor ID."""
        return re.sub(r'\s+', '-', text).strip()
    
    def _call_llama_net(self, text: str) -> list[dict]:
        """
        The 'Net': Extract triples using Llama.cpp with GBNF enforcement.
        
        Falls back to regex extraction if server unavailable.
        """
        prompt = f"""SYSTEM: You are a Knowledge Graph Extractor. Extract semantic triples from the text.
OUTPUT: JSON array of objects with "source", "rel", "target" keys.

USER: {text}

ASSISTANT:"""
        
        payload = {
            "prompt": prompt,
            "temperature": 0.1,
            "n_predict": 256,
            "cache_prompt": True,
        }
        
        try:
            response = requests.post(self.llama_url, json=payload, timeout=30)
            if response.status_code == 200:
                content = response.json().get('content', '').strip()
                # GBNF guarantees valid JSON
                return json.loads(content)
        except requests.exceptions.ConnectionError:
            # Fallback to regex extraction
            return self._extract_with_regex(text)
        except json.JSONDecodeError:
            print("   ⚠️  Invalid JSON from Llama - using fallback")
            return self._extract_with_regex(text)
        except Exception as e:
            print(f"   ⚠️  Llama error: {e} - using fallback")
            return self._extract_with_regex(text)
        
        return []
    
    def _extract_with_regex(self, text: str) -> list[dict]:
        """
        Fallback extraction using regex patterns when Llama is unavailable.
        
        Extracts:
        - "X is a Y" -> IS_A relationship
        - "X is the Y" -> IS_A relationship  
        - "X implements Y" -> IMPLEMENTS relationship
        - "X uses Y" -> USES relationship
        """
        triples = []
        
        # Pattern: "X is a/an/the Y"
        is_a_pattern = r'^([A-Z][^.]*?)\s+is\s+(?:a|an|the)\s+([^.]+)'
        match = re.search(is_a_pattern, text, re.IGNORECASE)
        if match:
            source = match.group(1).strip()
            target = match.group(2).strip()
            # Clean up common endings
            target = re.sub(r'\s+that\b.*$', '', target)
            target = re.sub(r'\s+which\b.*$', '', target)
            if len(source) > 2 and len(target) > 2:
                triples.append({"source": source, "rel": "IS_A", "target": target})
        
        # Pattern: "X implements Y"
        impl_pattern = r'^([A-Z][^.]*?)\s+implements\s+(?:the\s+)?([^.]+)'
        match = re.search(impl_pattern, text, re.IGNORECASE)
        if match:
            source = match.group(1).strip()
            target = match.group(2).strip()
            if len(source) > 2 and len(target) > 2:
                triples.append({"source": source, "rel": "IMPLEMENTS", "target": target})
        
        if triples:
            print(f"      📋 Regex extracted {len(triples)} triples (fallback)")
        
        return triples
    
    def process_file(self, filepath: str | Path) -> int:
        """
        Process a single file through Sieve and Net.
        
        Returns the number of triples extracted.
        """
        filepath = Path(filepath)
        filename = filepath.name
        print(f"\n📄 Processing: {filename}")
        
        # Register Document Node (the "Island")
        doc_node = filename
        self.nodes_metadata[doc_node] = {
            "type": "document",
            "uri": f"polyvis://{filename}"
        }
        
        # Read file content
        try:
            content = filepath.read_text(encoding='utf-8')
        except Exception as e:
            print(f"   ❌ Could not read file: {e}")
            return 0
        
        # Split into sentences/paragraphs
        lines = [l.strip() for l in content.split('\n') if len(l.strip()) > 20]
        
        triples_count = 0
        
        for line in lines:
            # 1. THE SIEVE (Fast Classification)
            analysis = self.sieve.analyze(line, threshold=CONFIDENCE_THRESHOLD)
            
            if not analysis['is_actionable']:
                continue
            
            print(f"   🔍 [{analysis['confidence']:.2f}] {line[:50]}...")
            
            # 2. THE NET (Structured Extraction)
            triples = self._call_llama_net(line)
            
            if not triples:
                continue
            
            print(f"      🕸️  Extracted {len(triples)} triples")
            
            for triple in triples:
                src = triple.get('source', '')
                tgt = triple.get('target', '')
                rel = triple.get('rel', 'RELATED_TO')
                
                if not src or not tgt:
                    continue
                
                # Register concept node with URI (the "Islet")
                if src not in self.nodes_metadata:
                    self.nodes_metadata[src] = {
                        "type": "concept",
                        "uri": f"polyvis://{filename}#{self._sanitize_anchor(src)}"
                    }
                
                # Add structural edge (Document -> Concept)
                self.edges_cache.append({
                    "source": doc_node,
                    "rel": "HAS_PART",
                    "target": src,
                    "confidence_score": 1.0,
                    "context_source": str(filepath)
                })
                
                # Add semantic edge
                self.edges_cache.append({
                    "source": src,
                    "rel": rel.upper(),
                    "target": tgt,
                    "confidence_score": analysis['confidence'],
                    "context_source": str(filepath)
                })
                
                triples_count += 1
        
        return triples_count
    
    def process_directory(self, dirpath: str | Path) -> int:
        """Process all markdown files in a directory."""
        dirpath = Path(dirpath)
        total = 0
        
        for filepath in dirpath.rglob("*.md"):
            total += self.process_file(filepath)
        
        return total
    
    def save_artifact(self):
        """Save the knowledge graph artifact."""
        artifact = {
            "nodes": self.nodes_metadata,
            "edges": self.edges_cache
        }
        
        print(f"\n💾 Saving artifact to {OUTPUT_FILE}...")
        print(f"   Nodes: {len(self.nodes_metadata)}")
        print(f"   Edges: {len(self.edges_cache)}")
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(artifact, f, indent=2)
        
        print("✅ Harvest complete.")
    
    def run(self, target: str | Path | None = None):
        """
        Main entry point. Process target file/directory or demo mode.
        """
        if target:
            target = Path(target)
            if target.is_file():
                self.process_file(target)
            elif target.is_dir():
                self.process_directory(target)
            else:
                print(f"❌ Target not found: {target}")
                return
        else:
            # Demo mode
            print("\n--- Demo Mode (no target specified) ---")
            demo_text = "ResonanceDB is the semantic graph database powering Polyvis."
            
            analysis = self.sieve.analyze(demo_text)
            print(f"Sieve: {analysis}")
            
            if analysis['is_actionable']:
                triples = self._call_llama_net(demo_text)
                print(f"Net: {triples}")
                
                for t in triples:
                    self.edges_cache.append({
                        "source": t.get('source', ''),
                        "rel": t.get('rel', 'RELATED_TO'),
                        "target": t.get('target', ''),
                        "confidence_score": analysis['confidence'],
                        "context_source": "demo"
                    })
        
        self.save_artifact()


if __name__ == "__main__":
    harvester = Harvester()
    
    target = sys.argv[1] if len(sys.argv) > 1 else None
    harvester.run(target)
