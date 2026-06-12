import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

export default function Workers() {
  const router = useRouter();
  const { category } = router.query; // URL parameter se category nikalega (e.g., Carpenter)

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);

useEffect(() => {
    // DEVELOPMENT TESTING OVERRIDE:
    // Browser ki original location skip karke Lucknow coordinates inject kar rhe hain
    // taaki Ramesh Carpenter (80.9462, 26.8467) ke 10km ke radius me hum hamesha rahein.
    const testLng = 80.9462;
    const testLat = 26.8467;
    
    console.log("📍 Sandbox Simulation: Forcing Lucknow coordinates for testing.");
    setUserLocation({ lng: testLng, lat: testLat });
    fetchNearbyWorkers(testLng, testLat);

    /* Real production flow ko abhi comment kar dete hain testing ke liye
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserLocation({ lng: longitude, lat: latitude });
        fetchNearbyWorkers(longitude, latitude);
      },
      (err) => {
        const defaultLng = 80.9500;
        const defaultLat = 26.8500;
        setUserLocation({ lng: defaultLng, lat: defaultLat });
        fetchNearbyWorkers(defaultLng, defaultLat);
      }
    );
    */
  }, [category]);

  const fetchNearbyWorkers = async (lng, lat) => {
    try {
      setLoading(true);
      // Backend API hitting path with dynamic query strings
      let url = `http://localhost:5000/api/v1/workers/nearby?lng=${lng}&lat=${lat}&radius=10`;
      if (category) {
        url += `&category=${category}`;
      }

      const response = await axios.get(url);
      if (response.data && response.data.success) {
        setWorkers(response.data.workers);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sync with backend server nodes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-6">
      <Head>
        <title>Nearby Verified Workers | Sahayog Sarthi</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        {/* Header Breadcrumbs */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.push('/')}
            className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md font-medium text-gray-700 transition"
          >
            ← Back to Home
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Available Professionals: <span className="text-blue-600">{category || 'All'}</span>
          </h1>
        </div>

        {/* State Conditional Handlers */}
        {loading && (
          <div className="text-center py-12 text-gray-500 font-medium animate-pulse">
            🔍 Scanning your area for verified professionals...
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200 text-sm">
            ❌ Error: {error}
          </div>
        )}

        {/* Dynamic Worker Cards Renderer */}
        {!loading && workers.length === 0 && (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 text-lg">Aapke 10km ke radius me koi {category || 'worker'} abhi online nahi hai.</p>
            <p className="text-sm text-gray-400 mt-2">Kripya koi doosra area ya filter choose karein.</p>
          </div>
        )}

        <div className="space-y-4">
          {!loading && workers.map((worker) => (
            <div 
              key={worker._id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow-md transition duration-200"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-800">{worker.name}</h3>
                  <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-100">
                    {worker.serviceCategory}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-2 space-y-1">
                  <p>⭐ Rating: <span className="font-semibold text-gray-700">{worker.rating || 'New'}</span> ({worker.totalRatings || 0} reviews)</p>
                  <p>💼 Experience: <span className="font-semibold text-gray-700">{worker.experience} Years</span></p>
                  <p>📍 Distance: <span className="font-semibold text-blue-600">{worker.distanceInKm} km away</span></p>
                  <p>⏱️ Estimated Arrival: <span className="font-semibold text-green-600">{worker.estimatedArrivalTimeMins} Mins</span></p>
                </div>
              </div>

              {/* Action Flow Trigger */}
              <div className="mt-4 sm:mt-0 text-right w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 flex sm:flex-col justify-between sm:justify-center items-center gap-2">
                <div className="text-left sm:text-right mb-2">
                  <p className="text-xs text-gray-400">Hourly Rate</p>
                  <p className="text-xl font-extrabold text-gray-900">₹{worker.hourlyRate}/hr</p>
                </div>
                <button 
                  onClick={() => router.push(`/workers/${worker._id}?amount=${worker.hourlyRate}&category=${worker.serviceCategory}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-sm transition duration-150 w-full sm:w-auto"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}