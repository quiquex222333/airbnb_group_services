$version: "2"

namespace airbnbclone.common.errors

use smithy.api#error
use smithy.api#httpError
use smithy.api#documentation
use smithy.api#required
use smithy.api#retryable

@documentation("Flexible detail item used in API error responses. For validation errors, prefer field + reason.")
structure ErrorDetail {
    field: String
    reason: String
    key: String
    value: String
}

list ErrorDetails {
    member: ErrorDetail
}

@documentation("Standard error payload shared by all REST API errors.")
structure ErrorPayload {
    @required
    code: String

    @required
    message: String

    details: ErrorDetails
}

@documentation("400 - Request is malformed or semantically invalid at a general level.")
@error("client")
@httpError(400)
structure BadRequestError {
    @required
    error: ErrorPayload
}

@documentation("401 - Authentication is missing, expired, or invalid.")
@error("client")
@httpError(401)
structure UnauthorizedError {
    @required
    error: ErrorPayload
}

@documentation("403 - Authenticated user does not have permission.")
@error("client")
@httpError(403)
structure ForbiddenError {
    @required
    error: ErrorPayload
}

@documentation("404 - Requested resource was not found.")
@error("client")
@httpError(404)
structure ResourceNotFoundError {
    @required
    error: ErrorPayload
}

@documentation("409 - Request conflicts with current resource state or business rules.")
@error("client")
@httpError(409)
structure ConflictError {
    @required
    error: ErrorPayload
}

@documentation("422 - One or more fields failed validation.")
@error("client")
@httpError(422)
structure ValidationError {
    @required
    error: ErrorPayload
}

@documentation("429 - Too many requests.")
@error("client")
@retryable(throttling: true)
@httpError(429)
structure ThrottledError {
    @required
    error: ErrorPayload
}

@documentation("500 - Unexpected server error. Do not expose internal details.")
@error("server")
@httpError(500)
structure InternalError {
    @required
    error: ErrorPayload
}

@documentation("503 - Service or dependency temporarily unavailable.")
@error("server")
@retryable
@httpError(503)
structure ServiceUnavailableError {
    @required
    error: ErrorPayload
}
