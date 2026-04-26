import { SQSEvent } from "aws-lambda";

export const handleUserCreated = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);

    console.log("📩 Notification Service received event:", body);

    // Aquí luego podrías enviar email, SMS, etc.
  }
};
