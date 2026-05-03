"""
Email API — Marketplace Analytics Platform
superset-pdf-report → chart screenshots → LaTeX → pdflatex → PDF → email
"""

import os
import sys
import json
import shutil
import io
import time
import logging
import smtplib
import subprocess
from datetime import datetime
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email import encoders

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

# ─── Подключаем email-api config.py чтобы superset-pdf-report
#     читал наши переменные окружения
APP_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, APP_DIR)

# ─── Import superset-pdf-report functions
from supersetpdfreport.security import get_access_token
from supersetpdfreport.chart import get_chart_screenshots
import supersetpdfreport.config as sp_config
import supersetpdfreport.send_mail as sp_send_mail

# ─── Flask App
app = Flask(__name__)
CORS(app, origins=os.getenv("CORS_ORIGINS", "*").split(","))

# ─── Register System Report Blueprint (new module)
from system_report import system_bp
app.register_blueprint(system_bp)

# ─── Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ─── Config
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.mail.ru").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "stratum-platform@mail.ru").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
SMTP_MAIL_FROM = os.getenv("SMTP_MAIL_FROM", SMTP_USER).strip()

SUPERSET_URL = os.getenv("SUPERSET_URL", "http://superset:8088").strip().rstrip("/")
SUPERSET_USER = os.getenv("SUPERSET_USER", "admin").strip()
SUPERSET_PASSWORD = os.getenv("SUPERSET_PASSWORD", "admin").strip()

APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "5555"))

REPORTS_DIR = Path(os.getenv("REPORTS_DIR", "/tmp/reports"))
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# ─── Пути
LATEX_DIR = Path(APP_DIR) / "latex"
LATEX_IMG_DIR = LATEX_DIR / "images"
LATEX_PDF_DIR = LATEX_DIR / "pdf"
JOBS_DIR = Path(APP_DIR) / "jobs"
for d in [LATEX_DIR, LATEX_IMG_DIR, LATEX_PDF_DIR, JOBS_DIR]:
    d.mkdir(parents=True, exist_ok=True)


def resolve_dashboard_id(title_query: str) -> str:
    """По названию находит dashboard_id. Default = '2'."""
    logger.info(f"Dashboard query: '{title_query}' -> using default ID 2")
    return "2"


def get_chart_ids_from_dashboard(dashboard_id: str) -> list:
    """Получает chart IDs из дашборда через Superset API."""
    import requests as req

    session = req.Session()
    # Логин
    r = session.get(f"{SUPERSET_URL}/login/", timeout=10)
    import re
    csrf = re.search(r'name="csrf_token"\s+value="([^"]+)"', r.text)
    csrf_token = csrf.group(1) if csrf else ""
    session.post(f"{SUPERSET_URL}/login/", data={
        "username": SUPERSET_USER,
        "password": SUPERSET_PASSWORD,
        "csrf_token": csrf_token,
    }, timeout=10)

    # Дашборд
    r = session.get(f"{SUPERSET_URL}/api/v1/dashboard/{dashboard_id}", timeout=15)
    if r.status_code != 200:
        return []

    data = r.json().get("result", {})
    chart_ids = []

    position_json = data.get("position_json", "{}")
    if isinstance(position_json, str):
        try:
            position_json = json.loads(position_json)
        except Exception:
            position_json = {}

    def extract(obj):
        ids = []
        if isinstance(obj, dict):
            if obj.get("type") == "CHART":
                cid = obj.get("id") or obj.get("chartId")
                if cid:
                    ids.append(str(cid))
            for v in obj.values():
                ids.extend(extract(v))
        elif isinstance(obj, list):
            for item in obj:
                ids.extend(extract(item))
        return ids

    chart_ids = extract(position_json)
    logger.info(f"Found {len(chart_ids)} charts in dashboard {dashboard_id}")
    return chart_ids


