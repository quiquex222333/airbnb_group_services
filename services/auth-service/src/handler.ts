import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand
} from "@aws-sdk/client-cognito-identity-provider";

import {
  AdminGetUserCommand
} from "@aws-sdk/client-cognito-identity-provider";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { randomUUID } from "crypto";

import {
  RegisterUserInput,
  RegisterUserOutput,
  ConfirmUserInput,
  ConfirmUserOutput,
  LoginUserInput,
  LoginUserOutput
} from "@airbnb-clone/contracts";

const cognito = new CognitoIdentityProviderClient({});
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const eventBridge = new EventBridgeClient({});

export const register = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? "";

    if (!userPoolClientId) {
      return response(500, {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "USER_POOL_CLIENT_ID is missing"
        }
      });
    }

    const body: RegisterUserInput = event.body
      ? JSON.parse(event.body)
      : ({} as RegisterUserInput);

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.fullName ?? "").trim();

    if (!email || !isValidEmail(email)) {
      return response(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "A valid email is required"
        }
      });
    }

    if (!password || password.length < 8) {
      return response(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must have at least 8 characters"
        }
      });
    }

    if (!fullName || fullName.length < 2) {
      return response(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "fullName is required"
        }
      });
    }

    const result = await cognito.send(
      new SignUpCommand({
        ClientId: userPoolClientId,
        Username: email,
        Password: password,
        UserAttributes: [
          {
            Name: "email",
            Value: email
          },
          {
            Name: "name",
            Value: fullName
          }
        ]
      })
    );

    const output: RegisterUserOutput = {
      message: "User registered. Please confirm the account with the verification code.",
      userSub: result.UserSub
    };

    return response(201, output);
  } catch (error: any) {
    console.error("RegisterError", sanitizeError(error));

    if (error?.name === "UsernameExistsException") {
      return response(409, {
        error: {
          code: "USER_ALREADY_EXISTS",
          message: "User already exists"
        }
      });
    }

    if (error?.name === "InvalidPasswordException") {
      return response(400, {
        error: {
          code: "INVALID_PASSWORD",
          message: error.message
        }
      });
    }

    return response(500, {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error registering user"
      }
    });
  }
};

export const confirm = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? "";
    const userPoolId = process.env.USER_POOL_ID ?? "";
    const usersTable = process.env.USERS_TABLE ?? "";
    const eventBusName = process.env.EVENT_BUS_NAME ?? "";

    if (!userPoolClientId || !userPoolId || !usersTable || !eventBusName) {
      return response(500, {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "Missing required Auth Service environment variables"
        }
      });
    }

    const body: ConfirmUserInput = event.body
      ? JSON.parse(event.body)
      : ({} as ConfirmUserInput);

    const email = String(body.email ?? "").trim().toLowerCase();
    const confirmationCode = String(body.confirmationCode ?? "").trim();

    if (!email || !confirmationCode) {
      return response(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "email and confirmationCode are required"
        }
      });
    }

    await cognito.send(
      new ConfirmSignUpCommand({
        ClientId: userPoolClientId,
        Username: email,
        ConfirmationCode: confirmationCode
      })
    );

    const cognitoUser = await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email
      })
    );

    const fullName =
      cognitoUser.UserAttributes?.find((attr) => attr.Name === "name")?.Value ??
      email;

    const user = {
      email,
      userId: randomUUID(),
      cognitoSub:
        cognitoUser.UserAttributes?.find((attr) => attr.Name === "sub")?.Value ??
        cognitoUser.Username ??
        email,
      fullName,
      createdAt: new Date().toISOString()
    };

    await dynamo.send(
      new PutCommand({
        TableName: usersTable,
        Item: user,
        ConditionExpression: "attribute_not_exists(email)"
      })
    );

    await eventBridge.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "auth.service",
            DetailType: "user.created",
            EventBusName: eventBusName,
            Detail: JSON.stringify({
              userId: user.userId,
              cognitoSub: user.cognitoSub,
              email: user.email,
              fullName: user.fullName,
              createdAt: user.createdAt
            })
          }
        ]
      })
    );

    const output: ConfirmUserOutput = {
      message: "User confirmed and internal profile created successfully"
    };

    return response(200, output);
  } catch (error: any) {
    console.error("ConfirmError", sanitizeError(error));

    if (error?.name === "CodeMismatchException") {
      return response(400, {
        error: {
          code: "INVALID_CONFIRMATION_CODE",
          message: "Invalid confirmation code"
        }
      });
    }

    if (error?.name === "ExpiredCodeException") {
      return response(400, {
        error: {
          code: "EXPIRED_CONFIRMATION_CODE",
          message: "Confirmation code has expired"
        }
      });
    }

    if (error?.name === "UserNotFoundException") {
      return response(404, {
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });
    }

    if (error?.name === "ConditionalCheckFailedException") {
      return response(409, {
        error: {
          code: "USER_PROFILE_ALREADY_EXISTS",
          message: "Internal user profile already exists"
        }
      });
    }

    return response(500, {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error confirming user"
      }
    });
  }
};

export const login = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userPoolClientId = process.env.USER_POOL_CLIENT_ID ?? "";

    if (!userPoolClientId) {
      return response(500, {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "USER_POOL_CLIENT_ID is missing"
        }
      });
    }

    const body: LoginUserInput = event.body
      ? JSON.parse(event.body)
      : ({} as LoginUserInput);

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return response(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "email and password are required"
        }
      });
    }

    const result = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: userPoolClientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      })
    );

    const output: LoginUserOutput = {
      tokenType: result.AuthenticationResult?.TokenType,
      idToken: result.AuthenticationResult?.IdToken,
      accessToken: result.AuthenticationResult?.AccessToken,
      refreshToken: result.AuthenticationResult?.RefreshToken,
      expiresIn: result.AuthenticationResult?.ExpiresIn
    };

    return response(200, output);
  } catch (error: any) {
    console.error("LoginError", sanitizeError(error));

    if (error?.name === "NotAuthorizedException") {
      return response(401, {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password"
        }
      });
    }

    if (error?.name === "UserNotConfirmedException") {
      return response(403, {
        error: {
          code: "USER_NOT_CONFIRMED",
          message: "User is not confirmed"
        }
      });
    }

    if (error?.name === "UserNotFoundException") {
      return response(404, {
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });
    }

    return response(500, {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error logging in"
      }
    });
  }
};

function response(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}

function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function sanitizeError(error: any) {
  return {
    name: error?.name,
    message: error?.message
  };
}