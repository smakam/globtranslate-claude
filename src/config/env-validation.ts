export interface EnvConfig {
  REACT_APP_FIREBASE_API_KEY: string;
  REACT_APP_FIREBASE_AUTH_DOMAIN: string;
  REACT_APP_FIREBASE_PROJECT_ID: string;
  REACT_APP_FIREBASE_STORAGE_BUCKET: string;
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: string;
  REACT_APP_FIREBASE_APP_ID: string;
  REACT_APP_FIREBASE_MEASUREMENT_ID?: string;
  REACT_APP_GOOGLE_TRANSLATE_API_KEY: string;
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
  'REACT_APP_GOOGLE_TRANSLATE_API_KEY'
];

const optionalEnvVars: (keyof EnvConfig)[] = [
  'REACT_APP_FIREBASE_MEASUREMENT_ID'
];

export function validateEnvironmentVariables(): EnvConfig {
  const missingVars: string[] = [];
  const config: Partial<EnvConfig> = {};

  // Check required variables
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    } else if (value.includes('your_') || value.includes('_here')) {
      console.warn(`⚠️  ${varName} appears to be using a placeholder value`);
      missingVars.push(varName);
    } else {
      config[varName] = value;
    }
  }

  // Check optional variables
  for (const varName of optionalEnvVars) {
    const value = process.env[varName];
    if (value && value.trim() !== '' && !value.includes('your_') && !value.includes('_here')) {
      config[varName] = value;
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `
🚨 Missing or invalid environment variables:
${missingVars.map(v => `  - ${v}`).join('\n')}

Please ensure you have:
1. Created a .env file in the project root
2. Copied variables from .env.example
3. Replaced placeholder values with actual API keys

For setup instructions, see the SECURITY.md file.
    `.trim();
    
    throw new Error(errorMessage);
  }

  return config as EnvConfig;
}

export function getValidatedEnv(): EnvConfig {
  try {
    return validateEnvironmentVariables();
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
}

// Additional validation functions
export function isValidFirebaseApiKey(apiKey: string): boolean {
  return /^AIza[0-9A-Za-z-_]{35}$/.test(apiKey);
}

export function isValidGoogleApiKey(apiKey: string): boolean {
  return /^AIza[0-9A-Za-z-_]{35}$/.test(apiKey);
}

export function isValidFirebaseProjectId(projectId: string): boolean {
  return /^[a-z0-9-]+$/.test(projectId) && projectId.length >= 6 && projectId.length <= 30;
}

export function validateApiKeys(): void {
  const env = getValidatedEnv();
  
  if (!isValidFirebaseApiKey(env.REACT_APP_FIREBASE_API_KEY)) {
    console.warn('⚠️  Firebase API key format may be invalid');
  }
  
  if (!isValidGoogleApiKey(env.REACT_APP_GOOGLE_TRANSLATE_API_KEY)) {
    console.warn('⚠️  Google Translate API key format may be invalid');
  }
  
  if (!isValidFirebaseProjectId(env.REACT_APP_FIREBASE_PROJECT_ID)) {
    console.warn('⚠️  Firebase project ID format may be invalid');
  }
}