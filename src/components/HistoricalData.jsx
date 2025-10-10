import React, { useState, useMemo } from 'react';
import { CheckCircle, Calendar, User, Filter, Clock, FileText } from 'lucide-react';

const HistoricalData = ({ actionItems, accounts, statuses }) => {
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Generate available years
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2024; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years;
  }, []);

  // Get completed action items
  const completedActionItems = useMemo(() => {
    return actionItems
      .filter(item => {
        if (!item.completed) return false;
        if (!item.completedAt) return false;

        const completedDate = new Date(item.completedAt);
        if (completedDate.getFullYear() !== filterYear) return false;

        if (filterAccount !== 'all' && item.accountId !== filterAccount) return false;

        return true;
      })
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  }, [actionItems, filterAccount, filterYear]);

  // Get historical notes (all notes from statuses)
  const historicalNotes = useMemo(() => {
    return statuses
      .filter(status => {
        if (!status.notes || status.notes.trim() === '') return false;

        const statusDate = new Date(status.week);
        if (statusDate.getFullYear() !== filterYear) return false;

        if (filterAccount !== 'all' && status.accountId !== filterAccount) return false;

        return true;
      })
      .sort((a, b) => new Date(b.week) - new Date(a.week));
  }, [statuses, filterAccount, filterYear]);

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Historical Data</h2>
        <p className="text-gray-600">View all completed action items and historical notes</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-2" />
              Account
            </label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Year
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Completed Action Items */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Completed Action Items ({completedActionItems.length})
          </h3>
        </div>
        <div className="p-6">
          {completedActionItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No completed action items found for selected filters</p>
          ) : (
            <div className="space-y-4">
              {completedActionItems.map(item => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{getAccountName(item.accountId)}</span>
                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{item.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Created by: {item.createdByUserName || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Resolved by: {item.completedByUserName || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Resolved: {new Date(item.completedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historical Notes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Historical Notes ({historicalNotes.length})
          </h3>
        </div>
        <div className="p-6">
          {historicalNotes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No historical notes found for selected filters</p>
          ) : (
            <div className="space-y-4">
              {historicalNotes.map((status, idx) => (
                <div key={`${status.accountId}-${status.week}-${idx}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{getAccountName(status.accountId)}</span>
                        <span className="text-sm text-gray-500">
                          Week of {new Date(status.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2 whitespace-pre-wrap">{status.notes}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>By: {status.createdByUserName || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricalData;
