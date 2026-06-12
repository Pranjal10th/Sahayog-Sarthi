import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  // Service categories extracted from SRS Section 1 & 10
  const categories = [
    { id: 1, name: 'Electrician', icon: '⚡' },
    { id: 2, name: 'Plumber', icon: '🚰' },
    { id: 3, name: 'Carpenter', icon: '🪚' },
    { id: 4, name: 'Painter', icon: '🎨' },
    { id: 5, name: 'AC Technician', icon: '❄️' },
    { id: 6, name: 'Cleaner', icon: '🧹' },
    { id: 7, name: 'Driver', icon: '🚗' },
    { id: 8, name: 'Mechanic', icon: '🔧' },
  ];

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Head>
        <title>Sahayog Sarthi | On-Demand Worker Booking Platform</title>
        <meta name="description" content="Connect with verified nearby skilled workers instantly" />
      </Head>

      {/* Hero Header Section */}
      <header className="bg-blue-600 text-white py-16 px-6 text-center shadow-lg">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
          Sahayog Sarthi
        </h1>
        <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8">
          Aapke paas ke verified skilled professionals, ab ek click ki doori par. Real-time booking aur transparent payments ke sath.
        </p>
        
        {/* Search Implementation Bar */}
        <div className="max-w-md mx-auto flex items-center bg-white rounded-lg overflow-hidden p-1 shadow-md">
          <input 
            type="text" 
            placeholder="Kaunsa kaam karwana hai? (e.g., Electrician)..." 
            className="w-full px-4 py-2 text-gray-800 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="bg-blue-700 hover:bg-blue-800 px-6 py-2 rounded-md font-semibold text-white transition duration-200">
            Search
          </button>
        </div>
      </header>

      {/* Dynamic Main Grid Area */}
      <main className="max-w-6xl mx-auto py-12 px-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-2">
          Browse Service Categories
        </h2>

        {/* 4-Column Responsive Grid Layout matching Tailwind standards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {categories
            .filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((category) => (
              <div 
                key={category.id} 
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-gray-100 text-center cursor-pointer transition-all duration-200 transform hover:-translate-y-1"
                onClick={() => window.location.href = `/workers?category=${category.name}`}
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="font-semibold text-lg text-gray-700">{category.name}</h3>
                <p className="text-xs text-gray-400 mt-1">Book Nearby Now</p>
              </div>
            ))}
        </div>
      </main>

      {/* Footer Identity Frame */}
      <footer className="bg-gray-800 text-gray-400 text-center py-6 border-t border-gray-700 mt-12 text-sm">
        &copy; 2026 Sahayog Sarthi. Internal Development Sandbox Reference.
      </footer>
    </div>
  );
}