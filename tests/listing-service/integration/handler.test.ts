import { describe, it, expect } from '@jest/globals';
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createListing } from "../../../services/listing-service/src/handler";

// These tests require real AWS credentials and environment variables to be set.
// LISTINGS_TABLE and EVENT_BUS_NAME must point to real resources.

describe("Listing Service Handler Integration Tests", () => {
    it("should create a listing in the real DynamoDB table", async () => {
        // Skip if environment variables are not set
        if (!process.env.LISTINGS_TABLE || !process.env.EVENT_BUS_NAME) {
            console.warn("Skipping integration test because LISTINGS_TABLE or EVENT_BUS_NAME is not set");
            return;
        }

        const event = {
            requestContext: {
                authorizer: {
                    claims: { sub: "integration-test-user" },
                },
            },
            body: JSON.stringify({
                title: "Integration Test Listing",
                price: 200,
            }),
        } as unknown as APIGatewayProxyEventV2;

        const response = await createListing(event) as any;

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.listing).toBeDefined();
        expect(body.listing.listingId).toBeDefined();
        expect(body.listing.title).toBe("Integration Test Listing");
        expect(body.listing.price).toBe(200);
        expect(body.listing.status).toBe("draft");
    });
});
