import React, { useState, useMemo } from 'react';
import { Users, TrendingUp, Building2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

const ManagerSummary = ({ accounts, managers, statuses, satisfactionScores }) => {
  const [expandedManagers, setExpandedManagers] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Generate available years
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2024; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years;
  }, []);

  // Group accounts by manager with statistics
  const managerGroups = useMemo(() => {
    const groups = {};

    managers.forEach(manager => {
      groups[manager.id] = {
        manager: manager,
        accounts: [],
        totalPeople: 0,
        accountCount: 0,
        averageSatisfaction: 0,
        healthyCount: 0,
        attentionCount: 0,
        criticalCount: 0
      };
    });

    // Add unassigned group
    groups['unassigned'] = {
      manager: { id: 'unassigned', name: 'Unassigned' },
      accounts: [],
      totalPeople: 0,
      accountCount: 0,
      averageSatisfaction: 0,
      healthyCount: 0,
      attentionCount: 0,
      criticalCount: 0
    };

    accounts.forEach(account => {
      const managerId = account.managerId || 'unassigned';
      if (!groups[managerId]) return;

      groups[managerId].accounts.push(account);
      groups[managerId].accountCount++;

      // Filter statuses for selected month and year
      const accountStatuses = statuses.filter(s => {
        if (s.accountId !== account.id) return false;
        const statusDate = new Date(s.week);
        return statusDate.getFullYear() === selectedYear &&
               statusDate.getMonth() + 1 === selectedMonth;
      });

      if (accountStatuses.length > 0) {
        const latestStatus = accountStatuses.reduce((latest, current) =>
          current.week > latest.week ? current : latest
        );
        groups[managerId].totalPeople += latestStatus.people || 0;

        // Count health status
        if (latestStatus.status === 'healthy') groups[managerId].healthyCount++;
        else if (latestStatus.status === 'attention') groups[managerId].attentionCount++;
        else if (latestStatus.status === 'critical') groups[managerId].criticalCount++;
      }

      // Calculate average satisfaction for this account (filter by year)
      const accountScores = satisfactionScores.filter(s =>
        s.accountId === account.id && s.year === selectedYear
      );
      if (accountScores.length > 0) {
        const avgScore = accountScores.reduce((sum, s) => sum + s.score, 0) / accountScores.length;
        groups[managerId].averageSatisfaction += avgScore;
        // Track how many accounts have scores
        if (!groups[managerId].accountsWithScores) {
          groups[managerId].accountsWithScores = 0;
        }
        groups[managerId].accountsWithScores++;
      }
    });

    // Calculate final averages - only divide by accounts that have scores
    Object.values(groups).forEach(group => {
      if (group.accountsWithScores > 0) {
        group.averageSatisfaction = (group.averageSatisfaction / group.accountsWithScores).toFixed(1);
      } else {
        group.averageSatisfaction = 0;
      }
    });

    // Filter out empty groups and sort by name
    return Object.values(groups)
      .filter(g => g.accountCount > 0)
      .sort((a, b) => a.manager.name.localeCompare(b.manager.name));
  }, [accounts, managers, statuses, satisfactionScores, selectedYear, selectedMonth]);

  const toggleManager = (managerId) => {
    setExpandedManagers(prev => ({
      ...prev,
      [managerId]: !prev[managerId]
    }));
  };

  const getHealthColor = (healthyCount, attentionCount, criticalCount) => {
    if (criticalCount > 0) return 'border-red-500';
    if (attentionCount > 0) return 'border-yellow-500';
    return 'border-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Manager Summary</h2>
        <p className="text-gray-600">Overview of delivery managers and their account portfolios</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Year
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value={1}>January</option>
              <option value={2}>February</option>
              <option value={3}>March</option>
              <option value={4}>April</option>
              <option value={5}>May</option>
              <option value={6}>June</option>
              <option value={7}>July</option>
              <option value={8}>August</option>
              <option value={9}>September</option>
              <option value={10}>October</option>
              <option value={11}>November</option>
              <option value={12}>December</option>
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
              <div className="text-sm text-gray-600">Total Managers</div>
              <div className="text-2xl font-bold text-gray-900">{managerGroups.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-sm text-gray-600">Total Accounts</div>
              <div className="text-2xl font-bold text-gray-900">
                {managerGroups.reduce((sum, g) => sum + g.accountCount, 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-sm text-gray-600">Total People</div>
              <div className="text-2xl font-bold text-gray-900">
                {managerGroups.reduce((sum, g) => sum + g.totalPeople, 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div>
              <div className="text-sm text-gray-600">Avg Satisfaction</div>
              <div className="text-2xl font-bold text-gray-900">
                {(() => {
                  const groupsWithScores = managerGroups.filter(g => parseFloat(g.averageSatisfaction || 0) > 0);
                  return groupsWithScores.length > 0
                    ? (groupsWithScores.reduce((sum, g) => sum + parseFloat(g.averageSatisfaction || 0), 0) / groupsWithScores.length).toFixed(1)
                    : '0.0';
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manager Cards */}
      <div className="space-y-4">
        {managerGroups.map(group => {
          const isExpanded = expandedManagers[group.manager.id];
          const borderColor = getHealthColor(group.healthyCount, group.attentionCount, group.criticalCount);

          return (
            <div key={group.manager.id} className={`bg-white rounded-lg shadow border-l-4 ${borderColor}`}>
              {/* Manager Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleManager(group.manager.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {group.manager.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{group.manager.name}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        {group.accountCount} account{group.accountCount !== 1 ? 's' : ''} · {group.totalPeople} people
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Status Indicators */}
                    <div className="flex gap-4">
                      {group.healthyCount > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{group.healthyCount}</div>
                          <div className="text-xs text-gray-600">Healthy</div>
                        </div>
                      )}
                      {group.attentionCount > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{group.attentionCount}</div>
                          <div className="text-xs text-gray-600">Attention</div>
                        </div>
                      )}
                      {group.criticalCount > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{group.criticalCount}</div>
                          <div className="text-xs text-gray-600">Critical</div>
                        </div>
                      )}
                    </div>

                    {/* Average Satisfaction */}
                    {group.averageSatisfaction > 0 && (
                      <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{group.averageSatisfaction}</div>
                        <div className="text-xs text-gray-600">Avg Score</div>
                      </div>
                    )}

                    {/* Expand/Collapse Icon */}
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Account List */}
              {isExpanded && (
                <div className="px-6 pb-6 border-t">
                  <div className="mt-4 space-y-3">
                    {group.accounts.map(account => {
                      // Get latest status for this account
                      const accountStatuses = statuses.filter(s => s.accountId === account.id);
                      const latestStatus = accountStatuses.length > 0
                        ? accountStatuses.reduce((latest, current) =>
                            current.week > latest.week ? current : latest
                          )
                        : null;

                      // Get latest satisfaction score
                      const accountScores = satisfactionScores.filter(s => s.accountId === account.id);
                      const latestScore = accountScores.length > 0
                        ? accountScores.reduce((latest, current) =>
                            current.year > latest.year || (current.year === latest.year && current.quarter > latest.quarter)
                              ? current
                              : latest
                          )
                        : null;

                      const statusColors = {
                        healthy: 'bg-green-100 text-green-800 border-green-300',
                        attention: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                        critical: 'bg-red-100 text-red-800 border-red-300'
                      };

                      return (
                        <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{account.name}</div>
                            {account.primaryLanguage && (
                              <div className="text-sm text-gray-600 mt-1">
                                Tech: {account.primaryLanguage}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            {/* People Count */}
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                {latestStatus?.people || 0}
                              </div>
                              <div className="text-xs text-gray-600">People</div>
                            </div>

                            {/* Status Badge */}
                            {latestStatus && (
                              <div className={`px-3 py-1 rounded-full border ${statusColors[latestStatus.status]} text-sm font-medium`}>
                                {latestStatus.status.charAt(0).toUpperCase() + latestStatus.status.slice(1)}
                              </div>
                            )}

                            {/* Latest Satisfaction Score */}
                            {latestScore && (
                              <div className="text-center px-3 py-1 bg-blue-100 rounded-lg">
                                <div className="text-lg font-bold text-blue-600">{latestScore.score}</div>
                                <div className="text-xs text-gray-600">Q{latestScore.quarter} {latestScore.year}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ManagerSummary;
