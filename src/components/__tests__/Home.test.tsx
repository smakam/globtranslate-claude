import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../Home';

// Mock all external dependencies with consistent patterns
jest.mock('lucide-react', () => ({
  Moon: ({ className }: any) => <span className={className}>Moon</span>,
  Sun: ({ className }: any) => <span className={className}>Sun</span>,
  MessageCircle: ({ className }: any) => <div className={className}>MessageCircle</div>,
  Sparkles: ({ className }: any) => <div className={className}>Sparkles</div>
}));

// Mock child components with proper default exports
jest.mock('../QRCodeDisplay', () => {
  return function QRCodeDisplay({ userId, username }: any) {
    return <div data-testid="qr-code-display">QR Code for {username} ({userId})</div>;
  };
});

jest.mock('../ConnectFriend', () => {
  return function ConnectFriend({ onConnect }: any) {
    return (
      <div data-testid="connect-friend">
        <button onClick={() => onConnect('friend-123', 'Friend User')}>
          Connect Friend
        </button>
      </div>
    );
  };
});

const defaultProps = {
  user: {
    id: 'user-123',
    username: 'testuser'
  },
  onConnectFriend: jest.fn(),
  isDarkMode: false,
  onToggleDarkMode: jest.fn(),
  onSignOut: jest.fn(),
  showToast: jest.fn()
};

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders home component with user information', () => {
    render(<Home {...defaultProps} />);
    
    expect(screen.getByTestId('home-component')).toBeInTheDocument();
    expect(screen.getByText('GlobalTranslate')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Welcome back,')).toBeInTheDocument();
  });

  test('renders QR code display component', () => {
    render(<Home {...defaultProps} />);
    
    expect(screen.getByTestId('qr-code-display')).toBeInTheDocument();
    expect(screen.getByText('QR Code for testuser (user-123)')).toBeInTheDocument();
  });

  test('renders connect friend component', () => {
    render(<Home {...defaultProps} />);
    
    expect(screen.getByTestId('connect-friend')).toBeInTheDocument();
  });

  test('calls onToggleDarkMode when theme toggle button is clicked', async () => {
    const mockToggleDarkMode = jest.fn();
    
    render(<Home {...defaultProps} onToggleDarkMode={mockToggleDarkMode} />);
    
    const themeToggleButton = screen.getByLabelText('Switch to dark theme');
    await userEvent.click(themeToggleButton);
    
    expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
  });

  test('calls onSignOut when sign out button is clicked', async () => {
    const mockSignOut = jest.fn();
    
    render(<Home {...defaultProps} onSignOut={mockSignOut} />);
    
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    await userEvent.click(signOutButton);
    
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  test('displays correct theme icon in light mode', () => {
    render(<Home {...defaultProps} isDarkMode={false} />);
    
    // In light mode, should show Moon icon for switching to dark
    expect(screen.getByLabelText('Switch to dark theme')).toBeInTheDocument();
    expect(screen.getByText('Moon')).toBeInTheDocument();
  });

  test('displays correct theme icon in dark mode', () => {
    render(<Home {...defaultProps} isDarkMode={true} />);
    
    // In dark mode, should show Sun icon for switching to light
    expect(screen.getByLabelText('Switch to light theme')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  test('applies correct CSS classes for light mode', () => {
    render(<Home {...defaultProps} isDarkMode={false} />);
    
    const homeComponent = screen.getByTestId('home-component');
    expect(homeComponent).toHaveClass('gradient-bg');
  });

  test('handles friend connection through ConnectFriend component', async () => {
    const mockConnectFriend = jest.fn();
    
    render(<Home {...defaultProps} onConnectFriend={mockConnectFriend} />);
    
    const connectButton = screen.getByText('Connect Friend');
    await userEvent.click(connectButton);
    
    expect(mockConnectFriend).toHaveBeenCalledWith('friend-123', 'Friend User');
  });

  test('displays hero section with correct content', () => {
    render(<Home {...defaultProps} />);
    
    expect(screen.getByText('Start Your Conversation')).toBeInTheDocument();
    expect(screen.getByText(/Share your QR code or scan a friend's code/)).toBeInTheDocument();
  });

  test('renders version information', () => {
    render(<Home {...defaultProps} />);
    
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  test('passes correct props to QRCodeDisplay', () => {
    render(<Home {...defaultProps} />);
    
    // The mocked component will display the props we pass
    expect(screen.getByText('QR Code for testuser (user-123)')).toBeInTheDocument();
  });

  test('handles empty username gracefully', () => {
    const propsWithEmptyUsername = {
      ...defaultProps,
      user: {
        id: 'user-123',
        username: ''
      }
    };
    
    render(<Home {...propsWithEmptyUsername} />);
    
    expect(screen.getByTestId('home-component')).toBeInTheDocument();
    expect(screen.getByText('Welcome back,')).toBeInTheDocument();
  });

  test('handles very long username', () => {
    const longUsername = 'a'.repeat(100);
    const propsWithLongUsername = {
      ...defaultProps,
      user: {
        id: 'user-123',
        username: longUsername
      }
    };
    
    render(<Home {...propsWithLongUsername} />);
    
    expect(screen.getByText(longUsername)).toBeInTheDocument();
  });

  test('ensures all interactive elements are accessible', () => {
    render(<Home {...defaultProps} />);
    
    // Check that buttons have proper roles and are accessible
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    
    // Theme toggle button should be accessible
    const themeToggle = screen.getByLabelText('Switch to dark theme');
    expect(themeToggle).toBeInTheDocument();
    expect(themeToggle).not.toBeDisabled();
  });

  test('handles rapid theme toggles', async () => {
    const mockToggleDarkMode = jest.fn();
    
    render(<Home {...defaultProps} onToggleDarkMode={mockToggleDarkMode} />);
    
    const themeToggleButton = screen.getByLabelText('Switch to dark theme');
    
    // Rapid clicks
    await userEvent.click(themeToggleButton);
    await userEvent.click(themeToggleButton);
    await userEvent.click(themeToggleButton);
    
    expect(mockToggleDarkMode).toHaveBeenCalledTimes(3);
  });
});