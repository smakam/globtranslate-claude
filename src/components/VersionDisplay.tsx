import React from 'react';
import versionData from '../version.json';

const VersionDisplay: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 text-xs text-gray-400 dark:text-gray-600 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-gray-700 z-50">
      v{versionData.version}
    </div>
  );
};

export default VersionDisplay;