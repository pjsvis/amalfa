from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field
from typing import List, Optional
from providers import create_provider

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

@mcp.tool()
def extract_graph(text: str) -> str:
    """
    Extracts a knowledge graph (entities and relationships) from the given text
    using the configured language model provider (Gemini by default, Ollama if configured).
    """
    try:
        provider = create_provider()
        return provider.extract_graph(text)
    except ValueError as e:
        return f"Error: {str(e)}"
    except Exception as e:
        return f"Error during extraction: {str(e)}"

if __name__ == "__main__":
    mcp.run()
