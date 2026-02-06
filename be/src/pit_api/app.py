"""FastAPI application factory."""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pit_api.config import config
from pit_api.routes import bout_router, health_router, presets_router, waitlist_router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="The Pit API",
        description="AI debate arena backend",
        version="1.0.0",
    )

    # CORS for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "https://thepit.cloud"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(health_router)
    app.include_router(bout_router)
    app.include_router(waitlist_router)
    app.include_router(presets_router)

    return app


app = create_app()


def main():
    """Run the development server."""
    uvicorn.run(
        "pit_api.app:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
    )


if __name__ == "__main__":
    main()
