# Dockerfile — PaperPolish API (FastAPI + LaTeX tools)
FROM python:3.11-slim

# Avoid interactive tzdata prompts & keep image small
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# -----------------------------
# System packages for LaTeX + latexindent
# -----------------------------
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
# Python dependencies
# -----------------------------
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# -----------------------------
# Copy app source
# -----------------------------
COPY . .

# -----------------------------
# Expose and run app
# -----------------------------
EXPOSE 8000

# ✅ Render-compatible startup command
# Uses Render's dynamic $PORT variable if available
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
