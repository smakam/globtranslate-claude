import React, { useState } from 'react';
import { QrCode, UserPlus, Users, History } from 'lucide-react';
import QRScanner from './QRScanner';
import { storageUtils } from '../utils/storage';
import { userService } from '../services/userService';
import { Friend } from '../types';

interface ConnectFriendProps {
  onConnect: (friendId: string, friendUsername: string, friendFirebaseUid?: string) => void;
  isDarkMode?: boolean;
}

const ConnectFriend: React.FC<ConnectFriendProps> = ({ onConnect, isDarkMode = true }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [recentFriends] = useState<Friend[]>(storageUtils.getRecentFriends());

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!friendUsername.trim()) {
      setError('Please enter a friend username');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      const friendData = await userService.getUserByUsername(friendUsername.trim());
      
      if (!friendData) {
        setError('User not found. Please check the username and try again.');
        setIsConnecting(false);
        return;
      }

      console.log('🔧 ConnectFriend: Found friend data:', friendData);
      console.log('🔧 ConnectFriend: Calling onConnect with:', {
        friendId: friendData.id,
        friendUsername: friendData.username,
        friendFirebaseUid: friendData.firebaseUid
      });

      onConnect(friendData.id, friendData.username, friendData.firebaseUid);
    } catch (error) {
      setError('Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleQRScanSuccess = async (userId: string, username: string) => {
    setShowScanner(false);
    
    // Get friend's Firebase UID for online status monitoring
    try {
      const friendData = await userService.getUserById(userId);
      if (friendData) {
        onConnect(userId, username, friendData.firebaseUid);
      } else {
        onConnect(userId, username);
      }
    } catch (error) {
      console.error('Error getting friend data for QR scan:', error);
      onConnect(userId, username);
    }
  };

  const handleRecentFriendClick = async (friend: Friend) => {
    // Get friend's Firebase UID for online status monitoring
    try {
      const friendData = await userService.getUserById(friend.id);
      if (friendData) {
        onConnect(friend.id, friend.username, friendData.firebaseUid);
      } else {
        onConnect(friend.id, friend.username);
      }
    } catch (error) {
      console.error('Error getting friend data for recent friend:', error);
      onConnect(friend.id, friend.username);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Connect with Friends
        </h2>
        <p className={isDarkMode ? 'text-white text-opacity-80' : 'text-white text-opacity-90'}>
          Scan a QR code or enter their username to start chatting
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => setShowScanner(true)}
          className="w-full glass-effect rounded-2xl p-6 card-hover transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <QrCode size={24} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Scan QR Code</h3>
              <p className={`text-sm ${isDarkMode ? 'text-white text-opacity-80' : 'text-white text-opacity-85'}`}>
                Use your camera to scan instantly
              </p>
            </div>
          </div>
        </button>

        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-600 rounded-lg">
              <UserPlus size={20} className="text-white" />
            </div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Enter Friend Username</h3>
          </div>
          
          <form onSubmit={handleManualConnect} className="space-y-4">
            <input
              type="text"
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              placeholder="Enter your friend's username"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-white bg-opacity-20 border-white border-opacity-30 focus:ring-white focus:ring-opacity-50 text-white placeholder-white placeholder-opacity-60' 
                  : 'bg-white bg-opacity-90 border-gray-300 focus:ring-blue-500 text-gray-800 placeholder-gray-500'
              }`}
            />
            
            {error && (
              <p className={`text-sm p-2 rounded-lg ${
                isDarkMode 
                  ? 'text-red-300 bg-red-500 bg-opacity-20' 
                  : 'text-red-700 bg-red-100'
              }`}>{error}</p>
            )}
            
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg"
            >
              {isConnecting ? 'Connecting...' : 'Connect Now'}
            </button>
          </form>
        </div>
      </div>

      {recentFriends.length > 0 && (
        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-600 rounded-lg">
              <History size={20} className="text-white" />
            </div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Recent Conversations</h3>
          </div>
          
          <div className="space-y-3">
            {recentFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => handleRecentFriendClick(friend)}
                className="w-full flex items-center space-x-4 p-4 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-xl transition-all duration-200 group"
              >
                <div className="p-2 bg-white bg-opacity-20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <Users size={16} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{friend.username}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-white text-opacity-70' : 'text-white text-opacity-75'}`}>
                    Last connected: {new Date(friend.lastConnected).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showScanner && (
        <QRScanner
          onScanSuccess={handleQRScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default ConnectFriend;