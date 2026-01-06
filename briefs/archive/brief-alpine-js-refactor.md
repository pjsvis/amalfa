# Brief Alpine Js Refactor

This is the **Weaponised Happy Path** for the refactor. We are moving from "Imperative Spaghetti" (Vanilla JS) to "Declarative Reactive" (Alpine.js).

This brief is designed to be handed directly to your coding agent (VS Code / Ctx-VS).

---

## **Project Brief: Refactor UI to Alpine.js (Reactive "Thingification")**

Objective:  
Refactor the existing public/index.html and associated scripts to replace "raw" vanilla JavaScript event handling (addEventListener, getElementById) with Alpine.js.  
**Core Philosophy:**

* **Locality of Behavior:** Logic should sit on the element that triggers it.  
* **State over Events:** The UI should react to changes in *data*, not just listen for clicks.  
* **Factored Design:** Keep the heavy lifting (SQLite/WASM logic) separate from the UI layer.

### **1\. Technical Constraints**

* **No Build Step:** Use Alpine.js via CDN (\<script src="//unpkg.com/alpinejs" defer\>\</script\>).  
* **Preserve Data Layer:** The existing logic that loads sql.js and queries ctx.db must remain, but it should be wrapped in a clean "Service Object" that Alpine can call.  
* **No JQuery:** We are deleting dependencies, not adding heavy ones.

### **2\. Implementation Plan**

****Step A: The "Service Layer" (The Data Wrapper)****

Encapsulate the existing sql.js logic into a global object or function that returns a Promise.

* *Current:* Loose functions mixed with DOM manipulation.  
* *Target:* A clean API like window.LexiconService.search(term).

****Step B: The "State Object" (Alpine x-data)****

Create a main Alpine component on the \<body\> or main container.

* **State Variables:**  
  * isLoading (bool)  
  * searchQuery (string)  
  * results (array of objects)  
  * selectedTerm (object or null)  
* **Methods:**  
  * init(): Trigger the DB load.  
  * performSearch(): Call the Service Layer, update results.  
  * clear(): Reset state.

****Step C: The "View Layer" (HTML Refactor)****

Strip all ID-based listeners and manual DOM updates.

* **Inputs:** Replace onkeyup with x-model="searchQuery" and @keyup.enter="performSearch".  
* **Lists:** Replace forEach/appendChild loops with \<template x-for="item in results"\>.  
* **Visibility:** Replace style.display \= 'none' with x-show="\!isLoading".

### **3\. Code Transformation Example**

**The Old Way (Brittle/Imperative):**

JavaScript

// JS  
document.getElementById('searchBtn').addEventListener('click', () \=\> {  
    const val \= document.getElementById('input').value;  
    const data \= db.exec(\`SELECT \* FROM terms WHERE name LIKE '${val}%'\`);  
    renderTable(data); // "Throwing problems in the air"  
});

**The New Way (Alpine/Declarative):**

HTML

\<div x-data\="lexiconApp()"\>  
    \<input x-model\="query" @keyup.enter\="search()"\>  
    \<button @click\="search()"\>Search\</button\>

    \<ul\>  
        \<template x-for\="term in results"\>  
            \<li x-text\="term.name" @click\="select(term)"\>\</li\>  
        \</template\>  
    \</ul\>  
\</div\>

\<script\>  
    function lexiconApp() {  
        return {  
            query: '',  
            results: \[\],  
            search() {  
                // The Logic is cleanly separated  
                this.results \= dbService.query(this.query);   
            }  
        }  
    }  
\</script\>

### **4\. Definition of Done**

1. **Zero** document.getElementById or addEventListener calls in the user-land code (excluding the DB initialization).  
2. The search functionality works exactly as before.  
3. The interface handles the "Loading" state gracefully (e.g., while ctx.db is downloading).  
4. The code is readable and clearly factored between **Data** (SQLite) and **View** (Alpine).

---

Next Step:  
You can paste this brief directly into your coding agent's chat window. It provides the Context, Constraints, and Happy Path required for a precise refactor.