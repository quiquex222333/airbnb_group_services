import { describe, it, expect } from '@jest/globals';
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createReview, getReviewsByListing } from "../../../services/review-service/src/handler";

// These tests require real AWS credentials and environment variables to be set.
// REVIEWS_TABLE and EVENT_BUS_NAME must point to real resources.

describe("Review Service Handler Integration Tests", () => {
    let createdReviewId: string;
    const testListingId = "integration-test-listing-123";

    it("should create a review in the real DynamoDB table", async () => {
        // Skip if environment variables are not set
        if (!process.env.REVIEWS_TABLE || !process.env.EVENT_BUS_NAME) {
            console.warn("Skipping integration test because REVIEWS_TABLE or EVENT_BUS_NAME is not set");
            return;
        }

        const event = {
            requestContext: {
                authorizer: {
                    claims: { sub: "integration-test-user" },
                },
            },
            body: JSON.stringify({
                listingId: testListingId,
                rating: 5,
                comment: "Integration test comment",
            }),
        } as unknown as APIGatewayProxyEventV2;

        const response = await createReview(event) as any;

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.review).toBeDefined();
        expect(body.review.reviewId).toBeDefined();
        expect(body.review.listingId).toBe(testListingId);
        expect(body.review.rating).toBe(5);

        createdReviewId = body.review.reviewId;
    });

    it("should retrieve the created review from DynamoDB", async () => {
        if (!process.env.REVIEWS_TABLE || !createdReviewId) {
            console.warn("Skipping integration test because REVIEWS_TABLE is not set or review was not created");
            return;
        }

        const event = {
            pathParameters: { listingId: testListingId },
        } as unknown as APIGatewayProxyEventV2;

        const response = await getReviewsByListing(event) as any;

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.reviews).toBeDefined();
        expect(Array.isArray(body.reviews)).toBe(true);
        expect(body.reviews.length).toBeGreaterThan(0);

        const review = body.reviews.find((r: any) => r.reviewId === createdReviewId);
        expect(review).toBeDefined();
        expect(review.listingId).toBe(testListingId);
        expect(review.comment).toBe("Integration test comment");
    });
});
