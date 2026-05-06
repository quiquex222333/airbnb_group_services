import { describe, it, expect } from '@jest/globals';
import { createUser } from "../../../services/user-service/src/handler";

// These tests require real AWS credentials and environment variables to be set.
// USERS_TABLE must point to a real resource.

function asHttpResult(result: any) {
    return result as {
        statusCode: number;
        body: string;
    };
}

function createAuthenticatedEvent(body: unknown, email = "integration@test.com") {
    return {
        body: JSON.stringify(body),
        requestContext: {
            authorizer: {
                claims: {
                    email
                }
            }
        }
    } as any;
}

describe("User Service Handler Integration Tests", () => {
    it("should create a user in the real DynamoDB table", async () => {
        // Skip if environment variables are not set
        if (!process.env.USERS_TABLE) {
            console.warn("Skipping integration test because USERS_TABLE is not set");
            return;
        }

        const uniqueEmail = `integration-${Date.now()}@test.com`;

        const result = asHttpResult(await createUser(
            createAuthenticatedEvent({
                fullName: "Integration Test User"
            }, uniqueEmail)
        ));

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body);
        expect(body.user).toBeDefined();
        expect(body.user.userId).toBeDefined();
        expect(body.user.email).toBe(uniqueEmail);
        expect(body.user.fullName).toBe("Integration Test User");
    });
});
