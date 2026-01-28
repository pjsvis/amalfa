import json
import os
from typing import Any, Dict, List, Optional

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field

mcp = FastMCP("LangExtract Sidecar")


class Entity(BaseModel):
    name: str = Field(description="Name of the entity")
    type: str = Field(
        description="Type of the entity (e.g., Person, Location, Concept)"
    )
    description: Optional[str] = Field(description="Brief description or context")


class Relationship(BaseModel):
    source: str = Field(description="Name of the source entity")
    target: str = Field(description="Name of the target entity")
    type: str = Field(description="Type of relationship (e.g., USES, DEPENDS_ON)")
    description: Optional[str] = Field(description="Context for the relationship")


class GraphData(BaseModel):
    entities: List[Entity]
    relationships: List[Relationship]


def get_config() -> Dict[str, Any]:
    """Load configuration from environment or defaults"""
    return {
        "provider": os.environ.get("LANGEXTRACT_PROVIDER", "gemini"),
        "gemini": {
            "api_key": os.environ.get("GEMINI_API_KEY"),
            "model": os.environ.get("GEMINI_MODEL", "gemini-flash-latest"),
        },
        "ollama": {
            "host": os.environ.get("OLLAMA_HOST", "http://localhost:11434"),
            "model": os.environ.get("OLLAMA_MODEL", "qwen2.5:1.5b"),
        },
        "openrouter": {
            "api_key": os.environ.get("OPENROUTER_API_KEY"),
            "model": os.environ.get("OPENROUTER_MODEL", "qwen/qwen-2.5-72b-instruct"),
        },
    }


def call_gemini(text: str, config: Dict[str, Any]) -> str:
    """Extract using Google Gemini"""
    import google.generativeai as genai

    gemini_config = config["gemini"]
    api_key = gemini_config["api_key"]

    if not api_key:
        return json.dumps({"error": "GEMINI_API_KEY not set"})

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(gemini_config["model"])

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
        response = model.generate_content(
            prompt, generation_config={"response_mime_type": "application/json"}
        )
        return response.text
    except Exception as e:
        return json.dumps({"error": f"Gemini extraction failed: {str(e)}"})


def call_ollama(text: str, config: Dict[str, Any]) -> str:
    """Extract using Ollama (local or remote via localhost)"""
    import requests

    ollama_config = config["ollama"]
    host = ollama_config["host"]
    model = ollama_config["model"]

    if not host:
        return json.dumps({"error": "OLLAMA_HOST not configured"})

    endpoint = f"{host.rstrip('/')}/api/chat"

    prompt = """Analyze the following text and extract a knowledge graph.
Identify key entities (concepts, technologies, people, files) and relationships between them.

Output ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "entities": [
    {"name": "Entity Name", "type": "EntityType", "description": "Context"}
  ],
  "relationships": [
    {"source": "Entity1", "target": "Entity2", "type": "RELATIONSHIP_TYPE", "description": "Why they are related"}
  ]
}

Text to analyze:
"""

    messages = [{"role": "user", "content": prompt + text}]

    headers = {"Content-Type": "application/json"}
    body = {"model": model, "messages": messages, "stream": False, "format": "json"}

    try:
        response = requests.post(endpoint, headers=headers, json=body, timeout=120)
        response.raise_for_status()
        result = response.json()

        message_content = result.get("message", {}).get("content", "")

        clean_content = message_content.strip()
        if clean_content.startswith("```json"):
            clean_content = (
                clean_content.replace("```json", "").replace("```", "").strip()
            )

        return clean_content
    except Exception as e:
        return json.dumps({"error": f"Ollama extraction failed: {str(e)}"})


def call_openrouter(text: str, config: Dict[str, Any]) -> str:
    """Extract using OpenRouter"""
    import requests

    openrouter_config = config["openrouter"]
    api_key = openrouter_config["api_key"]
    model = openrouter_config["model"]

    if not api_key:
        return json.dumps({"error": "OPENROUTER_API_KEY not set"})

    endpoint = "https://openrouter.ai/api/v1/chat/completions"

    prompt = """Analyze the following text and extract a knowledge graph.
Identify key entities (concepts, technologies, people, files) and relationships between them.

Output ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "entities": [
    {"name": "Entity Name", "type": "EntityType", "description": "Context"}
  ],
  "relationships": [
    {"source": "Entity1", "target": "Entity2", "type": "RELATIONSHIP_TYPE", "description": "Why they are related"}
  ]
}

Text to analyze:
"""

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://github.com/pjsvis/amalfa",
        "X-Title": "AMALFA Knowledge Graph",
    }

    body = {"model": model, "messages": [{"role": "user", "content": prompt + text}]}

    try:
        response = requests.post(endpoint, headers=headers, json=body, timeout=120)
        response.raise_for_status()
        result = response.json()

        message_content = result["choices"][0]["message"]["content"]

        clean_content = message_content.strip()
        if clean_content.startswith("```json"):
            clean_content = (
                clean_content.replace("```json", "").replace("```", "").strip()
            )

        return clean_content
    except Exception as e:
        return json.dumps({"error": f"OpenRouter extraction failed: {str(e)}"})


@mcp.tool()
def extract_graph(text: str, provider: Optional[str] = None) -> str:
    """
    Extracts a knowledge graph (entities and relationships) from the given text.

    Supports multiple providers:
    - gemini: Google Gemini API (default)
    - ollama: Local Ollama instance (supports both local and remote models via localhost:11434)
    - openrouter: OpenRouter API

    Provider can be overridden via 'provider' parameter or LANGEXTRACT_PROVIDER env var.
    """

    config = get_config()
    active_provider = provider or config["provider"]

    if active_provider == "gemini":
        return call_gemini(text, config)
    elif active_provider == "ollama":
        return call_ollama(text, config)
    elif active_provider == "openrouter":
        return call_openrouter(text, config)
    else:
        return json.dumps({"error": f"Unknown provider: {active_provider}"})


if __name__ == "__main__":
    mcp.run()
