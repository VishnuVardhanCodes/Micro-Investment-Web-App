import React, { useState, useEffect } from 'react';
import { paymentAPI, walletAPI } from '../services/api';
import { CreditCard, Shield, CheckCircle, AlertCircle, Wallet } from 'lucide-react';

const Payment = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableSavings, setAvailableSavings] = useState(0);

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      const response = await walletAPI.getBalance();
      setAvailableSavings(response.data.total_available);
      setAmount(response.data.total_available.toString());
    } catch (error) {
      console.error('Error fetching savings:', error);
    }
  };

  const handlePayment = async () => {
    setError('');
    setSuccess('');

    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (paymentAmount > availableSavings) {
      setError('Amount exceeds available savings');
      return;
    }

    setLoading(true);

    try {
      // Create order
      const orderResponse = await paymentAPI.createOrder(paymentAmount);
      const { order_id, amount: orderAmount, currency, razorpay_key } = orderResponse.data;

      // Razorpay options
      const options = {
        key: razorpay_key,
        amount: orderAmount,
        currency: currency,
        name: 'MicroInvest',
        description: 'Micro-Investment Transaction',
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            await paymentAPI.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            setSuccess('Investment successful! Your portfolio has been updated.');
            setAmount('');
            fetchSavings();
          } catch (error) {
            setError('Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: 'User',
          email: 'user@example.com',
        },
        notes: {
          description: 'Micro-Investment',
        },
        theme: {
          color: '#0ea5e9',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError('Payment cancelled');
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const presetAmounts = [100, 250, 500, 1000];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
        <p className="text-gray-600 mt-1">Invest your savings into your portfolio</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {/* Available Savings Card */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 mb-2 flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              Available Savings
            </p>
            <h2 className="text-5xl font-bold">₹{availableSavings.toFixed(2)}</h2>
            <p className="text-primary-100 mt-3">Ready to be invested</p>
          </div>
          <div className="p-6 bg-white bg-opacity-20 rounded-xl">
            <CreditCard className="w-16 h-16" />
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Invest Now</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose an amount to invest via Razorpay (UPI, Card, Netbanking)
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Amount (₹)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">₹</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full pl-8 pr-3 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
                max={availableSavings}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Maximum: ₹{availableSavings.toFixed(2)}
            </p>
          </div>

          {/* Preset Amounts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Select
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(Math.min(preset, availableSavings).toString())}
                  disabled={preset > availableSavings}
                  className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                    parseFloat(amount) === Math.min(preset, availableSavings)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
            <button
              onClick={() => setAmount(availableSavings.toString())}
              className="mt-3 w-full px-4 py-2 rounded-lg border-2 border-purple-200 bg-purple-50 text-purple-700 font-medium hover:border-purple-300 transition-colors"
            >
              Use Full Amount (₹{availableSavings.toFixed(2)})
            </button>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full flex items-center justify-center px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <CreditCard className="w-6 h-6 mr-3" />
                Proceed to Payment
              </>
            )}
          </button>

          {/* Payment Methods */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
              <Shield className="w-4 h-4 mr-2" />
              Secure payment powered by Razorpay
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="px-3 py-1 bg-gray-100 rounded">UPI</span>
              <span className="px-3 py-1 bg-gray-100 rounded">Cards</span>
              <span className="px-3 py-1 bg-gray-100 rounded">Netbanking</span>
              <span className="px-3 py-1 bg-gray-100 rounded">Wallets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Credentials Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Sandbox Test Credentials
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium mb-1">Test Card:</p>
              <p className="font-mono bg-white px-3 py-2 rounded">4111 1111 1111 1111</p>
              <p className="text-xs mt-1">CVV: Any 3 digits | Expiry: Any future date</p>
            </div>
            <div>
              <p className="font-medium mb-1">Test UPI ID:</p>
              <p className="font-mono bg-white px-3 py-2 rounded">success@razorpay</p>
              <p className="text-xs mt-1">Use this UPI ID for successful test payment</p>
            </div>
          </div>
          <p className="text-xs mt-3">
            Note: This is a sandbox environment. No real money will be charged.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">How it works</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start">
            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold mr-3 mt-0.5">
              1
            </div>
            <p>Enter the amount you want to invest from your savings pool</p>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold mr-3 mt-0.5">
              2
            </div>
            <p>Complete payment using UPI, Card, or Netbanking via Razorpay</p>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold mr-3 mt-0.5">
              3
            </div>
            <p>Your investment will be distributed across your selected portfolio options</p>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold mr-3 mt-0.5">
              4
            </div>
            <p>Track your investments and earnings in the dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
