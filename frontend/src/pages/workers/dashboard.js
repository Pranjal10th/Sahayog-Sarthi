// frontend/src/pages/workers/dashboard.js
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

let socket;

export default function WorkerDashboard() {
  // Static Simulation Context for Testing (Baad me login user state se bind hoga)
  const workerId = "65f8a12b4f9c2d1123456789"; 
  
  const [analytics, setAnalytics] = useState({
    walletBalance: 0,
    rating: 0,
    totalRatings: 0,
    isAvailable: false,
    kycStatus: 'pending'
  });
  
  const [activeBookings, setActiveBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);

  // NEW ADDITIONS: KYC File upload stream hooks states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // 1. Fetch Dashboard Analytics & Ledger from Database Node
  const fetchDashboardData = async () => {
    try {
      // Local backend service validation call mapping via token storage or direct bypass
      const res = await fetch(`http://localhost:5000/api/v1/workers/${workerId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('worker_token')}` // Ensure token is present in staging
        }
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
        setActiveBookings(data.activeBookings);
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("❌ Failed fetching Sarthi telemetry data:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Initialize Socket and Stream Sync
  useEffect(() => {
    fetchDashboardData();
    
    socket = io('http://localhost:5000');
    socket.emit('join', { userId: workerId });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 3. Availability Toggle Handler
  const toggleAvailability = async () => {
    const updatedState = !analytics.isAvailable;
    try {
      const res = await fetch(`http://localhost:5000/api/v1/workers/${workerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('worker_token')}`
        },
        body: JSON.stringify({ isAvailable: updatedState })
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(prev => ({ ...prev, isAvailable: updatedState }));
      }
    } catch (err) {
      console.error("❌ Availability sync configuration broken:", err);
    }
  };

  // 4. Geolocation Browser Engine API Telemetry Streamer (Har 5 Second me stream update)
  useEffect(() => {
    let intervalId;

    if (isTracking && activeBookings.length > 0) {
      intervalId = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              
              // Emit live coordinates streaming structure mapping payload
              socket.emit('location:update', {
                bookingId: activeBookings[0]._id,
                workerId: workerId,
                lat: latitude,
                lng: longitude
              });
              console.log(`📡 Telemetry stream dispatched: Lat ${latitude}, Lng ${longitude}`);
            },
            (error) => console.error("❌ Geolocation capturing denied:", error),
            { enableHighAccuracy: true }
          );
        }
      }, 5000); // 5-second interval loop configuration matching SRS specs
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTracking, activeBookings]);

  // NEW SUBMISSION HANDLERS: KYC File Form Multi-Part Dispatch Engine
  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 3) {
      alert("⚠️ Rule Verification: Aap maximum 3 KYC documents hi select kar sakte hain.");
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleKYCSubmission = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return alert("Upload queue is empty. Choose files first.");

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('documents', file);
    });

    try {
      const token = localStorage.getItem('worker_token');
      const res = await fetch(`http://localhost:5000/api/v1/workers/${workerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert("💼 Documents uploaded into cluster file storage safely!");
        setSelectedFiles([]);
        fetchDashboardData(); // Refresh structural metadata layout fields
      } else {
        alert(data.error || "Upload failed.");
      }
    } catch (err) {
      console.error("❌ KYC Vault pipeline interface dropped:", err);
      alert("Pipeline validation runtime error occurred.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono">
        🚀 Booting Sarthi Telemetry Core Matrix...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      
      {/* HEADER SEGMENT */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Sarthi Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time Service Node Management System</p>
        </div>

        {/* Live Availability Switcher Widget */}
        <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md p-3 rounded-xl border border-slate-800">
          <span className={`text-xs font-bold uppercase tracking-wider ${analytics.isAvailable ? 'text-emerald-400' : 'text-rose-500'}`}>
            {analytics.isAvailable ? '● Duty Online' : '○ Offline'}
          </span>
          <button 
            onClick={toggleAvailability}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${analytics.isAvailable ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'}`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform duration-300"></div>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COMPARTMENT: METRICS & LEDGER PASSBOOK */}
        <div className="md:col-span-1 flex flex-col gap-6">
          
          {/* Wallet Balance Analytics Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Available Balance</h3>
            <p className="text-4xl font-black text-emerald-400 tracking-tight">₹{analytics.walletBalance.toFixed(2)}</p>
            <button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-bold py-2.5 px-4 rounded-xl transition-all duration-200">
              Withdraw to Bank Account
            </button>
          </div>

          {/* Sarthi Dynamic Star Metric Breakdown */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Performance Insights</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/60 text-center">
                <p className="text-2xl font-bold text-amber-400">⭐ {analytics.rating.toFixed(1)}</p>
                <p className="text-xs text-slate-500 mt-1">Average Rating</p>
              </div>
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/60 text-center">
                <p className="text-2xl font-bold text-teal-400">{analytics.totalRatings}</p>
                <p className="text-xs text-slate-500 mt-1">Total Jobs Reviewed</p>
              </div>
            </div>
          </div>

          {/* INJECTED UI WIDGET: Drag & Drop KYC Upload Area */}
          {analytics.kycStatus !== 'approved' && (
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl shadow-xl relative">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-4">
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">🔒 KYC Verification</h3>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                  analytics.kycStatus === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {analytics.kycStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                Platform regulatory features lock unlock karne ke liye validation documents upload karein (Max 5MB per file | PDF, PNG, JPG only).
              </p>
              <form onSubmit={handleKYCSubmission} className="space-y-4">
                <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/60 rounded-xl p-4 text-center cursor-pointer transition-all relative">
                  <input 
                    type="file" 
                    multiple 
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileSelection}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="text-xl">📤</div>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Staged Document Upload Channel</p>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1 text-[10px] font-mono text-slate-400">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex justify-between truncate">
                        <span>📄 {f.name}</span>
                        <span className="text-slate-600">{(f.size / 1024 / 1024).toFixed(2)}MB</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={uploading || selectedFiles.length === 0}
                  className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-bold py-2 rounded-xl text-xs uppercase tracking-wider shadow-md hover:brightness-110 disabled:opacity-30 transition-all"
                >
                  {uploading ? "Uploading Vault..." : "Submit Verification Record"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COMPARTMENT: ACTIVE OPERATIONS & PASSBOOK HISTORY */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Active Bookings Gateway Layer */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
              Live Assignment Radar
            </h2>

            {activeBookings.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/20 text-slate-500 text-sm">
                No active assignments in pipeline. Keep your status online to trigger incoming streams.
              </div>
            ) : (
              activeBookings.map((booking) => (
                <div key={booking._id} className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-teal-500/10 text-teal-400 text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-teal-500/20">
                        STATUS: {booking.status.toUpperCase()}
                      </span>
                      <h4 className="text-md font-bold mt-2 text-slate-200">Customer: {booking.customerId?.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">📍 Location Matrix: {booking.customerAddress}</p>
                    </div>
                    <p className="text-right font-mono font-bold text-emerald-400 text-lg">₹{booking.amount}</p>
                  </div>

                  {/* Telemetry Tracking Activation System Trigger Panel */}
                  <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-400">
                      {isTracking 
                        ? "🛰️ Core engine emitting live coordinates straight into consumer viewport map matrix." 
                        : "Tracking stream idle. Activate telemetry transit once en-route to customer pin."
                      }
                    </p>
                    <button
                      onClick={() => setIsTracking(!isTracking)}
                      className={`w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md ${
                        isTracking 
                          ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' 
                          : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 hover:brightness-110'
                      }`}
                    >
                      {isTracking ? '⏹️ Stop Location Share' : '🚀 Start Location Share'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ledger History Passbook Container */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h3 className="text-md font-bold text-slate-200 mb-4">Passbook / Transaction Ledger</h3>
            <div className="overflow-x-auto">
              {transactions.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No recent financial settlements recorded in this node cluster.</p>
              ) : (
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="text-xs uppercase bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      <th className="px-4 py-3">Transaction ID</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{tx.razorpayPaymentId || tx._id}</td>
                        <td className="px-4 py-3 text-xs capitalize">{tx.method}</td>
                        <td className="px-4 py-3 font-bold text-slate-200">₹{(tx.amount / 100).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tx.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}