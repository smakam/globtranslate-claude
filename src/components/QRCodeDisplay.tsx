import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download } from 'lucide-react';

interface QRCodeDisplayProps {
  userId: string;
  username: string;
  isDarkMode?: boolean;
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ userId, username, isDarkMode = true, showToast }) => {
  const qrValue = JSON.stringify({ userId, username });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(username);
      showToast(`Username "${username}" copied to clipboard!`, 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showToast('Failed to copy username to clipboard', 'error');
    }
  };

  const downloadQR = () => {
    const svg = document.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 200;
      canvas.height = 200;
      
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        const url = canvas.toDataURL();
        const link = document.createElement('a');
        link.download = `globtranslate-${username}-qr.png`;
        link.href = url;
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="glass-effect rounded-2xl p-8 card-hover transition-all duration-200">
      <div className="text-center mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Your QR Code
        </h2>
        <p className={isDarkMode ? 'text-white text-opacity-80' : 'text-white text-opacity-90'}>
          Let friends scan this to connect instantly
        </p>
      </div>
      
      <div className="flex flex-col items-center space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <QRCodeSVG
            value={qrValue}
            size={200}
            level="M"
            includeMargin={true}
          />
        </div>
        
        <div className="text-center space-y-3">
          <p className={`font-medium ${isDarkMode ? 'text-white text-opacity-90' : 'text-white text-opacity-95'}`}>
            Or share your username
          </p>
          <div className={`px-4 py-3 rounded-xl backdrop-blur-sm ${
            isDarkMode 
              ? 'bg-white bg-opacity-20' 
              : 'bg-white bg-opacity-90 border border-gray-200'
          }`}>
            <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              @{username}
            </span>
          </div>
          <p className={`text-xs ${isDarkMode ? 'text-white text-opacity-70' : 'text-white text-opacity-75'}`}>
            Your unique ID: {userId}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={copyToClipboard}
            className={`flex items-center space-x-2 px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-all duration-200 backdrop-blur-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
          >
            <Copy size={18} />
            <span>Copy Username</span>
          </button>
          
          <button
            onClick={downloadQR}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg"
          >
            <Download size={18} />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;