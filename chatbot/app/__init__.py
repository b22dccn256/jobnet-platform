from pathlib import Path
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

_SERVICE_DIR = Path(__file__).resolve().parents[1]
_ROOT_DIR = _SERVICE_DIR.parent

load_dotenv(_ROOT_DIR / ".env")
load_dotenv(_SERVICE_DIR / ".env", override=True)


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    from .routes.chat import bp as chat_bp
    app.register_blueprint(chat_bp)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app
