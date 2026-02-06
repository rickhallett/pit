"""Flask application factory."""

from flask import Flask
from flask_cors import CORS

from pit_api.config import config
from pit_api.routes import auth_bp, bout_bp, health_bp, presets_bp, waitlist_bp


def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # CORS for frontend
    CORS(app, origins=["http://localhost:3000", "https://thepit.cloud"])

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(bout_bp)
    app.register_blueprint(waitlist_bp)
    app.register_blueprint(presets_bp)

    return app


def main():
    """Run the development server."""
    app = create_app()
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)


if __name__ == "__main__":
    main()
