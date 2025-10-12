import React, { useState, useEffect } from 'react';
import { portfolioAPI, investmentAPI } from '../services/api';
import { 
  Briefcase, 
  TrendingUp,
  TrendingDown,
  Bitcoin, 
  DollarSign,
  X,
  Plus,
  LogOut,
  AlertCircle,
  CheckCircle,
  Activity,
  RefreshCw
} from 'lucide-react';

const PortfolioNew = () => {
  const [portfolioOptions, setPortfolioOptions] = useState([]);
  const [currentSelections, setCurrentSelections] = useState([]);
  const [investmentsDetailed, setInvestmentsDetailed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddStocks, setShowAddStocks] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [updatingPrices, setUpdatingPrices] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [optionsRes, selectionsRes, detailedRes] = await Promise.all([
        portfolioAPI.getOptions(),
        portfolioAPI.getCurrent(),
        portfolioAPI.getInvestmentsDetailed(),
      ]);
      
      setPortfolioOptions(optionsRes.data);
      setCurrentSelections(selectionsRes.data);
      setInvestmentsDetailed(detailedRes.data);
      
      console.log('Current selections:', selectionsRes.data);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSelection = async (optionId) => {
    if (!window.confirm('Remove this stock from your portfolio selections?')) {
      return;
    }

    try {
      await portfolioAPI.removeSelection(optionId);
      setSuccess('Removed from portfolio');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (error) {
      console.error('Remove error:', error);
      setError(error.response?.data?.detail || 'Failed to remove');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleExitInvestment = async (optionId, name) => {
    if (!window.confirm(`Exit investment in ${name}? Your money will be returned to your wallet.`)) {
      return;
    }

    try {
      const response = await portfolioAPI.exitInvestment(optionId);
      setSuccess(`Exited! ₹${response.data.credited_to_wallet} credited to wallet. P/L: ₹${response.data.profit_loss}`);
      setTimeout(() => setSuccess(''), 5000);
      fetchData();
    } catch (error) {
      console.error('Exit investment error:', error);
      setError(error.response?.data?.detail || 'Failed to exit investment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdatePrices = async () => {
    setUpdatingPrices(true);
    try {
      const response = await investmentAPI.updatePrices();
      setSuccess('Stock prices updated! Check your P&L changes.');
      setTimeout(() => setSuccess(''), 3000);
      fetchData(); // Refresh data to show new prices
    } catch (error) {
      console.error('Update prices error:', error);
      setError('Failed to update prices');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingPrices(false);
    }
  };

  const handleAddStocks = async () => {
    if (selectedToAdd.length === 0) {
      setError('Please select at least one stock');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      // Get current selection IDs, handling both possible property names
      const currentIds = currentSelections.map(s => s.portfolio_option_id || s.portfolio_option?.id).filter(id => id != null);
      const allIds = [...new Set([...currentIds, ...selectedToAdd])];
      
      console.log('Adding stocks. Current selections:', currentSelections);
      console.log('Current IDs:', currentIds, 'Adding:', selectedToAdd, 'All IDs:', allIds);
      
      // Ensure all IDs are integers
      const payload = allIds.map(id => parseInt(id, 10));
      console.log('Sending payload:', payload);
      
      await portfolioAPI.select(payload);
      setSuccess(`${selectedToAdd.length} stock(s) added to portfolio!`);
      setTimeout(() => setSuccess(''), 3000);
      setShowAddStocks(false);
      setSelectedToAdd([]);
      fetchData();
    } catch (error) {
      console.error('Add stocks error:', error);
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.detail || 'Failed to add stocks');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getAssetIcon = (type) => {
    switch (type) {
      case 'crypto': return <Bitcoin className="w-5 h-5" />;
      case 'stock': return <TrendingUp className="w-5 h-5" />;
      case 'etf': return <Activity className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalInvested = investmentsDetailed.reduce((sum, inv) => sum + inv.amount_invested, 0);
  const totalCurrentValue = investmentsDetailed.reduce((sum, inv) => sum + inv.current_value, 0);
  const totalPL = totalCurrentValue - totalInvested;
  const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested * 100) : 0;

  const availableStocks = portfolioOptions.filter(
    option => !currentSelections.some(s => s.portfolio_option_id === option.id)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Portfolio</h1>
          <p className="text-gray-600 mt-1">Manage your investments and track performance</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleUpdatePrices}
            disabled={updatingPrices}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            title="Update stock prices to see P&L changes"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${updatingPrices ? 'animate-spin' : ''}`} />
            Update Prices
          </button>
          <button
            onClick={() => setShowAddStocks(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Stocks
          </button>
        </div>
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

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Total Invested</p>
          <h3 className="text-2xl font-bold text-gray-900">₹{totalInvested.toFixed(2)}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Current Value</p>
          <h3 className="text-2xl font-bold text-gray-900">₹{totalCurrentValue.toFixed(2)}</h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Total P/L</p>
          <h3 className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPL >= 0 ? '+' : ''}₹{totalPL.toFixed(2)}
          </h3>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Returns</p>
          <h3 className={`text-2xl font-bold ${totalPLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPLPercent >= 0 ? '+' : ''}{totalPLPercent.toFixed(2)}%
          </h3>
        </div>
      </div>

      {/* Investment Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Your Investments</h2>
        </div>

        {investmentsDetailed.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {investmentsDetailed.map((investment) => (
              <div key={investment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      investment.asset_type === 'crypto' ? 'bg-orange-50 text-orange-600' :
                      investment.asset_type === 'stock' ? 'bg-blue-50 text-blue-600' :
                      'bg-purple-50 text-purple-600'
                    }`}>
                      {getAssetIcon(investment.asset_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{investment.portfolio_name}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase">
                          {investment.portfolio_symbol}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>{investment.units.toFixed(4)} units</span>
                        <span>@ ₹{investment.current_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Invested</p>
                      <p className="font-semibold text-gray-900">₹{investment.amount_invested.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Current Value</p>
                      <p className="font-semibold text-gray-900">₹{investment.current_value.toFixed(2)}</p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-xs text-gray-500">P/L</p>
                      <p className={`font-bold flex items-center justify-end ${
                        investment.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {investment.profit_loss >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {investment.profit_loss >= 0 ? '+' : ''}₹{investment.profit_loss.toFixed(2)}
                      </p>
                      <p className={`text-xs ${investment.profit_loss_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ({investment.profit_loss_percentage >= 0 ? '+' : ''}{investment.profit_loss_percentage.toFixed(2)}%)
                      </p>
                    </div>
                    <button
                      onClick={() => handleExitInvestment(investment.portfolio_option_id, investment.portfolio_name)}
                      className="flex items-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                      title="Exit investment"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Exit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No investments yet</p>
            <p className="text-sm mt-2">Invest your round-up savings to get started!</p>
            <a href="/invest" className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Invest Now
            </a>
          </div>
        )}
      </div>

      {/* Selected Stocks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Selected Stocks ({currentSelections.length})</h2>
          <p className="text-sm text-gray-600 mt-1">These stocks will receive your future investments</p>
        </div>

        {currentSelections.length > 0 ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSelections.map((selection) => (
              <div key={selection.id} className="relative p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                {selection.is_auto_recommended && (
                  <span className="absolute top-2 right-2 text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    Auto
                  </span>
                )}
                <button
                  onClick={() => {
                    console.log('Removing selection:', selection);
                    handleRemoveSelection(selection.portfolio_option_id || selection.portfolio_option?.id);
                  }}
                  className="absolute top-2 left-2 p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900">{selection.portfolio_option?.name}</h4>
                  <p className="text-sm text-gray-600">{selection.portfolio_option?.symbol}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{selection.portfolio_option?.asset_type}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No stocks selected. Add stocks to start investing!</p>
          </div>
        )}
      </div>

      {/* Add Stocks Modal */}
      {showAddStocks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Stocks to Portfolio</h2>
              <button
                onClick={() => { setShowAddStocks(false); setSelectedToAdd([]); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableStocks.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedToAdd.includes(option.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedToAdd(prev =>
                        prev.includes(option.id)
                          ? prev.filter(id => id !== option.id)
                          : [...prev, option.id]
                      );
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          option.asset_type === 'crypto' ? 'bg-orange-50 text-orange-600' :
                          option.asset_type === 'stock' ? 'bg-blue-50 text-blue-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>
                          {getAssetIcon(option.asset_type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{option.name}</h4>
                          <p className="text-sm text-gray-600">{option.symbol}</p>
                          <p className="text-xs text-gray-500 mt-1 capitalize">{option.asset_type} • {option.risk_level} risk</p>
                        </div>
                      </div>
                      {selectedToAdd.includes(option.id) && (
                        <CheckCircle className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{option.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => { setShowAddStocks(false); setSelectedToAdd([]); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStocks}
                disabled={selectedToAdd.length === 0}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add {selectedToAdd.length} Stock{selectedToAdd.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioNew;
