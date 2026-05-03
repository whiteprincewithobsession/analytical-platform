"""
Конфигурация для superset-pdf-report.
Все параметры из переменных окружения.
"""
import os
import logging

PATH = os.path.dirname(os.path.abspath(__file__)) + "/"

# Superset
WEBSERVER_PROTOCOL = os.getenv("SUPERSET_PROTOCOL", "http")
WEBSERVER_ADDRESS = os.getenv("SUPERSET_HOST", "superset")
WEBSERVER_PORT = os.getenv("SUPERSET_PORT", "8088")
SUPERSET_API_USER = os.getenv("SUPERSET_USER", "admin")
SUPERSET_API_PASSWORD = os.getenv("SUPERSET_PASSWORD", "admin")

# SMTP
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.mail.ru")
SMTP_PORT = os.getenv("SMTP_PORT", "587")
SMTP_USER = os.getenv("SMTP_USER", "stratum-platform@mail.ru")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_MAIL_FROM = os.getenv("SMTP_MAIL_FROM", SMTP_USER)
SMTP_STARTTLS = os.getenv("SMTP_STARTTLS", "true").lower() == "true"
SMTP_SSL = os.getenv("SMTP_SSL", "false").lower() == "true"

# Nextcloud — не используется, но конфиг требует
NEXTCLOUD_URL = os.getenv("NEXTCLOUD_URL", "")
NEXTCLOUD_USER = os.getenv("NEXTCLOUD_USER", "")
NEXTCLOUD_PASSWORD = os.getenv("NEXTCLOUD_PASSWORD", "")

# Logging
LOG_FOLDER = os.path.join(PATH, "logs")
LOG_LEVEL = logging.INFO
PDF_REPORT_JOB_FOLDER = None  # job файлы генерируются динамически
