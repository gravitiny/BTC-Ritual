import dotenv from 'dotenv';

dotenv.config();

const required = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env var ${key}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 8787),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173,http://localhost:3000',
  jwtSecret: required('JWT_SECRET'),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  twitter: {
    apiKey: process.env.X_API_KEY ?? '',
    apiSecret: process.env.X_API_SECRET ?? '',
    accessToken: process.env.X_ACCESS_TOKEN ?? '',
    accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET ?? '',
  },
};

export const hasTwitterConfig = () => {
  const { apiKey, apiSecret, accessToken, accessTokenSecret } = env.twitter;
  return Boolean(apiKey && apiSecret && accessToken && accessTokenSecret);
};

export const getAllowedOrigins = () => {
  return env.frontendOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};
