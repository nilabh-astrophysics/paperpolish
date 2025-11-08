import os, re

def fix_citations(workdir: str, main_tex: str, warnings: list):
    with open(main_tex, "r", encoding="utf-8") as f:
        text = f.read()
    # Remove double question marks and normalize \cite{key}
    text = text.replace("??", "")
    text = re.sub(r"\\cite\{([^}]+)\}\?", r"\\cite{\1}", text)
    with open(main_tex, "w", encoding="utf-8") as f:
        f.write(text)
    # Check for .bib
    has_bib = False
    for _root, _dirs, files in os.walk(workdir):
        for fn in files:
            if fn.endswith(".bib"):
                has_bib = True
                break
    if not has_bib:
        warnings.append("No .bib file found. Add a bibliography or enable DOI→Bib generator.")
