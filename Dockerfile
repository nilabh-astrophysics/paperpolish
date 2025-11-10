# Dockerfile — PaperPolish API (FastAPI + LaTeX tools)
FROM python:3.11-slim

# Avoid interactive tzdata prompts, keep image smaller
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# -----------------------------
# System packages for latexindent + LaTeX tools
# -----------------------------
# - texlive-*       : LaTeX toolchain
# - texlive-extra-utils: provides `latexindent`
# - ghostscript     : some workflows need it for PDF/PS
# - perl + perl libs: latexindent runtime deps
# - zip/unzip       : we zip results
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git tzdata \
    perl \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-extra-utils \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-xetex \
    ghostscript \
    zip unzip \
    libyaml-tiny-perl \
    libfile-homedir-perl \
    libfile-which-perl \
    liblog-dispatch-perl \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# -----------------------------
# Python deps
# -----------------------------
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# -----------------------------
# App source
# -----------------------------
COPY . .

EXPOSE 8000

# Flat layout (main.py at repo root) -> "main:app"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
