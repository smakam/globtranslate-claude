import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { userService } from '../services/userService';
import VersionDisplay from './VersionDisplay';

interface OnboardingProps {
  onComplete: (username: string, language: string, existingUser?: any) => void;
  userId: string;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, userId }) => {
  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState('en');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [displayUserId, setDisplayUserId] = useState(userId);

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    
    // Clear any existing error when username changes
    if (error) {
      setError('');
    }
    
    // Reset existing user state when username changes
    if (isExistingUser) {
      setIsExistingUser(false);
    }
    
    // Check if this username exists and update display ID
    if (newUsername.trim().length >= 3) {
      try {
        const existingUser = await userService.getUserByUsername(newUsername.trim());
        if (existingUser) {
          setDisplayUserId(existingUser.id);
        } else {
          setDisplayUserId(userId); // Reset to new user ID
        }
      } catch (error) {
        console.error('Error checking username:', error);
        setDisplayUserId(userId);
      }
    } else {
      setDisplayUserId(userId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Onboarding form submitted:', { username: username.trim(), language });
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      console.log('Checking username availability...');
      const isAvailable = await userService.checkUsernameAvailability(username.trim());
      console.log('Username availability result:', isAvailable);
      
      if (!isAvailable) {
        console.log('Username taken, logging in as existing user');
        setIsExistingUser(true);
        setError('');
        
        // Get the existing user data
        const existingUser = await userService.getUserByUsername(username.trim());
        console.log('Found existing user:', existingUser);
        
        // Auto-proceed with existing user login immediately
        console.log('Calling onComplete for existing user...');
        await onComplete(username.trim(), language, existingUser);
        console.log('onComplete finished for existing user');
        setIsChecking(false);
      } else {
        setIsExistingUser(false);
        console.log('Calling onComplete for new user...');
        await onComplete(username.trim(), language, null);
        console.log('onComplete finished for new user');
        setIsChecking(false);
      }
    } catch (error) {
      console.error('Username check or onComplete failed:', error);
      // Skip the username check if there's an error and proceed
      console.log('Skipping username check due to error, proceeding with onComplete...');
      try {
        await onComplete(username.trim(), language, null);
        console.log('onComplete finished after skipping username check');
      } catch (onCompleteError) {
        console.error('onComplete also failed:', onCompleteError);
        setError('Failed to complete setup. Please try again.');
        setIsChecking(false);
      }
    }
  };

  return (
    <>
      <div data-testid="onboarding-component" className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to GlobalTranslate
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Set up your profile to start chatting
            </p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Unique ID
            </label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {displayUserId}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Choose a Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your username"
              minLength={3}
              maxLength={20}
              required
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {isExistingUser && (
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Logging in as existing user...
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isChecking}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            {isChecking ? 'Checking...' : 'Get Started'}
          </button>
        </form>
        </div>
      </div>
      <VersionDisplay />
    </>
  );
};

export default Onboarding;