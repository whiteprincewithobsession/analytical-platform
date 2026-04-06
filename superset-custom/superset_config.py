import os

SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg2://superset:superset_pass@supersetdb:5432/superset_meta'
SECRET_KEY = '7e4aQyC9xMcD4hJZGRvVpBlQdPgWKrE3'

APP_NAME = 'Analytics Platform'
APP_ICON = '/static/assets/local/images/logo.png'
APP_ICON_WIDTH = 126

CUSTOM_CSS = '/static/custom/css/custom.css'

LANGUAGES = {
    'en': {'flag': 'us', 'name': 'English'},
    'ru': {'flag': 'ru', 'name': 'Русский'},
}
BABEL_DEFAULT_LOCALE = 'ru'

FEATURE_FLAGS = {
    'ENABLE_TEMPLATE_PROCESSING': True,
    'DASHBOARD_NATIVE_FILTERS': True,
    'DASHBOARD_CROSS_FILTERS': True,
}

WTF_CSRF_ENABLED = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_SAMESITE = 'Lax'