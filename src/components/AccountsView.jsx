import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as supabaseService from '../supabase/supabaseService';
import { TrendingUp, DollarSign, Calendar, MessageSquare } from 'lucide-react';
import HistoricalData from './HistoricalData';

const AccountsView = ({ accounts, managers, actionItems, statuses }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [satisfactionData, setSatisfactionData] = useState([]);
  const [billingData, setBillingData] = useState([]);
  const [yearlyAverages, setYearlyAverages] = useState([]);
  const [allSatisfactionScores, setAllSatisfactionScores] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get available years from all satisfaction data
  const availableYears = useMemo(() => {
    const years = new Set();
    allSatisfactionScores.forEach(score => years.add(score.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [allSatisfactionScores]);

  // Load all satisfaction scores on mount
  useEffect(() => {
    loadAllSatisfactionScores();
  }, []);

  // Load account-specific data when account is selected
  useEffect(() => {
    if (selectedAccount) {
      loadAccountData(selectedAccount);
    }
  }, [selectedAccount]);

  const loadAllSatisfactionScores = async () => {
    try {
      setLoading(true);
      const scores = await supabaseService.getSatisfactionScores();
      setAllSatisfactionScores(scores);
    } catch (error) {
      console.error('Error loading satisfaction scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccountData = async (accountId) => {
    try {
      setLoading(true);
      const [scores, billing, averages] = await Promise.all([
        supabaseService.getSatisfactionScores(accountId),
        supabaseService.getAccountBilling(accountId),
        supabaseService.getYearlyAverages(accountId)
      ]);
      setSatisfactionData(scores);
      setBillingData(billing);
      setYearlyAverages(averages);
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for selected year
  const chartData = useMemo(() => {
    if (!selectedAccount) return [];

    const yearScores = satisfactionData.filter(s => s.year === selectedYear);
    return [1, 2, 3, 4].map(quarter => {
      const score = yearScores.find(s => s.quarter === quarter);
      return {
        quarter: `Q${quarter}`,
        score: score ? score.score : null,
        comments: score ? score.comments : ''
      };
    });
  }, [satisfactionData, selectedYear, selectedAccount]);

  // Prepare yearly averages chart data
  const yearlyChartData = useMemo(() => {
    if (!selectedAccount || yearlyAverages.length === 0) return [];

    return yearlyAverages.map(ya => ({
      year: ya.year.toString(),
      average: parseFloat(ya.average),
      ...ya.quarters
    }));
  }, [yearlyAverages, selectedAccount]);

  // Get account details
  const accountDetails = useMemo(() => {
    if (!selectedAccount) return null;
    return accounts.find(a => a.id === selectedAccount);
  }, [selectedAccount, accounts]);

  const managerName = useMemo(() => {
    if (!accountDetails) return '';
    const manager = managers.find(m => m.id === accountDetails.managerId);
    return manager ? manager.name : 'Unassigned';
  }, [accountDetails, managers]);

  // Prepare billing chart data
  const billingChartData = useMemo(() => {
    return billingData.slice(0, 12).reverse().map(bill => ({
      month: new Date(bill.billingMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      amount: bill.billedAmount,
      currency: bill.currency
    }));
  }, [billingData]);

  if (loading && !selectedAccount) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Accounts Analytics</h2>

        {/* Account Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Account</label>
            <select
              value={selectedAccount || ''}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">-- Select an account --</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>

          {selectedAccount && availableYears.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Account Info */}
        {accountDetails && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Account</div>
                <div className="text-lg font-semibold">{accountDetails.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Manager</div>
                <div className="text-lg font-semibold">{managerName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">People</div>
                <div className="text-lg font-semibold">{accountDetails.people}</div>
              </div>
              {accountDetails.primaryLanguage && (
                <div>
                  <div className="text-sm text-gray-600">Primary Tech</div>
                  <div className="text-lg font-semibold">{accountDetails.primaryLanguage}</div>
                </div>
              )}
            </div>

            {/* Language Stack */}
            {accountDetails.languageStack && accountDetails.languageStack.length > 0 && (
              <div className="mt-3">
                <div className="text-sm text-gray-600 mb-2">Technology Stack</div>
                <div className="flex flex-wrap gap-2">
                  {accountDetails.languageStack.map(lang => (
                    <span key={lang} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedAccount ? (
        <>
          {/* Satisfaction Scores - Current Year */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Satisfaction Scores - {selectedYear}</h3>
            </div>

            {chartData.some(d => d.score !== null) ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>

                {/* Quarterly Details */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {chartData.map(data => (
                    <div key={data.quarter} className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-gray-600">{data.quarter} {selectedYear}</div>
                      <div className="text-2xl font-bold text-blue-600 mt-1">
                        {data.score !== null ? data.score : 'N/A'}
                      </div>
                      {data.comments && (
                        <div className="mt-2 text-xs text-gray-600 italic">"{data.comments}"</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No satisfaction data available for {selectedYear}
              </div>
            )}
          </div>

          {/* Yearly Averages */}
          {yearlyAverages.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-green-600" />
                <h3 className="text-xl font-bold text-gray-900">Historical Performance</h3>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill="#10b981" name="Yearly Average" />
                  <Bar dataKey="Q1" fill="#3b82f6" name="Q1" />
                  <Bar dataKey="Q2" fill="#8b5cf6" name="Q2" />
                  <Bar dataKey="Q3" fill="#f59e0b" name="Q3" />
                  <Bar dataKey="Q4" fill="#ef4444" name="Q4" />
                </BarChart>
              </ResponsiveContainer>

              {/* Yearly Summary Cards */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {yearlyAverages.map(ya => (
                  <div key={ya.year} className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <div className="text-lg font-semibold text-gray-900">{ya.year}</div>
                    <div className="text-3xl font-bold text-green-600 mt-2">{ya.average}</div>
                    <div className="text-sm text-gray-600 mt-1">Average Score</div>
                    <div className="mt-3 flex gap-2 text-xs">
                      {Object.entries(ya.quarters).map(([q, score]) => (
                        <div key={q} className="flex-1 text-center p-1 bg-white rounded">
                          <div className="font-medium">{q}</div>
                          <div className="text-blue-600 font-bold">{score}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing History */}
          {billingData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">Billing History</h3>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={billingChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#9333ea" name="Billed Amount" />
                </BarChart>
              </ResponsiveContainer>

              {/* Billing Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Month</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Currency</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingData.slice(0, 12).map(bill => (
                      <tr key={bill.id} className="border-t">
                        <td className="px-4 py-2 text-sm">
                          {new Date(bill.billingMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-semibold">
                          {bill.billedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-sm">{bill.currency}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{bill.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Historical Comments */}
          {satisfactionData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                <h3 className="text-xl font-bold text-gray-900">Historical Comments</h3>
              </div>

              <div className="space-y-3">
                {satisfactionData
                  .filter(s => s.comments)
                  .sort((a, b) => b.year - a.year || b.quarter - a.quarter)
                  .map(score => (
                    <div key={`${score.year}-Q${score.quarter}`} className="p-4 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">Q{score.quarter} {score.year}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                          Score: {score.score}
                        </span>
                      </div>
                      <p className="text-gray-700">{score.comments}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-lg">
            Select an account to view analytics and historical data
          </div>
        </div>
      )}

      {/* Historical Data Section - Uses same filters as account analytics above */}
      <div className="mt-8">
        <HistoricalData
          actionItems={actionItems}
          accounts={accounts}
          statuses={statuses}
          selectedAccount={selectedAccount}
          selectedYear={selectedYear}
        />
      </div>
    </div>
  );
};

export default AccountsView;
