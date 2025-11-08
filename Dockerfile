# Dockerfile — simple, works on Render free plan
FROM python:3.11-slim

# System deps (optional but useful for zip/unzip, latexindent if ever installed, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    unzip zip git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY . .

ENV PYTHONUNBUFFERED=1

# Use Render's provided $PORT; default to 10000 locally
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
