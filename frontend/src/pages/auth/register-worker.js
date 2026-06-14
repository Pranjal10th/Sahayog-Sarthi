import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

export default function RegisterWorker() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Electrician');
  const [experience, setExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  
  // Coordinates are optional
  const [longitude, setLongitude] = useState('80.9462'); // default center: Lucknow [lng]
  const [latitude, setLatitude] = useState('26.8467');  // default center: Lucknow [lat]
  const [locating, setLocating] = useState(false);
  const [locSuccess, setLocSuccess] = useState('');

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setLocSuccess('');
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLongitude(position.coords.longitude.toFixed(6));
        setLatitude(position.coords.latitude.toFixed(6));
        setLocSuccess('📍 Coordinates fetched successfully!');
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation blocked or failed. Fallback to default coordinates.', err);
        setError('Location access declined. Using default center coordinates.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        mobile,
        serviceCategory,
        experience: Number(experience),
        hourlyRate: Number(hourlyRate),
        longitude: Number(longitude),
        latitude: Number(latitude)
      };

      const response = await axios.post('http://localhost:5000/api/v1/auth/register/worker', payload);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('user', JSON.stringify(response.data.worker));

        alert(`🎉 Worker Registered Successfully! KYC status is pending verification.`);
        router.push(`/workers/dashboard`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      setStep(1); // Return to first step to check inputs
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial from-slate-900 to-slate-950 flex items-center justify-center p-4 font-sans text-white">
      <Head>
        <title>Sarthi Registration | Sahayog Sarthi</title>
      </Head>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Register as Sarthi</h2>
          <p className="text-xs text-slate-400">
            Join the elite service community. Register, verify KYC, and start earning today.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Wizard Steps Indicator */}
        <div className="flex items-center justify-center space-x-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          <span className={step === 1 ? 'text-blue-500' : ''}>1. Profile</span>
          <span>•</span>
          <span className={step === 2 ? 'text-blue-500' : ''}>2. Rate & Location</span>
          <span>•</span>
          <span className={step === 3 ? 'text-blue-500' : ''}>3. Confirm</span>
        </div>

        {/* --- STEP 1: PROFILE DETAILS --- */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Ramesh Singh"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">10-Digit Mobile Number</label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
                placeholder="Ex. 9876543210"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-400 font-semibold"
                >
                  <option value="Electrician">⚡ Electrician</option>
                  <option value="Plumber">🚰 Plumber</option>
                  <option value="Carpenter">🪚 Carpenter</option>
                  <option value="Painter">🎨 Painter</option>
                  <option value="Cleaner">🧹 Cleaner</option>
                  <option value="Driver">🚗 Driver</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience (Years)</label>
                <input
                  type="number"
                  required
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Ex. 5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-100"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!name || mobile.length !== 10 || !experience) {
                  setError('Please fill out all step 1 details accurately.');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-4 rounded-2xl shadow-lg transition-all uppercase tracking-wider"
            >
              Continue to Location
            </button>
          </div>
        )}

        {/* --- STEP 2: PRICING & LOCATION --- */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hourly Rate (₹/hour)</label>
              <input
                type="number"
                required
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="Ex. 150"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">GPS Coordinates (Optional)</label>
                <button
                  type="button"
                  onClick={handleFetchLocation}
                  disabled={locating}
                  className="text-xs text-blue-500 hover:text-blue-400 font-bold disabled:opacity-50"
                >
                  {locating ? 'Fetching...' : '📍 Capture Current Location'}
                </button>
              </div>

              {locSuccess && <p className="text-[11px] text-green-400">{locSuccess}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Longitude</span>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Latitude</span>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 border border-slate-800 text-slate-400 font-bold py-4 rounded-2xl text-xs uppercase tracking-wider"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!hourlyRate) {
                    setError('Hourly rate is required.');
                    return;
                  }
                  setError('');
                  setStep(3);
                }}
                className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-4 rounded-2xl shadow-lg transition-all uppercase tracking-wider"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3: SUMMARY CONFIRMATION --- */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 space-y-3 text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500 font-semibold">Name</span>
                <span className="font-bold text-slate-100">{name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500 font-semibold">Mobile</span>
                <span className="font-bold text-slate-100">+91 {mobile}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500 font-semibold">Service Category</span>
                <span className="font-bold text-blue-400">{serviceCategory}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500 font-semibold">Experience</span>
                <span className="font-bold text-slate-100">{experience} Years</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500 font-semibold">Hourly Rate</span>
                <span className="font-bold text-green-400">₹{hourlyRate}/hour</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500 font-semibold">Coordinates</span>
                <span className="font-bold text-slate-400">[{longitude}, {latitude}]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">KYC Verification</span>
                <span className="font-bold text-amber-500">Pending Approval</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                disabled={loading}
                onClick={() => setStep(2)}
                className="w-1/3 border border-slate-800 text-slate-400 font-bold py-4 rounded-2xl text-xs uppercase tracking-wider disabled:opacity-50"
              >
                Back
              </button>
              <button
                disabled={loading}
                onClick={handleRegister}
                className="w-2/3 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-4 rounded-2xl shadow-lg transition-all uppercase tracking-wider flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>Register Sarthi</span>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-slate-800/80 pt-6 text-center">
          <button
            onClick={() => router.push('/auth/login')}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            ← Already registered? Login
          </button>
        </div>
      </div>
    </div>
  );
}
