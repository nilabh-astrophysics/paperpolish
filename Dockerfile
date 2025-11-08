FROM python:3.11-slim

RUN apt-get update && apt-get install -y     make perl curl git unzip zip pandoc lmodern texlive-latex-base texlive-latex-recommended     texlive-latex-extra texlive-fonts-recommended latexmk &&     cpan App::cpanminus && cpanm LatexIndent &&     rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
ENV TEMPLATE_ROOT=/templates
COPY ../../packages/templates /templates

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
