# airbnb_group_back

---

# Estándar de manejo de errores (Smithy)

Este directorio define el estándar base de manejo de errores para la API REST del proyecto.

## Objetivo

Garantizar que todos los servicios respondan con el mismo formato de error, con códigos estables para frontend, mensajes claros y detalles útiles para validaciones por campo.

## Reglas

- `code` debe ser estable y útil para frontend.
- `message` debe ser claro y entendible.
- `details` se usa principalmente para validaciones por campo.
- No se deben exponer `stack traces`, mensajes SQL, secretos, tokens ni detalles internos sensibles.
- Todos los microservicios deben reutilizar estas definiciones base.

## Formato único aprobado

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [
      {
        "field": "email",
        "reason": "must be a valid email address"
      }
    ]
  }
}
```

## HTTP status base definidos

| HTTP status | Error shape | Uso |
|---|---|---|
| 400 | `BadRequestError` | Request mal formado o inconsistente a nivel general |
| 401 | `UnauthorizedError` | Falta autenticación o token inválido |
| 403 | `ForbiddenError` | Usuario autenticado sin permisos |
| 404 | `ResourceNotFoundError` | Recurso no encontrado |
| 409 | `ConflictError` | Conflicto con el estado actual o regla de negocio |
| 422 | `ValidationError` | Errores de validación por campo |
| 429 | `ThrottledError` | Demasiadas solicitudes |
| 500 | `InternalError` | Error inesperado del servidor |
| 503 | `ServiceUnavailableError` | Servicio o dependencia temporalmente no disponible |

## Estructura del modelo

Archivo principal:

- `model/common/errors.smithy`

Namespace definido:

- `airbnbclone.common.errors`

## Cómo reutilizarlo en una operación

Ejemplo para `POST /v1/auth/login`:

```smithy
$version: "2"
namespace airbnbclone.auth

use smithy.api#http
use airbnbclone.common.errors#BadRequestError
use airbnbclone.common.errors#UnauthorizedError
use airbnbclone.common.errors#ValidationError
use airbnbclone.common.errors#InternalError

@http(method: "POST", uri: "/v1/auth/login", code: 200)
operation Login {
    input: LoginInput
    output: LoginOutput
    errors: [
        BadRequestError,
        ValidationError,
        UnauthorizedError,
        InternalError
    ]
}

structure LoginInput {
    email: String
    password: String
}

structure LoginOutput {
    accessToken: String
}
```

## Ejemplos de respuesta

### 422 ValidationError

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [
      {
        "field": "password",
        "reason": "must have at least 8 characters"
      }
    ]
  }
}
```

### 404 ResourceNotFoundError

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested listing was not found.",
    "details": [
      {
        "key": "listingId",
        "value": "lst_123"
      }
    ]
  }
}
```

### 500 InternalError

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred.",
    "details": []
  }
}
```

## Convenciones de uso

- Usar `VALIDATION_ERROR` para validaciones de campos.
- Usar `RESOURCE_NOT_FOUND` para consultas a recursos inexistentes.
- Usar `CONFLICT` cuando el estado actual impide completar la operación.
- Usar `INTERNAL_ERROR` como respuesta genérica para fallos inesperados.
- Mantener los valores de `code` en `SCREAMING_SNAKE_CASE`.
- Mantener los mensajes de error en inglés si el contrato de API del proyecto está en inglés.

## Notas para implementación

- El runtime del servicio puede mapear excepciones internas a una de estas estructuras.
- `details` puede omitirse o enviarse vacío cuando no aporte valor.
- Para validaciones, se recomienda incluir siempre `field` y `reason`.
- Para trazabilidad, conviene acompañar las respuestas con headers como `X-Request-Id` y `X-Correlation-Id` definidos a nivel global del proyecto.

## Recomendación de ubicación en repo

```text
repo-root/
  model/
    common/
      errors.smithy
  README.md
```

## Checklist de aprobación

- [x] Formato único aprobado
- [x] HTTP status base definidos
- [x] `code`, `message` y `details` documentados
- [x] Ejemplo de reutilización en operaciones Smithy
