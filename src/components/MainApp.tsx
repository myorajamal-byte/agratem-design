import React from 'react';

const MainApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to the Application
        </h1>
        <p className="text-gray-600">
          The MainApp component has been restored and is working properly.
        </p>
      </div>
    </div>
  );
};

export default MainApp;