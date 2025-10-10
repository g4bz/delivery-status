import React, { useState, useMemo } from 'react';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

const AccountAnalytics = ({ accounts, statuses, billing }) => {
  const [viewPeriod, setViewPeriod] = useState('quarter'); // year, quarter, 6months
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Calculate current quarter
  const getCurrentQuarter = () => {
    const currentMonth = new Date().getMonth();
    return `Q${Math.floor(currentMonth / 3) + 1}`;
  };

  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());

  // Generate available years (from 2024 to current year + 1)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2024; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years;
  }, []);

  // Generate months based on view period
  const getMonthsForPeriod = (period, year, quarter) => {
    const months = [];

    switch (period) {
      case 'year':
        // All 12 months of selected year
        for (let month = 0; month < 12; month++) {
          months.push(`${year}-${String(month + 1).padStart(2, '0')}-01`);
        }
        break;
      case 'quarter':
        // 3 months based on selected quarter
        const quarterMonth = (parseInt(quarter.substring(1)) - 1) * 3;
        for (let i = 0; i < 3; i++) {
          months.push(`${year}-${String(quarterMonth + i + 1).padStart(2, '0')}-01`);
        }
        break;
      case '6months':
      default:
        // Last 6 months from current date
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
          months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
        }
        break;
    }

    return months;
  };

  const months = useMemo(() => getMonthsForPeriod(viewPeriod, selectedYear, selectedQuarter), [viewPeriod, selectedYear, selectedQuarter]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const accountsToAnalyze = selectedAccount === 'all'
      ? accounts
      : accounts.filter(a => a.id === selectedAccount);

    return months.map(monthStr => {
      let totalPeople = 0;
      let totalBilled = 0;
      const monthDate = new Date(monthStr);

      accountsToAnalyze.forEach(account => {
        // Get average people count for the month from weekly statuses
        const monthWeekStatuses = statuses.filter(s => {
          if (s.accountId !== account.id) return false;
          const statusDate = new Date(s.week);
          return statusDate.getFullYear() === monthDate.getFullYear() &&
                 statusDate.getMonth() === monthDate.getMonth();
        });

        if (monthWeekStatuses.length > 0) {
          const avgPeople = monthWeekStatuses.reduce((sum, s) => sum + (s.people || 0), 0) / monthWeekStatuses.length;
          totalPeople += avgPeople;
        }

        // Get billing for this month
        const billingRecord = billing.find(b => b.accountId === account.id && b.billingMonth === monthStr);
        if (billingRecord) {
          totalBilled += billingRecord.billedAmount || 0;
        } else {
          // Carry forward from previous month if not set
          const prevMonthDate = new Date(monthDate);
          prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
          const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
          const prevBilling = billing.find(b => b.accountId === account.id && b.billingMonth === prevMonthStr);
          if (prevBilling) {
            totalBilled += prevBilling.billedAmount || 0;
          }
        }
      });

      return {
        month: monthStr,
        monthLabel: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        people: Math.round(totalPeople),
        billed: totalBilled
      };
    });
  }, [months, accounts, statuses, billing, selectedAccount]);

  // Calculate max values for scaling
  const maxPeople = Math.max(...analyticsData.map(d => d.people), 1);
  const maxBilled = Math.max(...analyticsData.map(d => d.billed), 1);

  // Calculate totals and averages
  const totals = analyticsData.reduce((acc, data) => ({
    people: acc.people + data.people,
    billed: acc.billed + data.billed
  }), { people: 0, billed: 0 });

  const averages = {
    people: (totals.people / analyticsData.length).toFixed(1),
    billed: (totals.billed / analyticsData.length).toFixed(2)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Analytics</h2>
        <p className="text-gray-600">Visualize people and billing trends across time periods</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewPeriod('6months')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  viewPeriod === '6months'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                6 Months
              </button>
              <button
                onClick={() => setViewPeriod('quarter')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  viewPeriod === 'quarter'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Quarter
              </button>
              <button
                onClick={() => setViewPeriod('year')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  viewPeriod === 'year'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Year
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Year and Quarter Selectors */}
        {(viewPeriod === 'year' || viewPeriod === 'quarter') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {viewPeriod === 'quarter' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quarter</label>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Q1">Q1 (Jan-Mar)</option>
                  <option value="Q2">Q2 (Apr-Jun)</option>
                  <option value="Q3">Q3 (Jul-Sep)</option>
                  <option value="Q4">Q4 (Oct-Dec)</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">Avg People/Week</div>
              <div className="text-2xl font-bold text-gray-900">{averages.people}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-sm text-gray-600">Avg Billed/Month</div>
              <div className="text-2xl font-bold text-gray-900">${parseFloat(averages.billed).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-sm text-gray-600">Total People</div>
              <div className="text-2xl font-bold text-gray-900">{totals.people}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-orange-600" />
            <div>
              <div className="text-sm text-gray-600">Total Billed/Month</div>
              <div className="text-2xl font-bold text-gray-900">${totals.billed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* People Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            People Per Month
          </h3>
          <div className="space-y-2">
            {analyticsData.map((data, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-24 text-xs text-gray-600 font-medium">{data.monthLabel}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${(data.people / maxPeople) * 100}%` }}
                  >
                    {data.people > 0 && (
                      <span className="text-xs font-semibold text-white">{data.people}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Money Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Billed Amount Per Month
          </h3>
          <div className="space-y-2">
            {analyticsData.map((data, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-24 text-xs text-gray-600 font-medium">{data.monthLabel}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${(data.billed / maxBilled) * 100}%` }}
                  >
                    {data.billed > 0 && (
                      <span className="text-xs font-semibold text-white">${data.billed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Combined Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          People vs Billing Comparison
        </h3>
        <div className="space-y-4">
          {analyticsData.map((data, idx) => (
            <div key={idx} className="space-y-2">
              <div className="text-sm font-medium text-gray-700">{data.monthLabel}</div>
              <div className="grid grid-cols-2 gap-4">
                {/* People Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>People</span>
                    <span className="font-semibold">{data.people}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(data.people / maxPeople) * 100}%` }}
                    />
                  </div>
                </div>
                {/* Billing Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Billing</span>
                    <span className="font-semibold">${data.billed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(data.billed / maxBilled) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountAnalytics;