def generate_pdf(dashboard_id: str, dashboard_title: str, chart_ids: list) -> Path:
    """
    Скачивает скриншоты чартов → генерирует .tex → pdflatex → PDF.
    Возвращает путь к PDF файлу.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    tex_filename = f"report_{timestamp}.tex"
    pdf_filename = tex_filename.replace(".tex", ".pdf")

    # 1. Скачиваем скриншоты чартов через superset-pdf-report
    logger.info(f"Getting access token from Superset...")
    access_token = get_access_token()

    # Переопределяем PATH чтобы картинки сохранились в нашу директорию
    sp_config.PATH = str(APP_DIR) + "/"
    sp_config.SUPERSET_URL = SUPERSET_URL

    # Создаём поддиректорию для типа job (type="latex")
    job_type_dir = LATEX_DIR  # type = "latex" → latex/images/
    job_type_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Downloading screenshots for {len(chart_ids)} charts...")
    import asyncio
    asyncio.run(get_chart_screenshots(access_token, "latex", chart_ids))

    # Ждём чтобы все картинки точно сохранились
    time.sleep(3)

    # 2. Генерируем .tex файл
    chart_blocks = []
    for i, cid in enumerate(chart_ids):
        img_path = f"images/chart_{cid}.png"
        caption = f"График {i + 1}"
        chart_blocks.append(
            f"\\begin{{figure}}[H]\n"
            f"  \\centering\n"
            f"  \\includegraphics[width=\\textwidth]{{{img_path}}}\n"
            f"  \\caption{{{caption}}}\n"
            f"\\end{{figure}}\n"
            f"\\newpage\n"
        )

    charts_text = "\n".join(chart_blocks) if chart_blocks else "{\\centering Нет данных\\par}"

    tex_content = f"""\\documentclass[a4paper]{{article}}
\\usepackage[T2A]{{fontenc}}
\\usepackage[russian]{{babel}}
\\usepackage{{graphicx}}
\\usepackage{{float}}
\\usepackage[margin=15mm]{{geometry}}
\\pagestyle{{plain}}
\\begin{{document}}
\\begin{{center}}
    {{\\LARGE\\bfseries Marketplace Analytics}}
    \\vspace{{5mm}}
    {{\\Large Отчёт: \\textbf{{{dashboard_title}}}}}
    \\vspace{{3mm}}
    {{\\normalsize Дата: \\textbf{{{datetime.now().strftime("%d.%m.%Y %H:%M")}}}}}
\\end{{center}}
\\vspace{{5mm}}
\\hrule
\\vspace{{5mm}}
{charts_text}
\\end{{document}}
"""

    tex_path = LATEX_DIR / tex_filename
    tex_path.write_text(tex_content, encoding="utf-8")
    logger.info(f"Created LaTeX: {tex_path}")

    # 3. pdflatex
    logger.info("Running pdflatex...")
    result = subprocess.run(
        [
            "pdflatex",
            "-halt-on-error",
            "-output-directory", str(LATEX_PDF_DIR),
            str(tex_path),
        ],
        capture_output=True,
        text=True,
        timeout=120,
        cwd=str(LATEX_DIR),
    )

    # Второй проход (для корректного TOC если будет)
    subprocess.run(
        [
            "pdflatex",
            "-halt-on-error",
            "-output-directory", str(LATEX_PDF_DIR),
            str(tex_path),
        ],
        capture_output=True,
        text=True,
        timeout=120,
        cwd=str(LATEX_DIR),
    )

    pdf_path = LATEX_PDF_DIR / pdf_filename
    if not pdf_path.exists():
        log_content = result.stdout + result.stderr
        raise RuntimeError(f"pdflatex failed:\n{log_content}")

    logger.info(f"PDF created: {pdf_path} ({pdf_path.stat().st_size} bytes)")

    # Копируем в REPORTS_DIR
    output_path = REPORTS_DIR / f"report-{dashboard_title.replace(' ', '-')}_{timestamp}.pdf"
    shutil.copy(pdf_path, output_path)

    # Чистим временные файлы
    for ext in [".aux", ".log", ".out", ".fls", ".fdb_latexmk"]:
        f = LATEX_PDF_DIR / tex_filename.replace(".tex", ext)
        if f.exists():
            f.unlink()

    return output_path


def send_email_with_pdf(to_email: str, subject: str, pdf_path: Path, dashboard_title: str):
    """Отправляет PDF по email."""
    export_date = datetime.now().strftime("%d.%m.%Y %H:%M")

    html_body = f"""<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:20px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:22px;">Marketplace Analytics</h1>
