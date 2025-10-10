import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';

const YearComparison = ({ accounts, statuses, billing }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYears, setSelectedYears] = useState([currentYear, currentYear - 1]);
  const [selectedAccountId, setSelectedAccountId] = useState('all');

  // Generate available years (from 2024 to 2030)
  const availableYears = useMemo(() => {
    const years = [];
    for (let year = 2024; year <= 2030; year++) {
      years.push(year);
    }
    return years;
  }, []);

  // Toggle year selection
  const toggleYear = (year) => {
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) {
        setSelectedYears(selectedYears.filter(y => y !== year));
      }
    } else {
      setSelectedYears([...selectedYears, year].sort((a, b) => b - a));
    }
  };

  // Generate month labels
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Calculate billing by month for each year
  const billingByMonth = useMemo(() => {
    const data = months.map((month, index) => {
      const monthData = { month };

      selectedYears.forEach(year => {
        const monthStr = `${year}-${String(index + 1).padStart(2, '0')}-01`;
        const monthBilling = billing
          .filter(b => {
            const matchesMonth = b.billingMonth === monthStr;
            const matchesAccount = selectedAccountId === 'all' || b.accountId === selectedAccountId;
            return matchesMonth && matchesAccount;
          })
          .reduce((sum, b) => sum + (b.billedAmount || 0), 0);

        monthData[`${year}`] = monthBilling;
      });

      return monthData;
    });

    return data;
  }, [selectedYears, billing, months, selectedAccountId]);

  // Calculate people count by month for each year
  const peopleByMonth = useMemo(() => {
    const data = months.map((month, index) => {
      const monthData = { month };

      selectedYears.forEach(year => {
        const monthStr = `${year}-${String(index + 1).padStart(2, '0')}`;

        // Get all statuses for this month, filtered by account
        const monthStatuses = statuses.filter(s => {
          const statusMonth = s.week.substring(0, 7); // YYYY-MM format
          const matchesMonth = statusMonth === monthStr;
          const matchesAccount = selectedAccountId === 'all' || s.accountId === selectedAccountId;
          return matchesMonth && matchesAccount;
        });

        // Get the latest status for each account in this month
        const accountLatestStatuses = {};
        monthStatuses.forEach(status => {
          if (!accountLatestStatuses[status.accountId] ||
              status.week > accountLatestStatuses[status.accountId].week) {
            accountLatestStatuses[status.accountId] = status;
          }
        });

        const totalPeople = Object.values(accountLatestStatuses)
          .reduce((sum, s) => sum + (s.people || 0), 0);

        monthData[`${year}`] = totalPeople;
      });

      return monthData;
    });

    return data;
  }, [selectedYears, statuses, months, selectedAccountId]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const stats = {};

    selectedYears.forEach(year => {
      const yearBilling = billingByMonth.reduce((sum, m) => sum + (m[`${year}`] || 0), 0);
      const yearPeopleAvg = peopleByMonth.reduce((sum, m) => sum + (m[`${year}`] || 0), 0) / 12;

      stats[year] = {
        totalBilling: yearBilling,
        avgPeople: Math.round(yearPeopleAvg)
      };
    });

    return stats;
  }, [selectedYears, billingByMonth, peopleByMonth]);

  // Color palette for different years
  const yearColors = {
    2024: '#10b981',  // green
    2025: '#3b82f6',  // blue
    2026: '#f59e0b',  // orange
    2027: '#8b5cf6',  // purple
    2028: '#ef4444',  // red
    2029: '#06b6d4',  // cyan
    2030: '#ec4899',  // pink
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Year-over-Year Comparison</h2>
        <p className="text-gray-600">Compare billing, people count, and trends across multiple years</p>
      </div>

      {/* Year Selector and Account Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Select Years to Compare</h3>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => toggleYear(year)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedYears.includes(year)
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Select at least 1 year to compare. Currently comparing: {selectedYears.join(', ')}
        </p>

        {/* Account Filter */}
        <div className="border-t pt-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Filter by Account
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedYears.map(year => (
          <div
            key={year}
            className="bg-white rounded-lg shadow p-6 border-l-4"
            style={{ borderColor: yearColors[year] || '#6b7280' }}
          >
            <div className="text-lg font-bold text-gray-900 mb-3">{year}</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Billing:</span>
                <span className="text-lg font-semibold text-emerald-600">
                  ${summaryStats[year]?.totalBilling.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg People:</span>
                <span className="text-lg font-semibold text-blue-600">
                  {summaryStats[year]?.avgPeople}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Billing Comparison Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-bold text-gray-900">Monthly Billing Comparison</h3>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={billingByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
            />
            <Legend />
            {selectedYears.map(year => (
              <Line
                key={year}
                type="monotone"
                dataKey={`${year}`}
                stroke={yearColors[year] || '#6b7280'}
                strokeWidth={3}
                name={`${year}`}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* People Count Comparison Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Monthly People Count Comparison</h3>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={peopleByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedYears.map(year => (
              <Line
                key={year}
                type="monotone"
                dataKey={`${year}`}
                stroke={yearColors[year] || '#6b7280'}
                strokeWidth={3}
                name={`${year}`}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Side-by-Side Bar Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900">Billing - Side by Side Comparison</h3>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={billingByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
            />
            <Legend />
            {selectedYears.map(year => (
              <Bar
                key={year}
                dataKey={`${year}`}
                fill={yearColors[year] || '#6b7280'}
                name={`${year}`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* People Count Bar Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-orange-600" />
          <h3 className="text-xl font-bold text-gray-900">People Count - Side by Side Comparison</h3>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={peopleByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedYears.map(year => (
              <Bar
                key={year}
                dataKey={`${year}`}
                fill={yearColors[year] || '#6b7280'}
                name={`${year}`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default YearComparison;
