import React, { useState, useEffect } from 'react';
import { dashboardAPI, investmentAPI, walletAPI } from '../services/api';
import { 
  TrendingUp, 
  Wallet, 
  PieChart, 
  Award,
  ArrowUp,
  Sparkles,
  Coins
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [investmentSources, setInvestmentSources] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, milestonesRes, sourcesRes, walletRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getMilestones(),
        investmentAPI.getSources(),
        walletAPI.getBalance(),
      ]);
      setStats(statsRes.data);
      setMilestones(milestonesRes.data);
      setInvestmentSources(sourcesRes.data);
      setWalletData(walletRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const achievedMilestones = milestones.filter(m => m.achieved);
  const nextMilestone = milestones.find(m => !m.achieved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your micro-investments and savings</p>
      </div>

      {/* Primary Investment Source - Roundups */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-green-100 text-sm mb-1">💰 Round-up Savings (Primary Investment Source)</p>
            <h2 className="text-4xl font-bold">₹{investmentSources?.roundup_pool_available?.toFixed(2) || '0.00'}</h2>
            <p className="text-green-100 text-sm mt-2">Available to invest from {stats?.total_transactions || 0} transactions</p>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-lg">
            <Coins className="w-12 h-12" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-green-400">
          <div>
            <p className="text-green-100 text-xs">Already Invested</p>
            <p className="text-white font-semibold">₹{investmentSources?.from_roundups?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-green-100 text-xs">Total Generated</p>
            <p className="text-white font-semibold">₹{walletData?.roundup_savings?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <a href="/invest" className="px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors">
              Invest Now
            </a>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <ArrowUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {stats?.total_transactions || 0}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Total Transactions</p>
        </div>

        {/* Wallet Balance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Wallet className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            ₹{walletData?.wallet_balance?.toFixed(2) || '0.00'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Wallet Balance</p>
        </div>

        {/* Total Invested */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            ₹{investmentSources?.total_invested?.toFixed(2) || '0.00'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Total Invested</p>
        </div>

        {/* Milestones Achieved */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {achievedMilestones.length}/{milestones.length}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Milestones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Allocation */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <PieChart className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Portfolio Allocation</h2>
          </div>

          {stats?.portfolio_allocation && stats.portfolio_allocation.length > 0 ? (
            <div className="space-y-4">
              {stats.portfolio_allocation.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item.type}
                    </span>
                    <span className="text-sm text-gray-600">
                      ₹{item.amount.toFixed(2)} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No investments yet</p>
              <p className="text-sm mt-1">Start by making a transaction!</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">User Selected</span>
              <span className="font-semibold text-gray-900">
                {stats?.user_selected_count || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Auto-Recommended</span>
              <span className="font-semibold text-gray-900">
                {stats?.auto_recommended_count || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Milestones & Achievements */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center mb-6">
            <Sparkles className="w-5 h-5 text-yellow-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
          </div>

          {/* Progress to Next Milestone */}
          {nextMilestone && (
            <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Next Milestone
                </span>
                <span className="text-lg">{nextMilestone.badge_icon}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {nextMilestone.name}
              </p>
              <p className="text-xs text-gray-600 mb-3">
                {nextMilestone.description}
              </p>
              <div className="w-full bg-white rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      ((stats?.total_roundups || 0) / nextMilestone.threshold) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                ₹{stats?.total_roundups?.toFixed(2) || '0.00'} / ₹{nextMilestone.threshold}
              </p>
            </div>
          )}

          {/* Achieved Milestones */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Unlocked Badges
            </h3>
            {achievedMilestones.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {achievedMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                  >
                    <div className="text-2xl mb-1">{milestone.badge_icon}</div>
                    <p className="text-xs font-semibold text-gray-900">
                      {milestone.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(milestone.achieved_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No badges unlocked yet</p>
                <p className="text-xs mt-1">Complete transactions to earn badges!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-2">💡 How It Works</h2>
        <p className="text-primary-100 mb-4">
          Make transactions → Auto-collect round-ups → Invest in your portfolio!
          <br />
          <strong>₹{investmentSources?.roundup_pool_available?.toFixed(2) || '0.00'}</strong> ready from your round-ups.
        </p>
        <div className="flex gap-3">
          <a
            href="/transactions"
            className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
          >
            Add Transactions
          </a>
          <a
            href="/portfolio"
            className="px-4 py-2 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 transition-colors"
          >
            Select Stocks
          </a>
          <a
            href="/invest"
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Invest Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
