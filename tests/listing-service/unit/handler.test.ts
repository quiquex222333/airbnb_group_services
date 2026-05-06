import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { v4 as uuidv4 } from "uuid";

const mockDynamoSend: any = jest.fn();
const mockEventBridgeSend: any = jest.fn();

jest.mock("@aws-sdk/lib-dynamodb", () => {
    const originalModule = jest.requireActual("@aws-sdk/lib-dynamodb") as object;
    return {
        ...originalModule,
        DynamoDBDocumentClient: {
            from: jest.fn().mockReturnValue({
                send: mockDynamoSend,
            }),
        },
        PutCommand: jest.fn(),
    };
});

jest.mock("@aws-sdk/client-eventbridge", () => {
    return {
        EventBridgeClient: jest.fn().mockImplementation(() => ({
            send: mockEventBridgeSend,
        })),
        PutEventsCommand: jest.fn(),
    };
});

jest.mock("uuid", () => ({
    v4: jest.fn(),
}));

// Import handler AFTER mocks are defined
import { createListing } from "../../../services/listing-service/src/handler";

describe("Listing Service Handler Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
        process.env.LISTINGS_TABLE = "test-listings-table";
        process.env.EVENT_BUS_NAME = "test-event-bus";

        (uuidv4 as any).mockReturnValue("test-uuid-1234");
    });

    describe("createListing", () => {
        it("should return 401 if user is not authenticated", async () => {
            const event = {
                requestContext: {},
            } as unknown as APIGatewayProxyEventV2;

            const response = await createListing(event) as any;

            expect(response.statusCode).toBe(401);
            expect(JSON.parse(response.body)).toEqual({
                error: { code: "UNAUTHORIZED", message: "User not authenticated" },
            });
        });

        it("should return 400 if validation fails", async () => {
            const event = {
                requestContext: {
                    authorizer: {
                        claims: { sub: "user-123" },
                    },
                },
                body: JSON.stringify({
                    title: "", // Invalid
                    price: 0, // Invalid
                }),
            } as unknown as APIGatewayProxyEventV2;

            const response = await createListing(event) as any;

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toEqual({
                error: { code: "VALIDATION_ERROR", message: "Invalid input" },
            });
        });

        it("should create a listing successfully", async () => {
            const event = {
                requestContext: {
                    authorizer: {
                        claims: { sub: "user-123" },
                    },
                },
                body: JSON.stringify({
                    title: "Beautiful Beach House",
                    price: 150,
                }),
            } as unknown as APIGatewayProxyEventV2;

            mockDynamoSend.mockResolvedValueOnce({});
            mockEventBridgeSend.mockResolvedValueOnce({});

            // Mock Date to have predictable createdAt
            const mockDate = new Date("2023-01-01T00:00:00.000Z");
            const spy = jest.spyOn(global, "Date").mockImplementation(() => mockDate as any);

            const response = await createListing(event) as any;

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body.listing).toEqual({
                listingId: "test-uuid-1234",
                ownerId: "user-123",
                title: "Beautiful Beach House",
                price: 150,
                status: "draft",
                createdAt: "2023-01-01T00:00:00.000Z",
            });

            expect(mockDynamoSend).toHaveBeenCalledTimes(1);
            expect(mockEventBridgeSend).toHaveBeenCalledTimes(1);

            spy.mockRestore();
        });

        it("should return 500 if DynamoDB fails", async () => {
            const event = {
                requestContext: {
                    authorizer: {
                        claims: { sub: "user-123" },
                    },
                },
                body: JSON.stringify({
                    title: "Beautiful Beach House",
                    price: 150,
                }),
            } as unknown as APIGatewayProxyEventV2;

            mockDynamoSend.mockRejectedValueOnce(new Error("DynamoDB error"));

            const response = await createListing(event) as any;

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body)).toEqual({
                error: { code: "INTERNAL_ERROR", message: "Unexpected error" },
            });
        });
    });
});
