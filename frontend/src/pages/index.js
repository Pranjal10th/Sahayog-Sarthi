// frontend/src/pages/index.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

export default function Home() {
  const router = useRouter();
  
  // FIXED PARAMETER SYNCHRONIZATION: Mapping correct redirection query identifiers from payment phase
  const { payment_success, booking_id } = router.query;

  // Real-time Modal Control States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Trigger modal visibility if tracking redirection brings success parameters
  useEffect(() => {
    if (payment_success === 'true' && booking_id) {
      console.log(`🎉 Payment captured for booking: ${booking_id}. Triggering feedback view container...`);
      setShowReviewModal(true);
    }
  }, [payment_success, booking_id]);

  // Handle Review Submission Core Pipeline REST Request
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Local storage se active user JWT session hash pull karo
      const token = localStorage.getItem('token') || ''; 

      const response = await axios.post('http://localhost:5000/api/v1/reviews', 
        { bookingId: booking_id, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("⭐ Shukriya! Aapka valuable review aur rating save ho gaya hai.");
        setShowReviewModal(false);
        // URL query buffers cleanly clean karo state maintain rakhne ke liye
        router.replace('/', undefined, { shallow: true });
      }
    } catch (err) {
      console.error("❌ Review microservice handshake crash:", err);
      alert(err.response?.data?.error || "Review save karne me koi error aayi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative">
      <Head>
        <title>Sahayog Sarthi | On-Demand Service Cluster</title>
      </Head>

      {/* --- CORE HERO BANNER CONSOLE DISPLAY --- */}
      <div className="bg-blue-600 text-white p-12 text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tight">Sahayog Sarthi</h1>
        <p className="text-lg max-w-xl mx-auto opacity-90">
          Aapke paas ke verified skilled professionals, ab ek click ki doori par. Real-time booking aur transparent payments ke sath.
        </p>
        
        {/* Search Matrix Panel Area */}
        <div className="max-w-md mx-auto pt-2 flex space-x-2">
          <input 
            type="text" 
            placeholder="Kaunsa kaam karwana hai? (e.g., Electrician...)" 
            className="w-full text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none"
          />
          <button className="bg-blue-800 hover:bg-blue-900 font-bold px-6 py-3 rounded-xl text-sm tracking-wide transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* --- GRID GRID WORKPLACE CATEGORIES MATRIX CONTAINER --- */}
      <div className="max-w-5xl mx-auto p-8">
        <h2 className="text-2xl font-bold border-b border-slate-200 pb-2 mb-6 text-slate-800">Browse Service Categories</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { id: 'Electrician', label: 'Electrician', icon: '⚡' },
            { id: 'Plumber', label: 'Plumber', icon: '🚰' },
            { id: 'Carpenter', label: 'Carpenter', icon: '🪚' },
            { id: 'Painter', label: 'Painter', icon: '🎨' },
            { id: 'AC', label: 'AC Repair', icon: '❄️' },
            { id: 'Cleaner', label: 'Cleaner', icon: '🧹' },
            { id: 'Driver', label: 'Driver', icon: '🚗' },
            { id: 'Mechanic', label: 'Mechanic', icon: '🔧' }
          ].map((cat) => (
            <div 
              key={cat.id} 
              onClick={() => router.push(`/workers?category=${cat.id}`)}
              className="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-sm cursor-pointer hover:scale-105 hover:shadow-md transition-all duration-200"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <h4 className="font-bold text-slate-800 text-sm">{cat.label}</h4>
              <p className="text-[11px] text-slate-400 mt-1">Book Nearby Now</p>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 DYNAMIC REAL-TIME RATING & REVIEW MODAL OVERLAY SHIELD 🌟 */}
      {/* ========================================================================= */}
      {showReviewModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <style jsx global>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          `}</style>

          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-6 space-y-6"
            style={{ animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-500 text-2xl animate-bounce">
                ⭐
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Rate Your Sarthi Experience!</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Kaam poora ho chuka hai! Service aapko kaisi lagi? Apna experience share karein.
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex justify-center space-x-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl transition-transform active:scale-95 duration-100 ${
                      star <= rating ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Write Feedback (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ex. Bohot accha aur safai se kaam kiya masterji ne..."
                  rows="3"
                  className="w-full h-20 text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    router.replace('/', undefined, { shallow: true });
                  }}
                  className="w-1/3 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                >
                  Skip Now
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 bg-slate-900 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all uppercase tracking-wider disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}