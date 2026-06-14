import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

export default function Login() {
  const router = useRouter();
  const { expired } = router.query;
  
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto clean existing storage on load of login page
  useEffect(() => {
    if (expired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    }
  }, [expired]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mobile.length !== 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/v1/auth/send-otp', { mobile });
      if (response.data.success) {
        // Redirect to OTP verify page passing the mobile number
        router.push(`/auth/verify?mobile=${mobile}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial from-slate-900 to-slate-950 flex items-center justify-center p-4 font-sans text-white">
      <Head>
        <title>Login | Sahayog Sarthi</title>
      </Head>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-500 text-3xl mb-2">
            🤝
          </div>
          <h2 className="text-3xl font-black tracking-tight">Sahayog Sarthi</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Enter your mobile number to get started with verified on-demand local services.
          </p>
        </div>

        {expired && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-2xl text-xs text-center leading-relaxed">
            🔒 Aapka session expire ho gaya hai. Please fir se OTP login karein.
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
            <div className="flex bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-colors">
              <span className="flex items-center justify-center bg-slate-900 px-4 text-sm font-semibold border-r border-slate-800 text-slate-400">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) {
                    setMobile(val);
                    if (val.length === 10) setError('');
                  }
                }}
                placeholder="Enter 10-digit number"
                className="w-full bg-transparent px-4 py-4 text-sm font-medium placeholder-slate-600 focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || mobile.length !== 10}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/20 transition-all uppercase tracking-wider flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending OTP...</span>
              </>
            ) : (
              <span>Get OTP</span>
            )}
          </button>
        </form>

        <div className="border-t border-slate-800/80 pt-6 text-center">
          <p className="text-xs text-slate-500">
            Earn as a verified local service provider?{' '}
            <button
              onClick={() => router.push('/auth/register-worker')}
              className="text-blue-500 font-bold hover:underline"
            >
              Register as Sarthi
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
