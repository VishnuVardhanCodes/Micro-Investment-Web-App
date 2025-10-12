import React, { useState, useEffect } from 'react';
import { portfolioAPI } from '../services/api';
import { 
  Briefcase, 
  TrendingUp, 
  Bitcoin, 
  DollarSign,
  Check,
  Star,
  Activity
} from 'lucide-react';

const Portfolio = () => {
  const [portfolioOptions, setPortfolioOptions] = useState([]);
  const [currentPortfolio, setCurrentPortfolio] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [optionsRes, portfolioRes, investmentsRes] = await Promise.all([
        portfolioAPI.getOptions(),
        portfolioAPI.getCurrent(),
        portfolioAPI.getInvestments(),
      ]);
      
      setPortfolioOptions(optionsRes.data);
      setCurrentPortfolio(portfolioRes.data);
      setInvestments(investmentsRes.data);
      
      // Set initially selected options
      const selected = portfolioRes.data
        .filter(p => !p.is_auto_recommended)
        .map(p => p.portfolio_option.id);
      setSelectedOptions(selected);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (optionId) => {
    setSelectedOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await portfolioAPI.select(selectedOptions);
      setSuccess('Portfolio updated successfully!');
      fetchData();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update portfolio');
    } finally {
      setSaving(false);
    }
  };

  const getAssetIcon = (assetType) => {
    switch (assetType) {
      case 'stock':
        return <TrendingUp className="w-6 h-6" />;
      case 'crypto':
        return <Bitcoin className="w-6 h-6" />;
      case 'etf':
        return <Activity className="w-6 h-6" />;
      default:
        return <DollarSign className="w-6 h-6" />;
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
        <p className="text-gray-600 mt-1">Select your preferred investments</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Current Investments Summary */}
      {investments.length > 0 && (
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 mb-1">Total Invested</p>
              <h2 className="text-4xl font-bold">₹{totalInvested.toFixed(2)}</h2>
              <p className="text-primary-100 mt-2">Across {investments.length} investments</p>
            </div>
            <div className="p-4 bg-white bg-opacity-20 rounded-lg">
              <Briefcase className="w-12 h-12" />
            </div>
          </div>
        </div>
      )}

      {/* Current Portfolio */}
      {currentPortfolio.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentPortfolio.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border-2 ${
                  item.is_auto_recommended
                    ? 'border-purple-200 bg-purple-50'
                    : 'border-primary-200 bg-primary-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${
                    item.is_auto_recommended ? 'bg-purple-100' : 'bg-primary-100'
                  }`}>
                    {getAssetIcon(item.portfolio_option.asset_type)}
                  </div>
                  {item.is_auto_recommended && (
                    <Star className="w-5 h-5 text-purple-600 fill-purple-600" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">
                  {item.portfolio_option.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {item.portfolio_option.symbol}
                </p>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(
                    item.portfolio_option.risk_level
                  )}`}>
                    {item.portfolio_option.risk_level} risk
                  </span>
                </div>
                {item.is_auto_recommended && (
                  <p className="text-xs text-purple-600 mt-2 font-medium">
                    Auto-recommended
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Available Options</h2>
              <p className="text-sm text-gray-600 mt-1">
                Select your preferred investments or let us auto-recommend based on your risk profile
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Selection'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Stocks */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Stocks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolioOptions
                .filter(opt => opt.asset_type === 'stock')
                .map((option) => {
                  const isSelected = selectedOptions.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleSelection(option.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        {isSelected && (
                          <div className="p-1 bg-primary-600 rounded-full">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900">{option.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{option.symbol}</p>
                      <p className="text-xs text-gray-500 mt-2">{option.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(
                          option.risk_level
                        )}`}>
                          {option.risk_level}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{option.current_price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Crypto */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bitcoin className="w-5 h-5 mr-2 text-orange-600" />
              Cryptocurrency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolioOptions
                .filter(opt => opt.asset_type === 'crypto')
                .map((option) => {
                  const isSelected = selectedOptions.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleSelection(option.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-orange-50 rounded-lg">
                          <Bitcoin className="w-5 h-5 text-orange-600" />
                        </div>
                        {isSelected && (
                          <div className="p-1 bg-primary-600 rounded-full">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900">{option.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{option.symbol}</p>
                      <p className="text-xs text-gray-500 mt-2">{option.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(
                          option.risk_level
                        )}`}>
                          {option.risk_level}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{option.current_price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* ETFs */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600" />
              ETFs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolioOptions
                .filter(opt => opt.asset_type === 'etf')
                .map((option) => {
                  const isSelected = selectedOptions.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleSelection(option.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <Activity className="w-5 h-5 text-green-600" />
                        </div>
                        {isSelected && (
                          <div className="p-1 bg-primary-600 rounded-full">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900">{option.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{option.symbol}</p>
                      <p className="text-xs text-gray-500 mt-2">{option.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(
                          option.risk_level
                        )}`}>
                          {option.risk_level}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{option.current_price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
