import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || 'krh0pe28ldco9bt0q2s7vb1cl',
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || 'us-east-1_bkvBFyJeF',
  JWT_SECRET_MOCK: process.env.JWT_SECRET_MOCK || 'super_secret', // Usado solo si se hace mock de JWKS local
};
