import React, { useState, useEffect } from 'react';
import { transferAPI, walletAPI } from '../services/api';
import { Send, Smartphone, CreditCard, CheckCircle, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';

const Transfer = () => {
  const [transfers, setTransfers] = useState([]);
  const [availableSavings, setAvailableSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_upi: '',
    recipient_mobile: '',
    amount: '',
    roundup_to_invest: '', // Extra amount to invest
    description: '',
    transferMethod: 'upi', // 'upi' or 'mobile'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletRes, transfersRes] = await Promise.all([
        walletAPI.getBalance(),
        transferAPI.getAll(),
      ]);
      setAvailableSavings(walletRes.data.wallet_balance); // Only wallet balance for transfers
      setTransfers(transfersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Validation
    if (!formData.recipient_name || !formData.amount) {
      setError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    if (formData.transferMethod === 'upi' && !formData.recipient_upi) {
      setError('Please enter UPI ID');
      setSubmitting(false);
      return;
    }

    if (formData.transferMethod === 'mobile' && !formData.recipient_mobile) {
      setError('Please enter mobile number');
      setSubmitting(false);
      return;
    }

    // Parse amounts and round to 2 decimal places to avoid floating point issues
    const amount = Math.round(parseFloat(formData.amount) * 100) / 100;
    if (amount <= 0 || isNaN(amount)) {
      setError('Please enter a valid amount');
      setSubmitting(false);
      return;
    }

    const roundupAmount = formData.roundup_to_invest ? Math.round(parseFloat(formData.roundup_to_invest) * 100) / 100 : 0;

    // Check only wallet balance for the transfer amount
    if (amount > availableSavings) {
      setError(`Insufficient wallet balance. Available: ₹${availableSavings.toFixed(2)}, Need: ₹${amount.toFixed(2)}`);
      setSubmitting(false);
      return;
    }

    try {
      await transferAPI.create(
        formData.transferMethod === 'upi' ? formData.recipient_upi : null,
        formData.transferMethod === 'mobile' ? formData.recipient_mobile : null,
        formData.recipient_name,
        amount,
        formData.description,
        roundupAmount > 0 ? roundupAmount : null
      );
      
      let successMsg = 'Money transferred successfully!';
      if (roundupAmount > 0) {
        successMsg += ` ₹${roundupAmount.toFixed(2)} invested in your portfolio!`;
      }
      setSuccess(successMsg);
      setFormData({
        recipient_name: '',
        recipient_upi: '',
        recipient_mobile: '',
        amount: '',
        roundup_to_invest: '',
        description: '',
        transferMethod: 'upi',
      });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.detail || 'Transfer failed. Please try again.');
    } finally {
      setSubmitting(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Send Money</h1>
        <p className="text-gray-600 mt-1">Transfer money from your wallet to UPI or mobile number. Optionally add roundup to invest.</p>
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

      {/* Available Balance */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 mb-2">Wallet Balance (for transfers)</p>
            <h2 className="text-4xl font-bold">₹{availableSavings.toFixed(2)}</h2>
            <p className="text-primary-100 mt-2 text-sm">Roundup investments come from your transaction roundups</p>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <Send className="w-12 h-12" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">New Transfer</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transfer Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Transfer Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, transferMethod: 'upi' })}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    formData.transferMethod === 'upi'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  UPI
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, transferMethod: 'mobile' })}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    formData.transferMethod === 'mobile'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  Mobile
                </button>
              </div>
            </div>

            {/* Recipient Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Name *
              </label>
              <input
                type="text"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="John Doe"
                required
              />
            </div>

            {/* UPI ID or Mobile Number */}
            {formData.transferMethod === 'upi' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID *
                </label>
                <input
                  type="text"
                  value={formData.recipient_upi}
                  onChange={(e) => setFormData({ ...formData, recipient_upi: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="example@upi"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  value={formData.recipient_mobile}
                  onChange={(e) => setFormData({ ...formData, recipient_mobile: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="100.00"
                  max={availableSavings}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum: ₹{availableSavings.toFixed(2)}
              </p>
            </div>

            {/* Round-up to Invest */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-start mb-3">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    💡 Round-up & Invest (Optional)
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Add extra amount to invest in your portfolio while sending money
                  </p>
                </div>
              </div>
              
              {/* Quick Round-up Options */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, roundup_to_invest: '1' })}
                  className={`px-2 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.roundup_to_invest === '1'
                      ? 'border-green-500 bg-green-100 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  +₹1
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, roundup_to_invest: '10' })}
                  className={`px-2 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.roundup_to_invest === '10'
                      ? 'border-green-500 bg-green-100 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  +₹10
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, roundup_to_invest: '50' })}
                  className={`px-2 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.roundup_to_invest === '50'
                      ? 'border-green-500 bg-green-100 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  +₹50
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, roundup_to_invest: '100' })}
                  className={`px-2 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.roundup_to_invest === '100'
                      ? 'border-green-500 bg-green-100 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  +₹100
                </button>
              </div>

              {/* Custom Amount */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₹</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.roundup_to_invest}
                  onChange={(e) => setFormData({ ...formData, roundup_to_invest: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Custom amount (optional)"
                />
              </div>
              
              {formData.roundup_to_invest && parseFloat(formData.roundup_to_invest) > 0 && (
                <p className="text-xs text-green-700 mt-2 font-medium">
                  ✓ ₹{parseFloat(formData.roundup_to_invest).toFixed(2)} will be invested in your portfolio
                </p>
              )}
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
                placeholder="Payment for..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Money
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recent Transfers */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transfers</h2>
          
          {transfers.length > 0 ? (
            <div className="space-y-3">
              {transfers.slice(0, 5).map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        {transfer.recipient_upi ? (
                          <CreditCard className="w-4 h-4 text-primary-600" />
                        ) : (
                          <Smartphone className="w-4 h-4 text-primary-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {transfer.recipient_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transfer.recipient_upi || transfer.recipient_mobile}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{transfer.amount.toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        transfer.status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : transfer.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {transfer.status}
                      </span>
                    </div>
                  </div>
                  {transfer.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {transfer.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(transfer.created_at).toLocaleDateString('en-IN', {
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
            <div className="text-center py-8 text-gray-500">
              <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No transfers yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          How it works
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start">
            <ArrowRight className="w-4 h-4 mr-2 mt-0.5" />
            <p>Transfer money from your round-up savings to any UPI ID or mobile number</p>
          </div>
          <div className="flex items-start">
            <ArrowRight className="w-4 h-4 mr-2 mt-0.5" />
            <p>Instant transfer (simulated for demo purposes)</p>
          </div>
          <div className="flex items-start">
            <ArrowRight className="w-4 h-4 mr-2 mt-0.5" />
            <p>Secure and tracked - all transfers are recorded in your history</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