</td></tr>
<tr><td style="padding:24px;">
<h2 style="margin:0 0 12px;color:#111;font-size:18px;">Ваш отчёт готов</h2>
<table style="width:100%;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
<tr><td style="padding:12px;color:#6b7280;">Дашборд</td><td style="padding:12px;color:#111;font-weight:600;">{dashboard_title}</td></tr>
<tr><td style="padding:12px;color:#6b7280;">Дата</td><td style="padding:12px;color:#111;font-weight:600;">{export_date}</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body></html>"""

    msg = MIMEMultipart("mixed")
    msg["From"] = SMTP_MAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    with open(pdf_path, "rb") as f:
        attachment = MIMEApplication(f.read(), Name=pdf_path.name)
    attachment["Content-Disposition"] = f'attachment; filename="{pdf_path.name}"'
    encoders.encode_base64(attachment)
    msg.attach(attachment)

    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
    server.starttls()
    server.login(SMTP_USER, SMTP_PASSWORD)
    server.sendmail(SMTP_MAIL_FROM, to_email, msg.as_string())
    server.quit()
    logger.info(f"Email sent to {to_email}")


# ─── Routes ─────────────────────────────────────────────────────────

@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "email-api", "superset": SUPERSET_URL})


@app.route("/export-report", methods=["POST"])
def export_report():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    to_email = data.get("email", "").strip()
    dashboard_title = data.get("dashboardTitle", "Dashboard").strip()
    dashboard_id = data.get("dashboardId", "").strip() or resolve_dashboard_id(dashboard_title)
    chart_ids = data.get("chartIds", [])

    if to_email and ("@" not in to_email or "." not in to_email.split("@")[-1]):
        return jsonify({"error": "invalid email format"}), 400

    try:
        # Если chart_ids не указаны — получаем из дашборда
        if not chart_ids:
            chart_ids = get_chart_ids_from_dashboard(dashboard_id)
            if not chart_ids:
                return jsonify({"error": "No charts found in dashboard"}), 404

        logger.info(f"Generating PDF: dashboard={dashboard_id} charts={len(chart_ids)} email={to_email or 'none'}")
        pdf_path = generate_pdf(dashboard_id, dashboard_title, chart_ids)

        # Отправляем email если указан
        if to_email:
            subject = f"Отчёт: {dashboard_title} — {datetime.now().strftime('%d.%m.%Y %H:%M')}"
            send_email_with_pdf(to_email, subject, pdf_path, dashboard_title)

        return jsonify({
            "success": True,
            "message": "Report generated" + (f", sent to {to_email}" if to_email else ""),
            "charts_count": len(chart_ids),
            "pdf_size_bytes": pdf_path.stat().st_size,
            "email_sent": bool(to_email),
        })

    except Exception as e:
        logger.error(f"Export failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/download-pdf", methods=["GET"])
def download_pdf():
    dashboard = request.args.get("dashboard", "Dashboard").strip()
    dashboard_id = request.args.get("dashboardId", "").strip() or resolve_dashboard_id(dashboard)
    chart_ids_raw = request.args.get("chartIds", "")

    try:
        if chart_ids_raw:
            chart_ids = [c.strip() for c in chart_ids_raw.split(",") if c.strip()]
        else:
            chart_ids = get_chart_ids_from_dashboard(dashboard_id)
            if not chart_ids:
                return jsonify({"error": "No charts found in dashboard"}), 404

        pdf_path = generate_pdf(dashboard_id, dashboard, chart_ids)

        return send_file(
            str(pdf_path),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=pdf_path.name,
        )

    except Exception as e:
        logger.error(f"Download failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/email-template", methods=["GET"])
def preview_template():
    dashboard = request.args.get("dashboard", "Dashboard")
    date = request.args.get("date", datetime.now().strftime("%d.%m.%Y %H:%M"))
    html = f"""<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif;">
<table role="presentation" width="100%"><tr><td align="center" style="padding:20px 0;">
<table role="presentation" width="600" style="background:#fff;border-radius:12px;">
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px;text-align:center;">
<h1 style="color:#fff;margin:0;">Marketplace Analytics</h1></td></tr>
<tr><td style="padding:24px;">
<h2>Ваш отчёт готов</h2>
<table style="width:100%;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
<tr><td style="padding:12px;color:#6b7280;">Дашборд</td><td style="padding:12px;font-weight:600;">{dashboard}</td></tr>
<tr><td style="padding:12px;color:#6b7280;">Дата</td><td style="padding:12px;font-weight:600;">{date}</td></tr>
</table></td></tr>
</table></td></tr></table></body></html>"""
    return html, 200, {"Content-Type": "text/html; charset=utf-8"}


# ─── Main
if __name__ == "__main__":
    logger.info(f"Starting Email API on {APP_HOST}:{APP_PORT}")
    logger.info(f"Engine: superset-pdf-report (charts → LaTeX → PDF)")
    app.run(host=APP_HOST, port=APP_PORT, debug=False, threaded=True)
