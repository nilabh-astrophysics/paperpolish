import tempfile, zipfile, subprocess, os, re, shutil
from citation_fix import fix_citations
from grammar_ai import improve_prose
from zip_utils import make_zip
from store import get_zip, put_zip   # only if you import these here; keep if used

# add this helper just below the imports (before process_archive)
def safe_latexindent(tex_path: str, warnings: list):
    """Run latexindent if installed, but never hang."""
    import shutil, subprocess, os
    exe = shutil.which("latexindent") or shutil.which("latexindent.exe")
    if not exe:
        warnings.append("latexindent not found; skipped pretty-formatting.")
        return
    try:
        subprocess.run(
            [exe, "-w", os.path.basename(tex_path)],
            cwd=os.path.dirname(tex_path),
            timeout=10,              # stop if it takes too long
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except Exception as e:
        warnings.append(f"latexindent skipped: {e}")


async def process_archive(archive_file, template: str, options: list):
    warnings = []
    with tempfile.TemporaryDirectory() as td:
        # Save upload
        input_path = os.path.join(td, archive_file.filename)
        with open(input_path, "wb") as f:
            f.write(await archive_file.read())

        # Unpack or copy
        workdir = os.path.join(td, "work")
        os.makedirs(workdir, exist_ok=True)
        if input_path.endswith(".zip"):
            with zipfile.ZipFile(input_path) as zf:
                zf.extractall(workdir)
        else:
            shutil.copy(input_path, os.path.join(workdir, "main.tex"))

        main_tex = detect_main_tex(workdir)
        apply_template(workdir, template)
        safe_latexindent(main_tex, warnings)  # safe formatting/indent


        if "fix_citations" in options:
            fix_citations(workdir, main_tex, warnings)

        if "ai_grammar" in options:
            improve_prose(workdir, main_tex, warnings)

        # Package result
        out_zip = make_zip(workdir)
        return warnings, out_zip



def detect_main_tex(workdir: str) -> str:
    candidates = []
    for root, _, files in os.walk(workdir):
        for fn in files:
            if fn.endswith(".tex"):
                p = os.path.join(root, fn)
                try:
                    with open(p, "r", encoding="utf-8", errors="ignore") as f:
                        text = f.read(4096)
                    if "\\begin{document}" in text or "\begin{document}" in text:
                        candidates.append(p)
                except Exception:
                    pass
    if not candidates:
        # create a minimal main.tex
        p = os.path.join(workdir, "main.tex")
        with open(p, "w", encoding="utf-8") as f:
            f.write("\documentclass{article}\begin{document}Hello\end{document}")
        candidates.append(p)
    # Prefer main.tex if present
    candidates.sort(key=lambda p: p.endswith("main.tex"), reverse=True)
    return candidates[0]

def apply_template(workdir: str, template: str):
    tpl_root = os.getenv("TEMPLATE_ROOT", "packages/templates")
    src = os.path.join(tpl_root, template)
    if not os.path.isdir(src):
        return
    for fn in os.listdir(src):
        shutil.copy(os.path.join(src, fn), os.path.join(workdir, fn))

def run(cmd, cwd=None):
    subprocess.run(cmd, cwd=cwd, check=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

def latexindent(main_tex: str):
    try:
        run(["latexindent", "-w", main_tex], cwd=os.path.dirname(main_tex))
    except Exception:
        pass  # soft-fail formatting
