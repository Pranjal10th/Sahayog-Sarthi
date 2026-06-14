// frontend/src/pages/admin/index.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import withAuth from '../../components/withAuth.js';

function AdminDashboard() {
  const [metrics, setMetrics] = useState({ totalUsers: 0, activeWorkers: 0, platformRevenue: 0 });
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [liveBookings, setLiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // 1. Core Data Hub Synchronization over Live API Gateway
  const fetchAdminDataHub = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token') || '';
      const response = await axios.get('http://localhost:5000/api/v1/workers/admin/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data?.success) {
        setMetrics(response.data.metrics);
        setPendingWorkers(response.data.pendingWorkers);
        setLiveBookings(response.data.liveBookings);
      }
    } catch (err) {
      console.error("❌ Failed to fetch admin overview metrics:", err);
      setError(err.response?.data?.error || 'Failed to sync platform metrics from API gateway.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDataHub();
  }, []);

  // 2. KYC Decision Router Mechanism (Approve / Reject Pipeline handlers)
  const handleKycDecision = async (workerId, decision) => {
    try {
      setActionLoading(true);
      setMsg('');
      setError('');
      const token = localStorage.getItem('token') || '';
      
      // Dynamic target mapping parameter route: /api/v1/workers/:id/:action
      const url = `http://localhost:5000/api/v1/workers/${workerId}/${decision}`;
      
      const response = await axios.put(url, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data?.success) {
        setMsg(`🎉 Sarthi Profile Status Updated Successfully to [${decision === 'approve' ? 'Approved' : 'Rejected'}]!`);
        // Filter elements out of queue atomically
        setPendingWorkers(prev => prev.filter(w => w._id !== workerId));
        // Soft refresh global metrics count configurations
        if (decision === 'approve') {
          setMetrics(prev => ({ ...prev, activeWorkers: prev.activeWorkers + 1 }));
        }
      }
    } catch (err) {
      console.error("❌ KYC status update failed:", err);
      setError(err.response?.data?.error || 'Could not update worker KYC status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-sans">
        <p className="animate-pulse font-mono tracking-widest text-sm">📡 LOADING CENTRAL ADMIN SECURITY NODES...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-6 md:p-8">
      <Head>
        <title>Central Control Dashboard | Sahayog Sarthi Admin</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Admin Sheet Title Header */}
        <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Sahayog Dashboard</h1>
            <p className="text-slate-400 text-xs mt-1">Platform Operations Control Room & Core Infrastructure Gateways</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider uppercase animate-pulse">
              Root Terminal Access
            </span>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/auth/login';
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {msg && (
          <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 p-4 rounded-xl text-sm font-medium">
            {msg}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-xl text-sm font-medium">
            ❌ {error}
          </div>
        )}

        {/* 3-Column Top Grid Live Metric Nodes Counter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total System Consumers</p>
            <p className="text-4xl font-extrabold text-white mt-2">{metrics.totalUsers}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Verified Active Sarthi Group</p>
            <p className="text-4xl font-extrabold text-blue-400 mt-2">{metrics.activeWorkers}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Platform Revenue Wallet (15% Commission)</p>
            <p className="text-4xl font-extrabold text-emerald-400 mt-2">₹{metrics.platformRevenue}</p>
          </div>
        </div>

        {/* KYC Queue Validation Segment Gate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-800/40 px-6 py-4 border-b border-slate-800">
            <h3 className="font-bold text-base text-white">Pending Sarthi KYC Applications ({pendingWorkers.length})</h3>
            <p className="text-slate-400 text-xs mt-0.5">Verify experience certificates, background records and approve onboarding streams.</p>
          </div>

          {pendingWorkers.length === 0 ? (
            <p className="p-6 text-slate-500 text-sm text-center font-medium">✨ All worker verification sheets clear. No pending actions.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {pendingWorkers.map(worker => (
                <div key={worker._id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-800/20 transition">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-white text-lg">{worker.name}</h4>
                      <span className="bg-slate-800 text-slate-300 text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-slate-700">
                        {worker.serviceCategory}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1.5 space-x-4">
                      <span>📱 Mobile: <strong className="text-slate-300">{worker.mobile}</strong></span>
                      <span>💼 Experience: <strong className="text-slate-300">{worker.experience} Years</strong></span>
                      <span>💰 Target Rate: <strong className="text-slate-300">₹{worker.hourlyRate}/hr</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                    <button
                      onClick={() => handleKycDecision(worker._id, 'approve')}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm w-full sm:w-auto"
                    >
                      Approve Sarthi
                    </button>
                    <button
                      onClick={() => handleKycDecision(worker._id, 'reject')}
                      disabled={actionLoading}
                      className="bg-slate-800 hover:bg-red-950/40 hover:text-red-400 border border-slate-700 hover:border-red-500/20 text-slate-300 text-xs font-bold px-4 py-2 rounded-lg transition w-full sm:w-auto"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Booking Control Board Room */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-800/40 px-6 py-4 border-b border-slate-800">
            <h3 className="font-bold text-base text-white">Live Operations Tracking Console</h3>
            <p className="text-slate-400 text-xs mt-0.5">Real-time status updates monitoring ongoing socket transaction sessions.</p>
          </div>

          <div className="p-6 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-mono tracking-wider">
                  <th className="pb-3">Booking Segment ID</th>
                  <th className="pb-3">Task Category</th>
                  <th className="pb-3">Destination Address</th>
                  <th className="pb-3">Total Cost</th>
                  <th className="pb-3">Payment Engine</th>
                  <th className="pb-3">Live Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {liveBookings.map(b => (
                  <tr key={b._id} className="hover:bg-slate-800/10 transition">
                    <td className="py-4 text-xs font-mono text-blue-400 select-all">{b._id}</td>
                    <td className="py-4 text-white">{b.serviceType}</td>
                    <td className="py-4 text-slate-400 max-w-xs truncate">{b.customerAddress}</td>
                    <td className="py-4 text-white font-semibold">₹{b.amount}</td>
                    <td className="py-4">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-mono uppercase">
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider layout badge ${
                        b.status === 'pending' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                        b.status === 'accepted' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminDashboard, ['admin']);