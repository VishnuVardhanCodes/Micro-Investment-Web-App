import React, { useState, useEffect } from 'react';
import { investmentAPI, walletAPI } from '../services/api';
import { TrendingUp, CheckCircle, AlertCircle, Coins, ArrowRight } from 'lucide-react';

const InvestRoundups = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [investmentSources, setInvestmentSources] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [source, setSource] = useState('roundups'); // 'roundups' or 'wallet'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sourcesRes, walletRes] = await Promise.all([
        investmentAPI.getSources(),
        walletAPI.getBalance(),
      ]);
      setInvestmentSources(sourcesRes.data);
      setWalletData(walletRes.data);
      setAmount(sourcesRes.data.roundup_pool_available.toString());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleInvest = async () => {
    setError('');
    setSuccess('');

    const investAmount = parseFloat(amount);
    if (!investAmount || investAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Validate against selected source
    const maxAmount = source === 'wallet' 
      ? walletData?.wallet_balance 
      : investmentSources?.roundup_pool_available;

    if (investAmount > maxAmount) {
      setError(`Amount exceeds available ${source}. Available: ₹${maxAmount?.toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      await investmentAPI.investRoundups(investAmount, source);
      setSuccess(`Successfully invested ₹${investAmount.toFixed(2)} from ${source === 'wallet' ? 'wallet' : 'roundups'}!`);
      setAmount('');
      fetchData();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to invest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const presetAmounts = [100, 250, 500, 1000];

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invest Your Money</h1>
        <p className="text-gray-600 mt-1">Invest from your round-up savings or wallet balance into your portfolio</p>
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

      {/* Available Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Roundups */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-6 h-6" />
            <p className="text-green-100">Round-up Savings</p>
          </div>
          <h2 className="text-4xl font-bold mb-3">
            ₹{investmentSources?.roundup_pool_available?.toFixed(2) || '0.00'}
          </h2>
          <div className="text-sm text-green-100">
            <p>From transactions</p>
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-6 h-6" />
            <p className="text-purple-100">Wallet Balance</p>
          </div>
          <h2 className="text-4xl font-bold mb-3">
            ₹{walletData?.wallet_balance?.toFixed(2) || '0.00'}
          </h2>
          <div className="text-sm text-purple-100">
            <p>Money you added</p>
          </div>
        </div>
      </div>

      {(investmentSources?.roundup_pool_available > 0 || walletData?.wallet_balance > 0) ? (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Invest Money</h2>

          {/* Source Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Invest From
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setSource('roundups');
                  setAmount(investmentSources?.roundup_pool_available.toString());
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  source === 'roundups'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <Coins className={`w-6 h-6 mx-auto mb-2 ${source === 'roundups' ? 'text-green-600' : 'text-gray-600'}`} />
                <p className={`font-semibold ${source === 'roundups' ? 'text-green-900' : 'text-gray-900'}`}>
                  Round-ups
                </p>
                <p className={`text-sm ${source === 'roundups' ? 'text-green-600' : 'text-gray-600'}`}>
                  ₹{investmentSources?.roundup_pool_available?.toFixed(2)}
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setSource('wallet');
                  setAmount(walletData?.wallet_balance.toString());
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  source === 'wallet'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <Coins className={`w-6 h-6 mx-auto mb-2 ${source === 'wallet' ? 'text-purple-600' : 'text-gray-600'}`} />
                <p className={`font-semibold ${source === 'wallet' ? 'text-purple-900' : 'text-gray-900'}`}>
                  Wallet
                </p>
                <p className={`text-sm ${source === 'wallet' ? 'text-purple-600' : 'text-gray-600'}`}>
                  ₹{walletData?.wallet_balance?.toFixed(2)}
                </p>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Investment Amount (₹)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xl">₹</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-4 text-2xl border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter amount"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Maximum available: ₹{(source === 'wallet' ? walletData?.wallet_balance : investmentSources?.roundup_pool_available)?.toFixed(2)}
            </p>
          </div>

          {/* Preset Amounts */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Select
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presetAmounts.map((preset) => {
                const maxAmount = source === 'wallet' ? walletData?.wallet_balance : investmentSources?.roundup_pool_available;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    disabled={preset > maxAmount}
                    className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                      parseFloat(amount) === preset
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : preset > maxAmount
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300'
                    }`}
                  >
                    ₹{preset}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  const maxAmount = source === 'wallet' ? walletData?.wallet_balance : investmentSources?.roundup_pool_available;
                  setAmount(maxAmount.toString());
                }}
                className={`px-4 py-3 rounded-lg border-2 font-semibold hover:opacity-90 transition-all ${
                  source === 'wallet'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-green-500 bg-green-50 text-green-700'
                }`}
              >
                All (₹{(source === 'wallet' ? walletData?.wallet_balance : investmentSources?.roundup_pool_available)?.toFixed(0)})
              </button>
            </div>
          </div>

          {/* Invest Button */}
          <button
            onClick={handleInvest}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full flex items-center justify-center px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <TrendingUp className="w-6 h-6 mr-2" />
                Invest Now
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works:</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start">
                <ArrowRight className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <p>Your investment will be distributed across your selected stocks/crypto/ETFs</p>
              </div>
              <div className="flex items-start">
                <ArrowRight className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <p>If you haven't selected any, we'll auto-recommend based on your risk profile</p>
              </div>
              <div className="flex items-start">
                <ArrowRight className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <p>View your investments anytime in the Portfolio page</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <Coins className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Roundups Available</h3>
          <p className="text-gray-600 mb-6">
            Start adding transactions to build up your round-up savings!
          </p>
          <a
            href="/transactions"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Add Transactions
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
        </div>
      )}
    </div>
  );
};

export default InvestRoundups;
