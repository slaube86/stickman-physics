import re
from datetime import datetime

from langchain_chroma import Chroma
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_ollama import ChatOllama, OllamaEmbeddings

DB_PATH = "/Users/sebastianlaube/Documents/1_CODING/stickman-physics/chroma_db"
EMBED_MODEL = "nomic-embed-text"
CHAT_MODEL = "llama3"

# ── System prompts ────────────────────────────────────────────────────────────

QA_SYSTEM_PROMPT = """You are an expert code assistant for the "stickman-physics" project.

Project: 2D physics platformer built with vanilla JavaScript + ES modules.
Structure:
  game.js          — main game loop, state machine, input handling
  modules/physics.js  — collision, gravity, velocity
  modules/stickman.js — player character, animations, states
  modules/level.js    — level loading, tile maps, platforms, enemies
  modules/ui.js       — HUD, menus, score
  modules/audio.js    — sound effects, music

Rules:
- Always reference exact file names and, when possible, the relevant function or variable name.
- Be concise and practical — no filler text.
- When proposing code changes, show only the relevant snippet with enough surrounding context to locate it.
- Answer in the same language the user writes in (German or English).
"""

PLAN_SYSTEM_PROMPT = """You are a senior game developer writing an implementation plan for a Claude AI coding agent.

The agent reads this plan inside the Zed IDE and executes every step WITHOUT asking questions.
It has no memory, no context beyond what you write here, and will fail on ambiguity.
Your plan must eliminate ALL guesswork — the agent must be able to follow it like a script.

Project: "stickman-physics" — 2D physics platformer, vanilla JavaScript + ES modules.
File map:
  game.js             — main loop, state machine, input
  modules/physics.js  — gravity, velocity, collision resolution
  modules/stickman.js — player states, movement, animation
  modules/level.js    — level data, platforms, enemies, tiles
  modules/ui.js       — HUD, menus, score display
  modules/audio.js    — sound effects, music

═══════════════════════════════════════════════════════
OUTPUT FORMAT — copy this structure exactly, no extras:
═══════════════════════════════════════════════════════

# Plan: {CONCISE TITLE}

> **Scope:** {number} files · {number} steps · ~{estimated minutes} min

## Goal
Single sentence: what the feature does and what the player experiences.

## Affected Files
- `file.js` — exactly what changes and why (one line per file)

## Steps

### 1. {Imperative verb + object} — `filename.js`
**Find:** the exact function name, or the literal line of code to locate the insertion point.
**Change:** one-sentence description of the edit (add / replace / delete).

```js
// BEFORE (only if replacing existing code — show the exact current lines)
existingCode();

// AFTER (the exact code to write — complete, copy-paste ready, no placeholders)
newCode();
```

> ⚠️ **Watch out:** only include this callout when a real pitfall exists (e.g. execution order, a shared variable, a side effect).

### 2. …

## Verification
Numbered list of exactly what to do in the browser to confirm it works.
Each item must be a concrete action + expected result (e.g. "Press Space → stickman jumps twice before landing").

═══════════════════════════════════════════════════════
STRICT RULES — the agent will break if you violate these:
═══════════════════════════════════════════════════════
1. Every code block must be syntactically valid JavaScript — no pseudocode, no ellipsis inside code.
2. "Find:" must be a string the agent can locate with Ctrl+F in the real file.
3. Never invent a function or variable name — only use names from the provided code context.
4. If a step has no code change (e.g. pure logic description), rewrite it as one that does.
5. Steps must be ordered by dependency — later steps may assume earlier ones are done.
6. Omit any section that does not apply — do not write empty sections or placeholder text.
7. Write in the same language the user used (German or English).
"""

# ── Setup ─────────────────────────────────────────────────────────────────────

embeddings = OllamaEmbeddings(model=EMBED_MODEL)
db = Chroma(persist_directory=DB_PATH, embedding_function=embeddings)
llm = ChatOllama(model=CHAT_MODEL, temperature=0.1)

history = []

print("🎮 Stickman-Physics Code Assistant")
print(f"   LLM: {CHAT_MODEL}  |  Embeddings: {EMBED_MODEL}")
print("   Commands: 'plan <description>' · 'clear' · 'exit'\n")


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text[:48]


def retrieve_context(query: str, k: int = 6) -> tuple[str, set[str]]:
    results = db.similarity_search(query, k=k)
    parts, sources = [], set()
    for r in results:
        source = r.metadata.get("source", "unknown")
        sources.add(source)
        parts.append(f"--- {source} ---\n{r.page_content}")
    return "\n\n".join(parts), sources


def run_plan(description: str) -> None:
    print(f"\n📋 Generating plan for: {description}")
    context, sources = retrieve_context(description, k=8)
    print(f"🔍 Sources: {', '.join(sorted(sources))}\n")

    messages = [
        SystemMessage(content=PLAN_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"Relevant code from the project:\n\n{context}\n\n"
                f"Feature to plan: {description}"
            )
        ),
    ]

    response = llm.invoke(messages)
    plan_md = response.content

    filename = f"plan-{slugify(description)}.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(plan_md)
        f.write(f"\n\n---\n*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}*\n")

    print(plan_md)
    print(f"\n✅ Plan saved to: {filename}\n")


def run_qa(query: str) -> None:
    context, sources = retrieve_context(query, k=4)

    messages = [SystemMessage(content=QA_SYSTEM_PROMPT)]
    messages.extend(history)
    messages.append(
        HumanMessage(content=f"Relevant code:\n\n{context}\n\nQuestion: {query}")
    )

    print(f"\n🔍 Sources: {', '.join(sorted(sources))}")
    print("🤖 Assistant: ", end="", flush=True)

    response = llm.invoke(messages)
    answer = response.content
    print(answer)
    print()

    history.append(HumanMessage(content=query))
    history.append(AIMessage(content=answer))

    if len(history) > 20:
        history[:] = history[-20:]


# ── REPL ──────────────────────────────────────────────────────────────────────

while True:
    try:
        raw = input("💬 You: ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\nBye!")
        break

    if not raw:
        continue

    if raw.lower() == "exit":
        break

    if raw.lower() == "clear":
        history.clear()
        print("🗑️  Chat history cleared.\n")
        continue

    if raw.lower().startswith("plan "):
        description = raw[5:].strip()
        if description:
            run_plan(description)
        else:
            print("Usage: plan <description of the feature>\n")
        continue

    run_qa(raw)
