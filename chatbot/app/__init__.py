from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    from .routes.chat import bp as chat_bp
    app.register_blueprint(chat_bp)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app
