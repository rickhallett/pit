"""Health check endpoint."""

from fastapi import APIRouter

health_router = APIRouter(tags=["health"])


@health_router.get("/health")
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return {"status": "healthy", "service": "pit-api"}
