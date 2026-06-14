import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

export default function Verify() {
  const router = useRouter();
  const { mobile } = router.query;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30); // 30 seconds timer for development
  const [canResend, setCanResend] = useState(false);
  
  // Inline profile modal states for new customer
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerName, setCustomerName] = useState('');

  const inputRefs = useRef([]);

  // Countdown timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    const numericVal = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = numericVal;
    setOtp(newOtp);

    // Shift focus to next input
    if (numericVal !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = { mobile, otp: otpCode };
      if (isNewCustomer && customerName.trim()) {
        payload.name = customerName.trim();
      }

      const response = await axios.post('http://localhost:5000/api/v1/auth/verify-otp', payload);

      if (response.data.newCustomer) {
        // Trigger inline profile registration modal instead of redirect
        setIsNewCustomer(true);
        setError('');
      } else if (response.data.token) {
        // Successful login
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        alert(`🎉 OTP verified. Welcome!`);
        if (response.data.role === 'worker') {
          router.push('/workers/dashboard');
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/v1/auth/send-otp', { mobile });
      setResendTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial from-slate-900 to-slate-950 flex items-center justify-center p-4 font-sans text-white">
      <Head>
        <title>Verify OTP | Sahayog Sarthi</title>
      </Head>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Verification Card Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight">OTP Verification</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            A 6-digit verification code has been simulated for your mobile number: <span className="text-blue-400 font-semibold">+91 {mobile}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs text-center">
            ⚠️ {error}
          </div>
        )}

        {/* --- DYNAMIC TRANSITION CONTAINER --- */}
        {!isNewCustomer ? (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-between space-x-2 py-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 bg-slate-950 border border-slate-800 rounded-2xl text-center text-xl font-bold focus:outline-none focus:border-blue-500 text-blue-400 transition-colors"
                  disabled={loading}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Didn't get code?{' '}
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-blue-500 font-bold hover:underline"
                  >
                    Resend
                  </button>
                ) : (
                  <span className="text-slate-400">Resend in {resendTimer}s</span>
                )}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/20 transition-all uppercase tracking-wider flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Login</span>
              )}
            </button>
          </form>
        ) : (
          /* --- INLINE PROFILE REGISTRATION MODAL CONTROLLER --- */
          <div className="space-y-5 animate-[slideIn_0.3s_ease-out]">
            <style jsx>{`
              @keyframes slideIn {
                from { transform: translateY(10px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}</style>
            
            <div className="bg-blue-600/10 border border-blue-500/20 text-blue-400 p-4 rounded-2xl text-xs leading-relaxed text-center font-medium">
              🎉 OTP Verified Successfully! Please tell us your name to create your account.
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex. Pranjal Verma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sm focus:outline-none focus:border-blue-500 text-slate-100 placeholder-slate-600"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !customerName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/20 transition-all uppercase tracking-wider flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <span>Complete Registration</span>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="border-t border-slate-800/80 pt-6 text-center">
          <button
            onClick={() => router.push('/auth/login')}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
