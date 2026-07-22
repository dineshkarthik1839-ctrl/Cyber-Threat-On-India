class ICTIPException(Exception):
    """Base exception for all ICTIP application errors."""
    def __init__(self, message: str, status_code: int = 500, error_code: str = "INTERNAL_ERROR"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)

class ThreatNotFoundError(ICTIPException):
    def __init__(self, threat_id: str):
        super().__init__(
            message=f"Threat with ID {threat_id} not found.",
            status_code=404,
            error_code="THREAT_NOT_FOUND"
        )

class APIRateLimitError(ICTIPException):
    def __init__(self, limit: int, retry_after: int):
        self.retry_after = retry_after
        super().__init__(
            message=f"API rate limit of {limit} requests exceeded. Try again in {retry_after} seconds.",
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED"
        )

class DatabaseConnectionError(ICTIPException):
    def __init__(self):
        super().__init__(
            message="Database connection failed. Please try again later.",
            status_code=503,
            error_code="DATABASE_ERROR"
        )

class InvalidIndicatorError(ICTIPException):
    def __init__(self, indicator: str, reason: str):
        super().__init__(
            message=f"Invalid IOC '{indicator}': {reason}",
            status_code=400,
            error_code="INVALID_INDICATOR"
        )
