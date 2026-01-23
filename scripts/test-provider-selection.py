#!/usr/bin/env python3
"""
Test script to verify provider selection logic without making API calls
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "sidecars", "lang-extract"))

from providers import create_provider


def test_gemini_provider():
    """Test that Gemini provider is created when selected"""
    print("🧪 Testing Gemini provider selection...")
    os.environ["LANGEXTRACT_PROVIDER"] = "gemini"
    os.environ["GEMINI_API_KEY"] = "test-key"
    
    try:
        provider = create_provider()
        print(f"  ✅ Provider type: {type(provider).__name__}")
        assert type(provider).__name__ == "GeminiLanguageModelProvider"
        print("  ✅ Gemini provider created successfully")
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False
    
    return True


def test_ollama_provider():
    """Test that Ollama provider is created when selected"""
    print("\n🧪 Testing Ollama provider selection...")
    os.environ["LANGEXTRACT_PROVIDER"] = "ollama"
    os.environ["OLLAMA_MODEL"] = "test-model"
    
    try:
        provider = create_provider()
        print(f"  ✅ Provider type: {type(provider).__name__}")
        assert type(provider).__name__ == "OllamaLanguageModelProvider"
        print("  ✅ Ollama provider created successfully")
        print(f"  ✅ Model ID: {provider.model_id}")
        print(f"  ✅ Model URL: {provider.model_url}")
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False
    
    return True


def test_default_provider():
    """Test that Gemini is the default provider"""
    print("\n🧪 Testing default provider (should be Gemini)...")
    
    for key in ["LANGEXTRACT_PROVIDER", "GEMINI_API_KEY", "OLLAMA_MODEL"]:
        if key in os.environ:
            del os.environ[key]
    
    os.environ["GEMINI_API_KEY"] = "test-key"
    
    try:
        provider = create_provider()
        print(f"  ✅ Provider type: {type(provider).__name__}")
        assert type(provider).__name__ == "GeminiLanguageModelProvider"
        print("  ✅ Default provider is Gemini")
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False
    
    return True


def test_ollama_url_fallback():
    """Test that Ollama URL defaults to localhost"""
    print("\n🧪 Testing Ollama URL fallback...")
    os.environ["LANGEXTRACT_PROVIDER"] = "ollama"
    os.environ["OLLAMA_MODEL"] = "test-model"
    
    if "OLLAMA_URL" in os.environ:
        del os.environ["OLLAMA_URL"]
    
    try:
        provider = create_provider()
        print(f"  ✅ Default URL: {provider.model_url}")
        assert provider.model_url == "http://localhost:11434"
        print("  ✅ URL defaults to localhost correctly")
    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return False
    
    return True


def test_unknown_provider():
    """Test that unknown provider raises error"""
    print("\n🧪 Testing unknown provider error handling...")
    os.environ["LANGEXTRACT_PROVIDER"] = "unknown-provider"
    
    try:
        provider = create_provider()
        print("  ❌ Should have raised ValueError")
        return False
    except ValueError as e:
        print(f"  ✅ Correctly raised ValueError: {e}")
        return True
    except Exception as e:
        print(f"  ❌ Wrong exception type: {e}")
        return False


def main():
    print("=" * 60)
    print("Provider Selection Integration Tests")
    print("=" * 60)
    
    results = []
    
    results.append(("Gemini provider", test_gemini_provider()))
    results.append(("Ollama provider", test_ollama_provider()))
    results.append(("Default provider", test_default_provider()))
    results.append(("Ollama URL fallback", test_ollama_url_fallback()))
    results.append(("Unknown provider error", test_unknown_provider()))
    
    print("\n" + "=" * 60)
    print("Results Summary")
    print("=" * 60)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
    
    all_passed = all(passed for _, passed in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ All tests passed!")
        print("=" * 60)
        return 0
    else:
        print("❌ Some tests failed")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
