from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
import structlog

logger = structlog.get_logger()


class BrandVaultException(Exception):
    """Base exception for BrandVault application."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: dict = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class NotFoundError(BrandVaultException):
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} not found",
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "identifier": identifier},
        )


class ValidationError(BrandVaultException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


class PermissionDeniedError(BrandVaultException):
    def __init__(self, message: str = "Permission denied"):
        super().__init__(
            message=message,
            code="PERMISSION_DENIED",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class ConflictError(BrandVaultException):
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} already exists",
            code="CONFLICT",
            status_code=status.HTTP_CONFLICT,
            details={"resource": resource, "identifier": identifier},
        )


class AIProviderError(BrandVaultException):
    def __init__(self, message: str, provider: str = "unknown"):
        super().__init__(
            message=f"AI provider error: {message}",
            code="AI_PROVIDER_ERROR",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"provider": provider},
        )


class ProcessingError(BrandVaultException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            message=message,
            code="PROCESSING_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
        )


async def brandvault_exception_handler(request: Request, exc: BrandVaultException):
    logger.error(
        "brandvault_exception",
        path=request.url.path,
        code=exc.code,
        message=exc.message,
        details=exc.details,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        },
    )


async def validation_exception_handler(request: Request, exc: ValidationError):
    logger.warning(
        "validation_exception",
        path=request.url.path,
        errors=exc.errors(),
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": exc.errors(),
            },
        },
    )


async def integrity_exception_handler(request: Request, exc: IntegrityError):
    logger.error(
        "integrity_exception",
        path=request.url.path,
        error=str(exc.orig),
    )
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "success": False,
            "error": {
                "code": "CONFLICT",
                "message": "Resource already exists or violates constraints",
                "details": {"constraint": str(exc.orig)},
            },
        },
    )


async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "unhandled_exception",
        path=request.url.path,
        error=str(exc),
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "details": {},
            },
        },
    )