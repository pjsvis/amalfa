import os
import google.generativeai as genai
from .base import LanguageModelProvider


class GeminiLanguageModelProvider(LanguageModelProvider):
    def __init__(self, api_key: str | None = None, model_name: str = "gemini-flash-latest"):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("LANGEXTRACT_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not set in environment or provided to constructor")
        
        self.model_name = model_name
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
    
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
        
        try:
            response = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return response.text
        except Exception as e:
            return f"Error during extraction: {str(e)}"
