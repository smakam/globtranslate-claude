import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Onboarding from '../Onboarding';

// Mock the userService
jest.mock('../../services/userService', () => ({
  userService: {
    checkUsernameAvailability: jest.fn(),
    getUserByUsername: jest.fn()
  }
}));

// Mock VersionDisplay component
jest.mock('../VersionDisplay', () => {
  return function MockVersionDisplay() {
    return <div data-testid="version-display">Version Display</div>;
  };
});

const mockUserService = require('../../services/userService').userService;

const defaultProps = {
  onComplete: jest.fn(),
  userId: 'test-user-123'
};

describe('Onboarding Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console to avoid test output noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders onboarding component', () => {
    render(<Onboarding {...defaultProps} />);
    
    expect(screen.getByTestId('onboarding-component')).toBeInTheDocument();
    expect(screen.getByText('Welcome to GlobalTranslate')).toBeInTheDocument();
    expect(screen.getByText('Set up your profile to start chatting')).toBeInTheDocument();
  });

  test('displays user ID', () => {
    render(<Onboarding {...defaultProps} />);
    
    expect(screen.getByText('test-user-123')).toBeInTheDocument();
  });

  test('renders form elements', () => {
    render(<Onboarding {...defaultProps} />);
    
    expect(screen.getByLabelText(/choose a username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your language/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });

  test('validates minimum username length', async () => {
    const user = userEvent.setup();
    render(<Onboarding {...defaultProps} />);
    
    const usernameInput = screen.getByLabelText(/choose a username/i);
    const submitButton = screen.getByRole('button', { name: /get started/i });
    
    await user.type(usernameInput, 'ab'); // Less than 3 characters
    await user.click(submitButton);
    
    expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
    expect(defaultProps.onComplete).not.toHaveBeenCalled();
  });

  test('validates required username', async () => {
    const user = userEvent.setup();
    render(<Onboarding {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /get started/i });
    
    await user.click(submitButton);
    
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(defaultProps.onComplete).not.toHaveBeenCalled();
  });

  test('handles new user registration', async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn();
    mockUserService.checkUsernameAvailability.mockResolvedValue(true); // Available
    
    render(<Onboarding {...defaultProps} onComplete={mockOnComplete} />);
    
    const usernameInput = screen.getByLabelText(/choose a username/i);
    const languageSelect = screen.getByLabelText(/your language/i);
    const submitButton = screen.getByRole('button', { name: /get started/i });
    
    await user.type(usernameInput, 'newuser');
    await user.selectOptions(languageSelect, 'es');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('newuser', 'es', null);
    });
  });

  test('handles existing user login', async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn();
    const existingUser = {
      id: 'existing-123',
      username: 'existinguser',
      language: 'fr'
    };
    
    mockUserService.checkUsernameAvailability.mockResolvedValue(false); // Not available
    mockUserService.getUserByUsername.mockResolvedValue(existingUser);
    
    render(<Onboarding {...defaultProps} onComplete={mockOnComplete} />);
    
    const usernameInput = screen.getByLabelText(/choose a username/i);
    const submitButton = screen.getByRole('button', { name: /get started/i });
    
    await user.type(usernameInput, 'existinguser');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Logging in as existing user...')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('existinguser', 'en', existingUser);
    });
  });

  test('updates display ID when username changes for existing user', async () => {
    const user = userEvent.setup();
    const existingUser = {
      id: 'existing-123',
      username: 'existinguser',
      language: 'fr'
    };
    
    mockUserService.getUserByUsername.mockResolvedValue(existingUser);
    
    render(<Onboarding {...defaultProps} />);
    
    const usernameInput = screen.getByLabelText(/choose a username/i);
    
    // Initially shows default user ID
    expect(screen.getByText('test-user-123')).toBeInTheDocument();
    
    // Type username that exists
    await user.type(usernameInput, 'existinguser');
    
    await waitFor(() => {
      expect(screen.getByText('existing-123')).toBeInTheDocument();
    });
  });

  test('handles username check error gracefully', async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn();
    
    mockUserService.checkUsernameAvailability.mockRejectedValue(new Error('Network error'));
    
    render(<Onboarding {...defaultProps} onComplete={mockOnComplete} />);
    
    const usernameInput = screen.getByLabelText(/choose a username/i);
    const submitButton = screen.getByRole('button', { name: /get started/i });
    
    await user.type(usernameInput, 'testuser');
    await user.click(submitButton);
    
    // Should still complete despite error
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('testuser', 'en', null);
    });
  });

  test('shows loading state during submission', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const checkPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockUserService.checkUsernameAvailability.mockReturnValue(checkPromise);
    
    render(<Onboarding {...defaultProps} />);
    
    const usernameInput = screen.getByLabelText(/choose a username/i);
    const submitButton = screen.getByRole('button', { name: /get started/i });
    
    await user.type(usernameInput, 'testuser');
    await user.click(submitButton);
    
    expect(screen.getByText('Checking...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise
    resolvePromise!(true);
    
    await waitFor(() => {
      expect(screen.queryByText('Checking...')).not.toBeInTheDocument();
    });
  });

  test('language selection works correctly', async () => {
    const user = userEvent.setup();
    render(<Onboarding {...defaultProps} />);
    
    const languageSelect = screen.getByLabelText(/your language/i);
    
    await user.selectOptions(languageSelect, 'es');
    expect(languageSelect).toHaveValue('es');
    
    await user.selectOptions(languageSelect, 'fr');
    expect(languageSelect).toHaveValue('fr');
  });

  test('handles onComplete failure', async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn().mockRejectedValue(new Error('Complete failed'));
    
    mockUserService.checkUsernameAvailability.mockResolvedValue(true);
    
    render(<Onboarding {...defaultProps} onComplete={mockOnComplete} />);
    
    const usernameInput = screen.getByLabelText(/choose a username/i);
    const submitButton = screen.getByRole('button', { name: /get started/i });
    
    await user.type(usernameInput, 'testuser');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to complete setup. Please try again.')).toBeInTheDocument();
    });
  });

  test('trims whitespace from username', async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn();
    mockUserService.checkUsernameAvailability.mockResolvedValue(true);
    
    render(<Onboarding {...defaultProps} onComplete={mockOnComplete} />);
    
    const usernameInput = screen.getByLabelText(/choose a username/i);
    const submitButton = screen.getByRole('button', { name: /get started/i });
    
    await user.type(usernameInput, '  testuser  ');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('testuser', 'en', null);
    });
  });

  test('renders version display', () => {
    render(<Onboarding {...defaultProps} />);
    
    expect(screen.getByTestId('version-display')).toBeInTheDocument();
  });

  test('handles very long username within limits', async () => {
    const user = userEvent.setup();
    const longUsername = 'a'.repeat(20); // Maximum allowed
    mockUserService.checkUsernameAvailability.mockResolvedValue(true);
    
    render(<Onboarding {...defaultProps} />);
    
    const usernameInput = screen.getByLabelText(/choose a username/i);
    
    await user.type(usernameInput, longUsername);
    
    expect(usernameInput).toHaveValue(longUsername);
  });

  test('clears error when username changes', async () => {
    const user = userEvent.setup();
    render(<Onboarding {...defaultProps} />);
    
    const usernameInput = screen.getByLabelText(/choose a username/i);
    const submitButton = screen.getByRole('button', { name: /get started/i });
    
    // First, create an error
    await user.click(submitButton);
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    
    // Then type to clear the error
    await user.type(usernameInput, 'test');
    
    await waitFor(() => {
      expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
    });
  });
});