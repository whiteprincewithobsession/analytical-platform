import os

FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
    "DASHBOARD_CROSS_FILTERS": True,
}

SECRET_KEY = os.environ.get("SUPERSET_SECRET_KEY", "diplom-superset-secret-key-2025-stable")

# PostgreSQL БД
SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://superset:superset_pass@supersetdb:5432/superset_meta"

HTTP_HEADERS = {
    "X-Frame-Options": "ALLOWALL",
}

ENABLE_PROXY_FIX = True
TALISMAN_ENABLED = False
WTF_CSRF_ENABLED = False

ENABLE_CORS = True
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": ["*"],
    "origins": ["*"],
}

GUEST_ROLE_NAME = "Public"
PUBLIC_ROLE_LIKE_GAMMA = True
LOG_LEVEL = "INFO"
