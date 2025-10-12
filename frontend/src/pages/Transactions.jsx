import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';
import { Plus, Receipt, TrendingUp, Calendar, Trash2 } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    nearest: '1',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await transactionAPI.getAll();
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      setSubmitting(false);
      return;
    }

    try {
      await transactionAPI.create(
        parseFloat(formData.amount),
        formData.description,
        parseInt(formData.nearest)
      );
      setSuccess('Transaction added successfully!');
      setFormData({ amount: '', description: '', nearest: '1' });
      setShowForm(false);
      fetchTransactions();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const addMockTransactions = async () => {
    const mockData = [
      { amount: 234.50, description: 'Grocery shopping', nearest: 1 },
      { amount: 89.20, description: 'Coffee', nearest: 10 },
      { amount: 456.80, description: 'Online shopping', nearest: 1 },
      { amount: 123.45, description: 'Restaurant', nearest: 10 },
    ];

    try {
      for (const data of mockData) {
        await transactionAPI.create(data.amount, data.description, data.nearest);
      }
      setSuccess('Mock transactions added successfully!');
      fetchTransactions();
    } catch (error) {
      setError('Failed to add mock transactions');
    }
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await transactionAPI.delete(transactionId);
      setSuccess('Transaction deleted successfully!');
      fetchTransactions();
    } catch (error) {
      setError('Failed to delete transaction');
    }
  };

  const totalRoundups = transactions.reduce((sum, t) => sum + t.roundup_amount, 0);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">Manage your transactions and round-ups</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={addMockTransactions}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Add Mock Data
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
          </button>
        </div>
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

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 mb-1">Total Round-ups Saved</p>
            <h2 className="text-4xl font-bold">₹{totalRoundups.toFixed(2)}</h2>
            <p className="text-primary-100 mt-2">From {transactions.length} transactions</p>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <TrendingUp className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Add Transaction Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Transaction</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="234.50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Round-up to nearest
                </label>
                <select
                  value={formData.nearest}
                  onChange={(e) => setFormData({ ...formData, nearest: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="1">₹1</option>
                  <option value="10">₹10</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Grocery shopping"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Transaction'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
        </div>
        
        {transactions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <Receipt className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {transaction.description || 'Transaction'}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        ₹{transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-green-600 font-medium mt-1">
                        +₹{transaction.roundup_amount.toFixed(2)} saved
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No transactions yet</p>
            <p className="text-sm mt-2">Add your first transaction to start saving!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
