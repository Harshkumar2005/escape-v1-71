
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="h-screen flex items-center justify-center flex-col bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-6">The page you are looking for doesn't exist.</p>
      <Link to="/" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
