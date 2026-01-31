---
date: 2026-01-31
tags: [frontend, tts, web-speech-api, polyvis]
agent: antigravity
status: active
---

# Implementation Plan: PolyVis Text-to-Speech

## 🎯 Objective
Give the PolyVis Dashboard a "Voice" using the Web Speech API (zero-dependency, local, low-latency) to announce system status and events.

## ☘️ Persona
*   **Target Voice**: **Moira** (English (Ireland) `en-IE`).
*   **Fallback Strategy**: 
    1.  Match `name="Moira"`
    2.  Match `lang="en-IE"`
    3.  Match `lang="en-GB"` (Female preferred)
    4.  Default System Voice

## 🛠️ Technical Implementation

### 1. `SpeechService` (Frontend Class)
A lightweight wrapper around `window.speechSynthesis`.

```typescript
class SpeechService {
    private voice: SpeechSynthesisUtterance['voice'] = null;
    private muted: boolean = false;

    constructor() {
        // Load preferences from localStorage
        this.muted = localStorage.getItem('tts_muted') === 'true';
        
        // Handle async voice loading
        window.speechSynthesis.onvoiceschanged = () => this.selectVoice();
        this.selectVoice();
    }

    private selectVoice() {
        const voices = window.speechSynthesis.getVoices();
        // Priority Selection
        this.voice = 
            voices.find(v => v.name === 'Moira') ||
            voices.find(v => v.lang === 'en-IE') ||
            voices.find(v => v.lang === 'en-GB' && v.name.includes('Female')) ||
            voices[0];
            
        console.log(`TTS Voice Selected: ${this.voice?.name} (${this.voice?.lang})`);
    }

    public speak(text: string, priority: 'high'|'low' = 'low') {
        if (this.muted) return;
        if (priority === 'high') window.speechSynthesis.cancel(); // Interrupt
        
        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = 1.0;
        
        window.speechSynthesis.speak(utterance);
    }
    
    public toggleMute() {
        this.muted = !this.muted;
        if (this.muted) window.speechSynthesis.cancel();
        localStorage.setItem('tts_muted', String(this.muted));
    }
}
```

### 2. Integration Points
*   **Ingestion Complete**: "System updated. N files processed."
*   **Error**: "Alert. Service failure detected."
*   **Welcome**: "PolyVis operational."

## ✅ Verification
*   User confirmed `Moira` works and is desired.
*   Test Page (`/assets/tts.html`) validated API support.
