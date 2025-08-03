# Security Configuration Guide

## 🔐 API Key Security

This application uses sensitive API keys that must be properly configured to ensure security.

### ⚠️ Important Security Notes

1. **Never commit API keys to version control**
2. **Use environment variables for all sensitive configuration**
3. **Rotate API keys regularly**
4. **Monitor API usage for unauthorized access**

## 🛠️ Environment Setup

### 1. Create Environment File

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

### 2. Firebase Configuration

Get your Firebase configuration from the [Firebase Console](https://console.firebase.google.com/):

1. Go to Project Settings → General
2. Scroll down to "Your apps" section
3. Copy the configuration values

Required Firebase environment variables:
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

Optional:
- `REACT_APP_FIREBASE_MEASUREMENT_ID` (for Analytics)

### 3. Google Translate API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Cloud Translation API
3. Create an API key with Translation API access
4. Restrict the API key to your domain (recommended)

Add to your `.env` file:
```
REACT_APP_GOOGLE_TRANSLATE_API_KEY=your_api_key_here
```

## 🔍 Security Validation

The application includes automatic validation that will:

1. **Check for missing environment variables** on startup
2. **Validate API key formats** (warnings for invalid formats)
3. **Prevent placeholder values** from being used in production
4. **Rate limit translation requests** to prevent abuse

### Error Messages

If you see validation errors:

```
🚨 Missing or invalid environment variables:
  - REACT_APP_FIREBASE_API_KEY
  - REACT_APP_GOOGLE_TRANSLATE_API_KEY
```

This means you need to properly configure your `.env` file.

## 🛡️ Security Best Practices

### Production Deployment

1. **Use CI/CD environment variables** instead of `.env` files
2. **Enable Firebase Security Rules** for your database
3. **Restrict API keys** to specific domains/IPs
4. **Monitor API usage** for unusual patterns
5. **Set up billing alerts** to prevent unexpected costs

### Firebase Security Rules

Example Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Chat messages - only participants can access
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
  }
}
```

### API Key Restrictions

1. **Firebase API Key**: Restrict to your domain
2. **Google Translate API Key**: 
   - Restrict to Translation API only
   - Set quotas to prevent abuse
   - Enable usage monitoring

## 🚨 What to Do if Keys are Compromised

1. **Immediately rotate the compromised keys**
2. **Update your environment variables**
3. **Review access logs** for unauthorized usage
4. **Consider temporarily disabling the old keys**
5. **Monitor for unusual activity**

## 📊 Monitoring

Set up monitoring for:
- API usage patterns
- Failed authentication attempts
- Unusual translation requests
- Cost alerts for API usage

## 🆘 Security Issues

If you discover a security vulnerability, please:
1. **Do not** create a public issue
2. Contact the maintainers privately
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be resolved before disclosure