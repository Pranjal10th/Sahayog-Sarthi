import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import withAuth from '../../components/withAuth.js';

function WorkerDetail() {
  const router = useRouter();
  // URL dynamic segments aur query parameters extract karo
  const { id, amount, category } = router.query; 

  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!address) {
      setError('Service location address dalna mandatory hai!');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      // Retrieve token from authenticated local storage session
      const authToken = localStorage.getItem('token');

      const payload = {
        workerId: id,
        serviceType: category || 'General Service',
        amount: Number(amount) || 200,
        customerAddress: address,
        notes: notes
      };

      const config = {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      };

      // Backend Engine Endpoint Hit
      const response = await axios.post('http://localhost:5000/api/v1/bookings', payload, config);

      if (response.data && response.data.success) {
        setMessage('🎉 Booking Request Created Successfully over Socket Cluster!');
        
        // 2 second baad user ko dynamic booking room route par bhej dega
        setTimeout(() => {
          router.push(`/bookings/${response.data.booking._id}`);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Booking generation pipeline failed. Token verify nahi ho pa raha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans py-12 px-6">
      <Head>
        <title>Confirm Booking | Sahayog Sarthi</title>
      </Head>

      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">Booking Confirmation</h2>
          <p className="text-blue-100 text-sm mt-1">Provide service requirements below</p>
        </div>

        <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
          {/* Status Alert Handling */}
          {message && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium border border-green-200">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
              ❌ {error}
            </div>
          )}

          {/* Pricing Metadata Card */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Service Category</p>
              <p className="font-bold text-gray-700">{category || 'Skilled Professional'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Estimated Cost</p>
              <p className="font-extrabold text-blue-600 text-lg">₹{amount || '250'}/hr</p>
            </div>
          </div>

          {/* Address Input Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Your Complete Address *
            </label>
            <textarea
              rows="3"
              placeholder="E.g., Flat 402, Royal Apartments, Hazratganj, Lucknow..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition duration-150"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Optional Notes Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Any specific instructions? (Optional)
            </label>
            <input
              type="text"
              placeholder="E.g., Pipe leaking bad, bring extra tape..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-blue-500 transition duration-150"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Fixed Template Literal Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold text-white py-3 rounded-xl shadow-sm transition duration-150 ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing Pipeline...' : 'Confirm & Request Sarthi'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default withAuth(WorkerDetail, ['customer']);