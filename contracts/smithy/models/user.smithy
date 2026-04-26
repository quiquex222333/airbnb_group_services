$version: "2"

namespace airbnb.user

use smithy.api#http
use smithy.api#httpError
use smithy.api#required
use smithy.api#pattern
use smithy.api#length

service UserService {
    version: "2026-04-24",
    operations: [
        CreateUser
    ]
}

@http(method: "POST", uri: "/v1/users", code: 201)
operation CreateUser {
    input: CreateUserInput
    output: CreateUserOutput
    errors: [ValidationError, ConflictError]
}

structure CreateUserInput {
    @required
    @length(min: 2, max: 80)
    fullName: String

    @required
    @pattern("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")
    email: String
}

structure CreateUserOutput {
    @required
    user: User
}

structure User {
    @required
    userId: String

    @required
    fullName: String

    @required
    email: String

    @required
    createdAt: String
}

@error("client")
@httpError(400)
structure ValidationError {
    @required
    message: String
}

@error("client")
@httpError(409)
structure ConflictError {
    @required
    message: String
}