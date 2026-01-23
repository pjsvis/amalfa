import os
import warnings
import json
import requests
from .base import LanguageModelProvider


class OllamaLanguageModelProvider(LanguageModelProvider):
    def __init__(
        self,
        model_id: str | None = None,
        model_url: str | None = None,
        api_key: str | None = None,
        auth_header: str = "Authorization",
        auth_scheme: str = "Bearer",
        timeout: int = 300
    ):
        self.model_id = model_id or os.environ.get("OLLAMA_MODEL")
        if not self.model_id:
            raise ValueError("OLLAMA_MODEL not set in environment or provided to constructor")
        
        self.model_url = model_url or os.environ.get("OLLAMA_URL", "http://localhost:11434")
        self.api_key = api_key or os.environ.get("OLLAMA_API_KEY") or os.environ.get("LANGEXTRACT_API_KEY")
        self.auth_header = auth_header
        self.auth_scheme = auth_scheme
        self.timeout = timeout
        
        if self.api_key and "localhost" in self.model_url:
            warnings.warn(
                "Using API key with localhost Ollama instance. "
                "Local Ollama typically does not require authentication.",
                UserWarning
            )
        
        self.endpoint = f"{self.model_url.rstrip('/')}/api/generate"
    
    def extract_graph(self, text: str) -> str:
        prompt = f"""
Analyze the following text and extract a knowledge graph.
Identify key entities (concepts, technologies, people, files) and relationships between them.

Output JSON format:
{{
  "entities": [
    {{"name": "Entity Name", "type": "EntityType", "description": "Context"}}
  ],
  "relationships": [
    {{"source": "Entity1", "target": "Entity2", "type": "RELATIONSHIP_TYPE", "description": "Why they are related"}}
  ]
}}

Text to analyze:
{text}
"""
        
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers[self.auth_header] = f"{self.auth_scheme} {self.api_key}"
        
        payload = {
            "model": self.model_id,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        
        try:
            response = requests.post(
                self.endpoint,
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            result = response.json()
            
            if "response" in result:
                return result["response"]
            else:
                return json.dumps({"error": "Unexpected response format", "raw": result})
                
        except requests.exceptions.Timeout:
            return json.dumps({"error": f"Request timed out after {self.timeout} seconds"})
        except requests.exceptions.ConnectionError as e:
            return json.dumps({"error": f"Connection failed: {str(e)}"})
        except requests.exceptions.HTTPError as e:
            return json.dumps({"error": f"HTTP error: {str(e)}"})
        except Exception as e:
            return json.dumps({"error": f"Error during extraction: {str(e)}"})
