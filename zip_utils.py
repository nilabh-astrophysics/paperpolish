import os, zipfile, tempfile

def make_zip(workdir: str) -> str:
    out = tempfile.mktemp(suffix=".zip")
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(workdir):
            for fn in files:
                p = os.path.join(root, fn)
                arc = os.path.relpath(p, workdir)
                zf.write(p, arcname=arc)
    return out
