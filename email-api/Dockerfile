FROM python:3.12-slim

# TeX Live для pdflatex + кириллица
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-lang-cyrillic \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/latex/images /app/latex/pdf /app/jobs /app/logs /tmp/reports

EXPOSE 5555
ENV APP_HOST=0.0.0.0
ENV APP_PORT=5555

CMD ["python", "app.py"]
