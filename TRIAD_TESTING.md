### The "Control Room" URLs

Once you run `python3 src/orchestrator.py`, or `bun run triad:start` open these links in separate tabs:

* **The Scout (Phi-3.5):** [`http://127.0.0.1:8082`](https://www.google.com/search?q=%5Bhttp://127.0.0.1:8082%5D(http://127.0.0.1:8082))
* *Expect:* Fast, chatty, eager to please.


* **The Architect (Llama-3 + Accountant Vector):** [`http://127.0.0.1:8083`](https://www.google.com/search?q=%5Bhttp://127.0.0.1:8083%5D(http://127.0.0.1:8083))
* *Expect:* Dry, concise, "boring." It might refuse to chat and just wait for data.


* **The Auditor (Olmo-3):** [`http://127.0.0.1:8084`](https://www.google.com/search?q=%5Bhttp://127.0.0.1:8084%5D(http://127.0.0.1:8084))
* *Expect:* Deep thinker. When you type a prompt, you will see it "Think" (generate the thought trace) before it gives you the final answer.



### A Useful Debugging Trick

Since you are manually testing via the UI, you can actually **watch the vector working**.

1. Go to **The Architect** (Port 8083).
2. Ask it: *"Tell me a joke."*
3. Because of the Accountant vector, it will likely struggle, give a very literal "joke," or just refuse.
4. Then go to **The Scout** (Port 8082) and ask the same thing. It will likely give you a normal joke.

This is the best way to physically "feel" the difference your architecture has created.

Ready to launch the orchestrator?