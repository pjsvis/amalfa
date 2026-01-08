## Added
- **OpenRouter Cloud Integration**: New `sonar.cloud` config with `openrouter` provider for accessing cloud LLMs
- **Dev-Cloud/Prod-Local Strategy**: Test with large cloud models, deploy with smaller local ones
- **Model Strategy Guide**: New `docs/guides/model-strategy.md` documentation
- **RAG Pipeline**: Vector search now augments chat context for grounded responses
- **ENV API Key**: `OPENROUTER_API_KEY` read from `.env` for secure credential handling

## Changed
- **Tiered Model Strategy**: Research tasks use cloud config, quick tasks use local `qwen2.5:1.5b`
- **Expanded Ingestion Sources**: Root markdown files now included in knowledge graph
- **Model Priority**: Updated to prioritize `qwen2.5:1.5b` as default local model

## Removed
- Cleaned up unused Ollama models: `tinydolphin`, `tinyllama`, `phi3`, `functiongemma`, `nomic-embed-text`, `llama3.1:8b`, `mistral:7b-instruct`
