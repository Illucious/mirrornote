import Constants from 'expo-constants';

// Get backend URL from environment variable or app config
export const getBackendUrl = (): string => {
  // First try environment variable (for development)
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl) {
    return envUrl;
  }

  // Fall back to app.json extra config (for production)
  const configUrl = Constants.expoConfig?.extra?.backendUrl;
  if (configUrl) {
    return configUrl;
  }

  // If neither is set, throw an error to make it obvious
  throw new Error(
    'BACKEND_URL is not configured. Please set EXPO_PUBLIC_BACKEND_URL in .env or backendUrl in app.json extra field.'
  );
};

export const BACKEND_URL = getBackendUrl();

