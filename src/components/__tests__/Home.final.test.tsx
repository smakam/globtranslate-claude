import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Static mocks - defined before imports
jest.mock('lucide-react', () => ({
  Moon: ({ className, onClick }: any) => <button className={className} onClick={onClick} aria-label="Switch to dark theme">Moon</button>,
  Sun: ({ className, onClick }: any) => <button className={className} onClick={onClick} aria-label="Switch to light theme">Sun</button>,
  MessageCircle: ({ className }: any) => <div className={className}>MessageCircle</div>,
  Sparkles: ({ className }: any) => <div className={className}>Sparkles</div>
}));

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

// Import after mocking
import Home from '../Home';

// Default props factory
const createProps = (overrides: any = {}) => ({
  user: { id: 'user-123', username: 'testuser' },
  onConnectFriend: jest.fn(),
  isDarkMode: false,
  onToggleDarkMode: jest.fn(),
  onSignOut: jest.fn(),
  showToast: jest.fn(),
  ...overrides
});

describe('Home Component - Final Robust Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('🔥 Critical Functionality - Must Always Pass', () => {
    test('renders without crashing', () => {
      expect(() => {
        render(<Home {...createProps()} />);
      }).not.toThrow();
    });

    test('home component has testid', () => {
      render(<Home {...createProps()} />);
      expect(screen.getByTestId('home-component')).toBeInTheDocument();
    });

    test('displays app title', () => {
      render(<Home {...createProps()} />);
      expect(screen.getByText('GlobalTranslate')).toBeInTheDocument();
    });

    test('displays welcome message', () => {
      render(<Home {...createProps()} />);
      expect(screen.getByText('Welcome back,')).toBeInTheDocument();
    });

    test('displays username when provided', () => {
      render(<Home {...createProps()} />);
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    test('renders child components', () => {
      render(<Home {...createProps()} />);
      expect(screen.getByTestId('qr-code-display')).toBeInTheDocument();
      expect(screen.getByTestId('connect-friend')).toBeInTheDocument();
    });
  });

  describe('🎯 User Interactions', () => {
    test('sign out button works', async () => {
      const mockSignOut = jest.fn();
      render(<Home {...createProps({ onSignOut: mockSignOut })} />);
      
      const signOutButton = screen.getByText('Sign Out');
      await userEvent.click(signOutButton);
      
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    test('theme toggle works in light mode', async () => {
      const mockToggle = jest.fn();
      render(<Home {...createProps({ onToggleDarkMode: mockToggle, isDarkMode: false })} />);
      
      const themeButton = screen.getByLabelText('Switch to dark theme');
      await userEvent.click(themeButton);
      
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    test('theme toggle works in dark mode', async () => {
      const mockToggle = jest.fn();
      render(<Home {...createProps({ onToggleDarkMode: mockToggle, isDarkMode: true })} />);
      
      const themeButton = screen.getByLabelText('Switch to light theme');
      await userEvent.click(themeButton);
      
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    test('friend connection works', async () => {
      const mockConnect = jest.fn();
      render(<Home {...createProps({ onConnectFriend: mockConnect })} />);
      
      const connectButton = screen.getByText('Connect Friend');
      await userEvent.click(connectButton);
      
      expect(mockConnect).toHaveBeenCalledWith('friend-123', 'Friend User');
    });
  });

  describe('🧪 Edge Cases', () => {
    test('handles empty username', () => {
      const props = createProps({
        user: { id: 'user-123', username: '' }
      });
      
      expect(() => {
        render(<Home {...props} />);
      }).not.toThrow();
      
      expect(screen.getByTestId('home-component')).toBeInTheDocument();
    });

    test('handles very long username', () => {
      const longUsername = 'a'.repeat(100);
      const props = createProps({
        user: { id: 'user-123', username: longUsername }
      });
      
      expect(() => {
        render(<Home {...props} />);
      }).not.toThrow();
      
      expect(screen.getByText(longUsername)).toBeInTheDocument();
    });

    test('handles null callbacks gracefully', () => {
      const props = createProps({
        onSignOut: null,
        onToggleDarkMode: null,
        onConnectFriend: null
      });
      
      expect(() => {
        render(<Home {...props} />);
      }).not.toThrow();
    });
  });

  describe('🎨 Theme States', () => {
    test('light mode renders correctly', () => {
      render(<Home {...createProps({ isDarkMode: false })} />);
      
      expect(screen.getByTestId('home-component')).toBeInTheDocument();
      expect(screen.getByText('Moon')).toBeInTheDocument(); // Light mode shows moon
    });

    test('dark mode renders correctly', () => {
      render(<Home {...createProps({ isDarkMode: true })} />);
      
      expect(screen.getByTestId('home-component')).toBeInTheDocument();
      expect(screen.getByText('Sun')).toBeInTheDocument(); // Dark mode shows sun
    });
  });

  describe('🔗 Child Component Integration', () => {
    test('QR code display receives correct props', () => {
      render(<Home {...createProps()} />);
      
      expect(screen.getByText('QR Code for testuser (user-123)')).toBeInTheDocument();
    });

    test('connect friend component is functional', () => {
      const mockConnect = jest.fn();
      render(<Home {...createProps({ onConnectFriend: mockConnect })} />);
      
      const connectButton = screen.getByText('Connect Friend');
      fireEvent.click(connectButton);
      
      expect(mockConnect).toHaveBeenCalledWith('friend-123', 'Friend User');
    });
  });

  describe('📱 Content & Layout', () => {
    test('displays hero section', () => {
      render(<Home {...createProps()} />);
      
      expect(screen.getByText('Start Your Conversation')).toBeInTheDocument();
      expect(screen.getByText(/Share your QR code or scan/)).toBeInTheDocument();
    });

    test('displays version information', () => {
      render(<Home {...createProps()} />);
      
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    test('has proper CSS classes', () => {
      render(<Home {...createProps()} />);
      
      const component = screen.getByTestId('home-component');
      expect(component).toHaveClass('min-h-screen');
    });
  });

  describe('⚡ Performance & Stability', () => {
    test('multiple renders don\'t break component', () => {
      const { rerender } = render(<Home {...createProps()} />);
      
      expect(() => {
        for (let i = 0; i < 5; i++) {
          rerender(<Home {...createProps({ isDarkMode: i % 2 === 0 })} />);
        }
      }).not.toThrow();
    });

    test('unmounting doesn\'t cause errors', () => {
      const { unmount } = render(<Home {...createProps()} />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('rapid prop changes are handled gracefully', () => {
      const { rerender } = render(<Home {...createProps()} />);
      
      expect(() => {
        rerender(<Home {...createProps({ user: { id: '1', username: 'user1' } })} />);
        rerender(<Home {...createProps({ user: { id: '2', username: 'user2' } })} />);
        rerender(<Home {...createProps({ user: { id: '3', username: 'user3' } })} />);
      }).not.toThrow();
    });
  });

  describe('🔍 Accessibility', () => {
    test('buttons have proper labels', () => {
      render(<Home {...createProps()} />);
      
      expect(screen.getByLabelText(/Switch to.*theme/)).toBeInTheDocument();
    });

    test('interactive elements are accessible', () => {
      render(<Home {...createProps()} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // All buttons should be enabled by default
      buttons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
  });
});