import os, re
from openai import OpenAI

def improve_prose(workdir: str, main_tex: str, warnings: list):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        warnings.append("OPENAI_API_KEY missing; skipped AI grammar.")
        return
    with open(main_tex, "r", encoding="utf-8") as f:
        content = f.read()
    pattern = r"\\begin\{abstract\}(.+?)\\end\{abstract\}"
    m = re.search(pattern, content, flags=re.S)
    if not m:
        warnings.append("No abstract environment found; skipped AI grammar.")
        return
    abstract = m.group(1)

    client = OpenAI(api_key=api_key)
    prompt = (
        "Improve academic clarity, grammar, and concision. "
        "Do NOT alter LaTeX commands or math. Return only the improved text."
    )
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"system","content":prompt},{"role":"user","content":abstract}],
        temperature=0.2,
    )
    improved = resp.choices[0].message.content.strip()

    content = re.sub(pattern, f"\\begin{{abstract}}\n{improved}\n\\end{{abstract}}", content, flags=re.S)
    with open(main_tex, "w", encoding="utf-8") as f:
        f.write(content)
