import React from 'react';
import { Moon, Sun, MessageCircle, Sparkles } from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';
import ConnectFriend from './ConnectFriend';

interface HomeProps {
  user: {
    id: string;
    username: string;
  };
  onConnectFriend: (friendId: string, friendUsername: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSignOut: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

const Home: React.FC<HomeProps> = ({
  user,
  onConnectFriend,
  isDarkMode,
  onToggleDarkMode,
  onSignOut,
  showToast
}) => {
  return (
    <div data-testid="home-component" className="min-h-screen gradient-bg">
      {/* Header */}
      <div className="glass-effect border-b border-white border-opacity-20">
        <div className="container">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-xl">
                <MessageCircle size={24} className={isDarkMode ? "text-white" : "text-gray-800"} />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  GlobalTranslate
                </h1>
                <p className={`text-xs ${isDarkMode ? 'text-white text-opacity-80' : 'text-white text-opacity-85'}`}>
                  Connect without language barriers
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className={`text-sm ${isDarkMode ? 'text-white text-opacity-90' : 'text-white text-opacity-90'}`}>
                  Welcome back,
                </span>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{user.username}</p>
              </div>
              
              <button
                onClick={onToggleDarkMode}
                className="p-2 bg-white bg-opacity-30 hover:bg-opacity-40 rounded-lg transition-all duration-200"
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} theme`}
              >
                {isDarkMode ? (
                  <Sun size={18} className="text-white" />
                ) : (
                  <Moon size={18} className="text-gray-800" />
                )}
              </button>
              
              <button
                onClick={onSignOut}
                className={`text-sm ${isDarkMode ? 'text-white text-opacity-80 hover:text-opacity-100' : 'text-gray-800 hover:text-gray-900'} bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-all duration-200 font-medium`}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className={isDarkMode ? "text-white" : "text-gray-800"} size={32} />
            <h2 className={`text-3xl font-bold ml-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Start Your Conversation
            </h2>
          </div>
          <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-white text-opacity-90' : 'text-white text-opacity-95'}`}>
            Share your QR code or scan a friend's code to begin chatting with real-time translation
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* QR Code Section */}
          <div className="order-2 md:order-1">
            <QRCodeDisplay userId={user.id} username={user.username} isDarkMode={isDarkMode} showToast={showToast} />
          </div>
          
          {/* Connect Section */}
          <div className="order-1 md:order-2">
            <ConnectFriend onConnect={onConnectFriend} isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>

      {/* Version Footer */}
      <div className="fixed bottom-6 right-6">
        <div className="glass-effect px-4 py-2 rounded-full">
          <span className="text-xs text-white text-opacity-80 font-medium">v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default Home;