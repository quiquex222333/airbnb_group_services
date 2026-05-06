import { SQSEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

type EventBridgeMessage = {
  version?: string;
  id?: string;
  "detail-type"?: string;
  source?: string;
  account?: string;
  time?: string;
  region?: string;
  resources?: string[];
  detail?: Record<string, unknown>;
};

export const handleUserCreated = async (event: SQSEvent) => {
  const notificationsTable = process.env.NOTIFICATIONS_TABLE;

  if (!notificationsTable) {
    throw new Error("NOTIFICATIONS_TABLE environment variable is missing");
  }

  for (const record of event.Records) {
    const eventBridgeMessage = JSON.parse(record.body) as EventBridgeMessage;

    const eventType = eventBridgeMessage["detail-type"] ?? "unknown.event";
    const source = eventBridgeMessage.source ?? "unknown.source";
    const detail = eventBridgeMessage.detail ?? {};

    const notification = buildNotification({
      eventType,
      source,
      detail
    });

    await dynamo.send(
      new PutCommand({
        TableName: notificationsTable,
        Item: notification
      })
    );

    console.log("Notification saved", JSON.stringify(notification));
  }
};

function buildNotification(params: {
  eventType: string;
  source: string;
  detail: Record<string, unknown>;
}) {
  const { eventType, source, detail } = params;

  const createdAt = new Date().toISOString();

  return {
    notificationId: uuidv4(),
    eventType,
    source,
    recipientId: getRecipientId(eventType, detail),
    message: getMessage(eventType, detail),
    status: "created",
    payload: detail,
    createdAt
  };
}

function getRecipientId(eventType: string, detail: Record<string, unknown>): string {
  if (eventType === "user.created") {
    return String(detail.userId ?? detail.email ?? "unknown");
  }

  if (eventType === "booking.created") {
    return String(detail.guestId ?? "unknown");
  }

  if (eventType === "listing.created") {
    return String(detail.ownerId ?? "unknown");
  }

  if (eventType === "review.created") {
    return String(detail.userId ?? "unknown");
  }

  return "unknown";
}

function getMessage(eventType: string, detail: Record<string, unknown>): string {
  if (eventType === "user.created") {
    return `Usuario creado correctamente: ${String(detail.fullName ?? "")}`;
  }

  if (eventType === "booking.created") {
    return `Reserva creada correctamente para el listing ${String(detail.listingId ?? "")}`;
  }

  if (eventType === "listing.created") {
    return `Listing creado correctamente: ${String(detail.title ?? "")}`;
  }

  if (eventType === "review.created") {
    return `Review creada correctamente para el listing ${String(detail.listingId ?? "")}`;
  }

  return "Nueva notificación generada por evento del sistema";
}