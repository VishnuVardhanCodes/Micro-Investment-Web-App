import React, { useState, useEffect } from 'react';
import { walletAPI } from '../services/api';
import { Wallet as WalletIcon, Plus, CreditCard, Smartphone, Building2, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

const Wallet = () => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    amount: '',
    method: 'upi',
    description: '',
  });

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await walletAPI.getBalance();
      setWalletData(response.data);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      setSubmitting(false);
      return;
    }

    try {
      // Create Razorpay order
      const orderResponse = await walletAPI.createOrder(amount, formData.description);
      const { order_id, amount: orderAmount, currency, razorpay_key } = orderResponse.data;

      // Razorpay options
      const options = {
        key: razorpay_key,
        amount: orderAmount,
        currency: currency,
        name: 'MicroInvest Wallet',
        description: formData.description || 'Add money to wallet',
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            await walletAPI.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            setSuccess(`₹${amount.toFixed(2)} added to wallet successfully!`);
            setFormData({ amount: '', method: 'upi', description: '' });
            fetchWalletData();
          } catch (error) {
            setError('Payment verification failed. Please contact support.');
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: 'User',
          email: 'user@example.com',
        },
        notes: {
          description: formData.description || 'Wallet deposit',
        },
        theme: {
          color: '#0ea5e9',
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            setError('Payment cancelled');
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to initiate payment');
      setSubmitting(false);
    }
  };

  const presetAmounts = [100, 500, 1000, 2000, 5000];

  const getMethodIcon = (method) => {
    switch (method) {
      case 'upi':
        return <Smartphone className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'netbanking':
        return <Building2 className="w-4 h-4" />;
      default:
        return <WalletIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600 mt-1">Add money to invest or send to others</p>
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

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <WalletIcon className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-primary-100 text-sm mb-1">Wallet Balance</p>
          <h2 className="text-3xl font-bold">₹{walletData?.wallet_balance?.toFixed(2) || '0.00'}</h2>
          <p className="text-primary-100 text-xs mt-2">Added by you</p>
        </div>

        {/* Round-up Savings */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-green-100 text-sm mb-1">Round-up Savings</p>
          <h2 className="text-3xl font-bold">₹{walletData?.roundup_savings?.toFixed(2) || '0.00'}</h2>
          <p className="text-green-100 text-xs mt-2">From transactions</p>
        </div>

        {/* Total Available */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Plus className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-purple-100 text-sm mb-1">Total Available</p>
          <h2 className="text-3xl font-bold">₹{walletData?.total_available?.toFixed(2) || '0.00'}</h2>
          <p className="text-purple-100 text-xs mt-2">Ready to use</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Money Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Plus className="w-6 h-6 mr-2 text-primary-600" />
            Add Money
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-lg">₹</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-10 pr-3 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="1000.00"
                  required
                />
              </div>
            </div>

            {/* Preset Amounts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Select
              </label>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormData({ ...formData, amount: preset.toString() })}
                    className={`px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                      parseFloat(formData.amount) === preset
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                <strong>Secure Payment:</strong>&nbsp;You'll be redirected to Razorpay to complete payment via UPI, Card, or Netbanking
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Wallet top-up"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Add Money
                </>
              )}
            </button>
          </form>

          {/* Razorpay Info */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 mb-2">
              <strong>💳 Test Payment Credentials:</strong>
            </p>
            <div className="text-xs text-green-700 space-y-1">
              <p><strong>UPI:</strong> success@razorpay (for success)</p>
              <p><strong>Card:</strong> 4111 1111 1111 1111, CVV: Any 3 digits, Expiry: Any future date</p>
              <p><strong>Note:</strong> Sandbox mode - no real money is charged</p>
            </div>
          </div>
        </div>

        {/* Recent Deposits */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Deposits</h2>
          
          {walletData?.recent_deposits && walletData.recent_deposits.length > 0 ? (
            <div className="space-y-3">
              {walletData.recent_deposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                        {getMethodIcon(deposit.method)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          ₹{deposit.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          via {deposit.method}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      deposit.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {deposit.status}
                    </span>
                  </div>
                  {deposit.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {deposit.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(deposit.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <WalletIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No deposits yet</p>
              <p className="text-xs mt-1">Add money to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">💡 How to use your wallet</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div className="flex items-start">
            <div className="p-2 bg-primary-100 rounded-lg mr-3">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold">Invest</p>
              <p className="text-xs text-gray-600 mt-1">Use wallet money to invest in stocks, crypto, or ETFs</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold">Send Money</p>
              <p className="text-xs text-gray-600 mt-1">Transfer to any UPI ID or mobile number</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <WalletIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold">Combined Balance</p>
              <p className="text-xs text-gray-600 mt-1">Wallet + round-ups = total available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
