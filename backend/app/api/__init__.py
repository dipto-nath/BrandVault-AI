from fastapi import APIRouter

from app.api.v1 import (
    auth,
    workspaces,
    sources,
    facts,
    guidelines,
    content,
    reviews,
    passport,
    insights,
    audit,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(sources.router, prefix="/sources", tags=["sources"])
api_router.include_router(facts.router, prefix="/facts", tags=["facts"])
api_router.include_router(guidelines.router, prefix="/guidelines", tags=["guidelines"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(passport.router, prefix="/passport", tags=["passport"])
api_router.include_router(insights.router, prefix="/insights", tags=["insights"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])