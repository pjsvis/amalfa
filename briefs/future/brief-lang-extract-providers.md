Based on the `langextract/providers/ollama.py` file you uploaded, **LangExtract natively supports both local and cloud/remote Ollama instances.**

The `OllamaLanguageModel` class is designed to handle connection URLs and authentication headers, which allows it to connect to any endpoint compatible with the Ollama API, whether it is running on `localhost` or a remote server.

### 1. Using Ollama Locally (Default)

By default, the provider assumes a standard local setup. You only need to specify the model ID.

* **Code:** `langextract/providers/ollama.py`
* **Default URL:** `http://localhost:11434`

```python
import langextract as lx

# The provider automatically defaults to http://localhost:11434
result = lx.extract(
    text_or_documents="Input text...",
    model_id="gemma2:2b",  # Specify your local model
    prompt_description="Extract...",
    examples=[...]
)

```

### 2. Using Cloud or Remote Ollama Clients

To use a cloud-hosted Ollama instance or a remote server (e.g., a corporate proxy, a cloud GPU instance, or an API-compatible service), you need to override the `model_url` and optionally provide an `api_key`.

The `OllamaLanguageModel` class explicitly accepts `model_url`, `api_key`, `auth_header`, and `auth_scheme` arguments to support these scenarios.

#### Method A: Using `lx.extract` (Quickest)

You can pass these connection details via the `language_model_params` argument (or `provider_kwargs` in some versions, but `ollama.py` shows these are accepted in `__init__` which `lx.extract` passes through).

```python
result = lx.extract(
    text_or_documents="Input text...",
    model_id="llama3-70b",
    prompt_description="Extract...",
    examples=[...],
    # Pass connection details here
    model_url="https://your-cloud-instance.com",  # Cloud endpoint
    api_key="your-api-key",                       # If auth is required
    timeout=300                                   # Longer timeout for network lag
)

```

#### Method B: Using `ModelConfig` (Best for Production)

For cleaner code, especially in production, use the `ModelConfig` object to encapsulate the provider settings.

```python
config = lx.factory.ModelConfig(
    model_id="llama3-70b",
    provider="OllamaLanguageModel",  # Explicitly select the provider
    provider_kwargs={
        "model_url": "https://remote-ollama-api.com",
        "api_key": "sk-proj-...", 
        "auth_header": "Authorization", # Default is Authorization
        "auth_scheme": "Bearer",        # Default is Bearer
        "timeout": 600
    }
)

result = lx.extract(
    text_or_documents="...",
    config=config,
    prompt_description="...",
    examples=[...]
)

```

### Technical Details from `ollama.py`

* **Authentication:** The code checks for an `api_key`. If present, it adds an Authorization header formatted as `{auth_scheme} {api_key}` (e.g., `Bearer sk-...`).
* **Safety Warning:** The code will issue a `UserWarning` if you provide an `api_key` while connecting to `localhost`, as native local Ollama typically does not require auth.
* **Endpoint Construction:** The provider automatically appends `/api/generate` to your base URL, so you should provide the root URL (e.g., `https://api.myserver.com`) rather than the full endpoint path.