import { handleUserCreated } from "./handler";

describe("Notification Service", () => {
  it("should process user.created event", async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            userId: "123",
            email: "test@test.com",
            fullName: "Test User",
            createdAt: "2026-01-01"
          })
        }
      ]
    } as any;

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await handleUserCreated(event);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
