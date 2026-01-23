
import os
import json
import google.generativeai as genai
import ollama
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field
from typing import List, Optional

mcp = FastMCP("LangExtract Sidecar")

class Entity(BaseModel):
    name: str = Field(description="Name of the entity")
    type: str = Field(description="Type of the entity (e.g., Person, Location, Concept)")
    description: Optional[str] = Field(description="Brief description or context")

class Relationship(BaseModel):
    source: str = Field(description="Name of the source entity")
    target: str = Field(description="Name of the target entity")
    type: str = Field(description="Type of relationship (e.g., USES, DEPENDS_ON)")
    description: Optional[str] = Field(description="Context for the relationship")

class GraphData(BaseModel):
    entities: List[Entity]
    relationships: List[Relationship]

def extract_with_gemini(text: str, model: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("LANGEXTRACT_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY not set in environment."

    genai.configure(api_key=api_key)
    
    gemini_model = genai.GenerativeModel(model)
    
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
        response = gemini_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return response.text
    except Exception as e:
        return f"Error during Gemini extraction: {str(e)}"

def extract_with_ollama(text: str, host: str, model: str) -> str:
    prompt = f"""
    Analyze the following text and extract a knowledge graph.
    Identify key entities (concepts, technologies, people, files) and relationships between them.
    
    You MUST respond with ONLY valid JSON in this exact format, no markdown, no extra text:
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
        client = ollama.Client(host=f"http://{host}")
        response = client.generate(model=model, prompt=prompt, format="json")
        
        response_text = response['response']
        
        try:
            json.loads(response_text)
            return response_text
        except json.JSONDecodeError:
            cleaned = response_text.replace("```json\n", "").replace("\n```", "").strip()
            json.loads(cleaned)
            return cleaned
            
    except Exception as e:
        return f"Error during Ollama extraction: {str(e)}"

@mcp.tool()
def extract_graph(text: str) -> str:
    """
    Extracts a knowledge graph (entities and relationships) from the given text
    using either Gemini or Ollama based on configuration.
    """
    
    provider = os.environ.get("LANGEXTRACT_PROVIDER", "gemini").lower()
    
    if provider == "ollama":
        host = os.environ.get("LANGEXTRACT_OLLAMA_HOST", "localhost:11434")
        model = os.environ.get("LANGEXTRACT_OLLAMA_MODEL", "qwen2.5:1.5b")
        return extract_with_ollama(text, host, model)
    elif provider == "gemini":
        model = os.environ.get("LANGEXTRACT_GEMINI_MODEL", "gemini-flash-latest")
        return extract_with_gemini(text, model)
    else:
        return f"Error: Unknown provider '{provider}'. Must be 'ollama' or 'gemini'."

if __name__ == "__main__":
    mcp.run()
