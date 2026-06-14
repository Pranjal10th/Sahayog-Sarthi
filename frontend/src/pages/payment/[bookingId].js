import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

export default function PaymentCheckout() {
  const router = useRouter();
  const { bookingId, amount } = router.query; // URL patterns se pricing variables parse karega

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);

  // 1. Page load hote hi backend se Razorpay Sandbox Order fetch karega
  useEffect(() => {
    if (!bookingId) return;

    const initializeOrder = async () => {
      try {
        const authToken = localStorage.getItem('token');
        const config = {
          headers: { 'Authorization': `Bearer ${authToken}` }
        };

        const response = await axios.post('http://localhost:5000/api/v1/payments/create-order', {
          bookingId: bookingId
        }, config);

        if (response.data && response.data.success) {
          setOrderData(response.data.order);
        }
      } catch (err) {
        setError('Payment gateway network synchronization failed.');
      }
    };

    initializeOrder();
  }, [bookingId]);

  const handleSandboxPaymentSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const authToken = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${authToken}` }
      };

      // Mock Sandbox metadata parameters matching SRS cryptography layout
      const payload = {
        bookingId: bookingId,
        razorpay_order_id: orderData?.id || `order_mock_${Math.random().toString(36).substring(7)}`,
        razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(7)}`,
        razorpay_signature: 'sandbox_cryptographic_bypass_hash_signature'
      };

      const response = await axios.post('http://localhost:5000/api/v1/payments/verify', payload, config);

      if (response.data && response.data.success) {
        setSuccess(true);
        // Payment success hote hi worker wallet instantly top-up ho chuka hoga
        // Hum user ko dynamic review/rating dashboard modal par redirect karenge
        setTimeout(() => {
          router.push(`/?payment_success=true&booking_id=${bookingId}`);
        }, 2500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment gateway authentication failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex items-center justify-center p-6">
      <Head>
        <title>Secure Checkout | Sahayog Sarthi</title>
      </Head>

      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Gateway Branded Header */}
        <div className="bg-emerald-600 p-6 text-white text-center">
          <span className="text-3xl">🔒</span>
          <h2 className="text-xl font-bold mt-2">Sahayog Secure Pay</h2>
          <p className="text-emerald-100 text-xs mt-0.5">Powered by Razorpay Core Standard</p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs border border-red-200">
              ❌ {error}
            </div>
          )}

          {success ? (
            /* Success Animation State */
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto animate-bounce">
                ✓
              </div>
              <h3 className="text-lg font-bold text-gray-800">Payment Successful!</h3>
              <p className="text-xs text-gray-400">₹{amount || '200'} successfully transferred to Sarthi wallet after platform fee deduction.</p>
            </div>
          ) : (
            /* Checkout Details Core Layout */
            <>
              <div className="text-center space-y-1">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Invoice Value</p>
                <p className="text-4xl font-black text-gray-900">₹{amount || '200'}.00</p>
                <p className="text-[10px] text-gray-400 font-mono mt-1">ORDER ID: {orderData?.id || 'Fetching sandbox state...'}</p>
              </div>

              <div className="border-t border-b border-gray-100 py-4 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Service Professional Charges:</span>
                  <span className="font-semibold text-gray-800">₹{amount || '200'}.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Convenience & Platform Fee:</span>
                  <span className="text-green-600 font-medium">Free (Beta Launch)</span>
                </div>
              </div>

              <button
                onClick={handleSandboxPaymentSubmit}
                disabled={loading || !orderData}
                className={`w-full py-3.5 rounded-xl font-bold text-white transition shadow-md ${
                  loading || !orderData 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
                }`}
              >
                {loading ? 'Verifying Gateway Signature...' : `Pay ₹${amount || '200'} via Sandbox`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}