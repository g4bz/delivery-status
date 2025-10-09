import React, { useState, useMemo } from 'react';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

const AccountAnalytics = ({ accounts, statuses, billing }) => {
  const [viewPeriod, setViewPeriod] = useState('6months'); // year, quarter, 6months
  const [selectedAccount, setSelectedAccount] = useState('all');

  // Generate weeks based on view period
  const getWeeksForPeriod = (period) => {
    const today = new Date();
    const weeks = [];
    let startDate;

    switch (period) {
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
        break;
      case '6months':
      default:
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 6);
        break;
    }

    // Find first Monday
    while (startDate.getDay() !== 1) {
      startDate.setDate(startDate.getDate() + 1);
    }

    let currentDate = new Date(startDate);
    while (currentDate <= today) {
      weeks.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return weeks;
  };

  const weeks = useMemo(() => getWeeksForPeriod(viewPeriod), [viewPeriod]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const accountsToAnalyze = selectedAccount === 'all'
      ? accounts
      : accounts.filter(a => a.id === selectedAccount);

    return weeks.map(week => {
      let totalPeople = 0;
      let totalBilled = 0;

      // Get month for billing data
      const weekDate = new Date(week);
      const monthStr = `${weekDate.getFullYear()}-${String(weekDate.getMonth() + 1).padStart(2, '0')}-01`;

      accountsToAnalyze.forEach(account => {
        // Find status for this week or carry forward
        let weekData = statuses.find(s => s.accountId === account.id && s.week === week);

        if (!weekData) {
          // Carry forward from previous weeks
          const previousWeeks = weeks.slice(0, weeks.indexOf(week));
          for (let i = previousWeeks.length - 1; i >= 0; i--) {
            const prevStatus = statuses.find(s => s.accountId === account.id && s.week === previousWeeks[i]);
            if (prevStatus) {
              weekData = prevStatus;
              break;
            }
          }
        }

        if (weekData) {
          totalPeople += weekData.people || 0;
        }

        // Get billing for this month
        const billingRecord = billing.find(b => b.accountId === account.id && b.billingMonth === monthStr);
        if (billingRecord) {
          totalBilled += billingRecord.billedAmount || 0;
        } else {
          // Carry forward from previous month if not set
          const prevMonthDate = new Date(weekDate);
          prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
          const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
          const prevBilling = billing.find(b => b.accountId === account.id && b.billingMonth === prevMonthStr);
          if (prevBilling) {
            totalBilled += prevBilling.billedAmount || 0;
          }
        }
      });

      return {
        week,
        weekLabel: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        people: totalPeople,
        billed: totalBilled
      };
    });
  }, [weeks, accounts, statuses, billing, selectedAccount]);

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
              <div className="text-sm text-gray-600">Avg Billed/Week</div>
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
              <div className="text-sm text-gray-600">Total Billed</div>
              <div className="text-2xl font-bold text-gray-900">${totals.billed.toFixed(2)}</div>
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
            People Per Week
          </h3>
          <div className="space-y-2">
            {analyticsData.map((data, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-600 font-medium">{data.weekLabel}</div>
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
            Billed Amount Per Week
          </h3>
          <div className="space-y-2">
            {analyticsData.map((data, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-600 font-medium">{data.weekLabel}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${(data.billed / maxBilled) * 100}%` }}
                  >
                    {data.billed > 0 && (
                      <span className="text-xs font-semibold text-white">${data.billed.toFixed(0)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountAnalytics;
