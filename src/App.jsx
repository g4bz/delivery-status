import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit2, CheckCircle, AlertCircle, XCircle, MessageSquare, ChevronDown, ChevronRight, Download, Save, LogOut, Bell, LayoutDashboard, TrendingUp, Users, Trash2, BarChart3, ChevronLeft } from 'lucide-react';
import * as supabaseService from './supabase/supabaseService';
import * as authService from './supabase/authService';
import LoginPage from './components/LoginPage';
import AccountsView from './components/AccountsView';
import ManagerSummary from './components/ManagerSummary';
import AccountAnalytics from './components/AccountAnalytics';
import YearComparison from './components/YearComparison';

// ============================================================================
// CONSTANTS
// ============================================================================
const CONSTANTS = {
  STATUS: {
    HEALTHY: 'healthy',
    ATTENTION: 'attention',
    CRITICAL: 'critical'
  },
  PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  },
  VIEW_MODE: {
    MONTH: 'month',
    QUARTER: 'quarter'
  },
  QUARTERS: ['Q1', 'Q2', 'Q3', 'Q4']
};

// ============================================================================
// UTILITIES
// ============================================================================
const dateUtils = {
  getCurrentMonday() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  },

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  },

  getCurrentQuarter() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    return `Q${quarter}-${now.getFullYear()}`;
  },

  generateWeeksForMonth(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const weeks = [];
    let currentMonday = new Date(firstDay);

    while (currentMonday.getDay() !== 1) {
      currentMonday.setDate(currentMonday.getDate() + 1);
    }

    while (currentMonday <= lastDay) {
      weeks.push(currentMonday.toISOString().split('T')[0]);
      currentMonday.setDate(currentMonday.getDate() + 7);
    }

    return weeks;
  },

  generateWeeksForQuarterGrouped(quarterStr) {
    const [quarter, year] = quarterStr.split('-');
    const yearNum = parseInt(year);
    let startMonth, endMonth;

    switch(quarter) {
      case 'Q1': startMonth = 1; endMonth = 3; break;
      case 'Q2': startMonth = 4; endMonth = 6; break;
      case 'Q3': startMonth = 7; endMonth = 9; break;
      case 'Q4': startMonth = 10; endMonth = 12; break;
      default: startMonth = 1; endMonth = 3;
    }

    const monthsData = [];
    for (let month = startMonth; month <= endMonth; month++) {
      const monthStr = `${yearNum}-${month.toString().padStart(2, '0')}`;
      const weeks = this.generateWeeksForMonth(monthStr);
      monthsData.push({
        month: monthStr,
        monthName: new Date(yearNum, month - 1, 1).toLocaleDateString('en-US', { month: 'long' }),
        weeks
      });
    }

    return monthsData;
  },

  generateWeeksForQuarter(quarterStr) {
    const [quarter, year] = quarterStr.split('-');
    const yearNum = parseInt(year);
    let startMonth, endMonth;

    switch(quarter) {
      case 'Q1': startMonth = 1; endMonth = 3; break;
      case 'Q2': startMonth = 4; endMonth = 6; break;
      case 'Q3': startMonth = 7; endMonth = 9; break;
      case 'Q4': startMonth = 10; endMonth = 12; break;
      default: startMonth = 1; endMonth = 3;
    }

    const weeks = [];
    for (let month = startMonth; month <= endMonth; month++) {
      const monthStr = `${yearNum}-${month.toString().padStart(2, '0')}`;
      weeks.push(...this.generateWeeksForMonth(monthStr));
    }

    return weeks;
  },

  getMonthFromWeek(weekStr) {
    const date = new Date(weekStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  },

  formatWeekDisplay(weekStr) {
    return new Date(weekStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  isCurrentMonth(monthStr) {
    return monthStr === this.getCurrentMonth();
  },

  isPastMonth(monthStr) {
    return monthStr < this.getCurrentMonth();
  }
};

const statusUtils = {
  getStatusColor(status) {
    const colors = {
      healthy: 'bg-green-400',
      attention: 'bg-yellow-400',
      critical: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-200';
  },

  getStatusIcon(status) {
    const icons = {
      healthy: <CheckCircle className="w-4 h-4 text-green-700" />,
      attention: <AlertCircle className="w-4 h-4 text-yellow-700" />,
      critical: <XCircle className="w-4 h-4 text-red-700" />
    };
    return icons[status] || null;
  },

  cycleStatus(currentStatus) {
    const cycle = { healthy: 'attention', attention: 'critical', critical: 'healthy' };
    return cycle[currentStatus] || 'healthy';
  }
};

// Static data removed - now using Supabase PostgreSQL database

// ============================================================================
// CUSTOM HOOKS
// ============================================================================
const useData = () => {
  const [managers, setManagers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [billing, setBilling] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [managersData, accountsData, statusesData, itemsData, billingData] = await Promise.all([
        supabaseService.getManagers(),
        supabaseService.getAccounts(),
        supabaseService.getWeeklyStatuses(),
        supabaseService.getActionItems(),
        supabaseService.getAccountBilling()
      ]);

      setManagers(managersData);
      setAccounts(accountsData);
      setStatuses(statusesData);
      setActionItems(itemsData);
      setBilling(billingData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { managers, accounts, statuses, actionItems, billing, loading, refreshData: loadData };
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
const DeliveryManagerDashboard = () => {
  const { managers, accounts, statuses, actionItems, billing, loading, refreshData } = useData();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [currentMonth, setCurrentMonth] = useState(dateUtils.getCurrentMonth());
  const [viewMode, setViewMode] = useState('month');
  const [selectedQuarter, setSelectedQuarter] = useState(dateUtils.getCurrentQuarter());
  const [expandedAccounts, setExpandedAccounts] = useState({});
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const [expandedWeeklyNotes, setExpandedWeeklyNotes] = useState({});
  const [showModal, setShowModal] = useState(null);
  const [modalData, setModalData] = useState({});
  const [filterManager, setFilterManager] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  // Initialize selectedWeek to null - will be set by useEffect
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [hasInitializedWeek, setHasInitializedWeek] = useState(false);
  const [showEditWeekModal, setShowEditWeekModal] = useState(false);
  const [editWeekData, setEditWeekData] = useState({ accountId: null, week: null, status: 'healthy', people: 0, notes: '' });
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingData, setBillingData] = useState({ accountId: null, month: '', amount: 0 });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [satisfactionScores, setSatisfactionScores] = useState([]);
  const [showAllActionItems, setShowAllActionItems] = useState(false);

  const weeks = useMemo(() => {
    if (viewMode === 'quarter') {
      return dateUtils.generateWeeksForQuarter(selectedQuarter);
    }
    return dateUtils.generateWeeksForMonth(currentMonth);
  }, [currentMonth, selectedQuarter, viewMode]);

  const monthsGrouped = useMemo(() => {
    if (viewMode === 'quarter') {
      return dateUtils.generateWeeksForQuarterGrouped(selectedQuarter);
    }
    return [];
  }, [selectedQuarter, viewMode]);

  // Auto-select current week (containing today) on mount or when weeks change
  useEffect(() => {
    if (weeks.length > 0 && !hasInitializedWeek) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison

      const currentWeek = weeks.find(week => {
        const weekStart = new Date(week + 'T00:00:00'); // Parse as local time
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999); // End of Sunday

        return today >= weekStart && today <= weekEnd;
      });

      // If current week is in the list, select it; otherwise select first week
      setSelectedWeek(currentWeek || weeks[0]);
      setHasInitializedWeek(true);
    } else if (weeks.length > 0 && hasInitializedWeek && !weeks.includes(selectedWeek)) {
      // If user changed month/quarter and selected week is not in new list, find current week again
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const currentWeek = weeks.find(week => {
        const weekStart = new Date(week + 'T00:00:00');
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return today >= weekStart && today <= weekEnd;
      });

      setSelectedWeek(currentWeek || weeks[0]);
    }
  }, [weeks, hasInitializedWeek, selectedWeek]);

  // Initialize collapsed months for past months
  useEffect(() => {
    if (viewMode === 'quarter' && monthsGrouped.length > 0) {
      const initialCollapsed = {};
      monthsGrouped.forEach(monthData => {
        if (dateUtils.isPastMonth(monthData.month)) {
          initialCollapsed[monthData.month] = true;
        }
      });
      setCollapsedMonths(initialCollapsed);
    }
  }, [viewMode, selectedQuarter]);

  const getStatusForWeek = (accountId, week) => {
    const status = statuses.find(s => s.accountId === accountId && s.week === week);
    if (status) {
      return {
        status: status.status,
        people: status.people || 0,
        notes: status.notes || '',
        createdByUserId: status.createdByUserId,
        createdByUserName: status.createdByUserName,
        billedAmount: status.billedAmount || 0
      };
    }

    // Auto-carry forward status, people count and billed amount from previous week in same month
    const allWeeks = weeks;
    const weekIndex = allWeeks.indexOf(week);
    const currentMonth = dateUtils.getMonthFromWeek(week);

    if (weekIndex > 0) {
      // Look for the most recent previous week with data in the same month
      for (let i = weekIndex - 1; i >= 0; i--) {
        const prevWeek = allWeeks[i];
        const prevMonth = dateUtils.getMonthFromWeek(prevWeek);

        // Only carry forward within the same month
        if (prevMonth !== currentMonth) break;

        const prevStatus = statuses.find(s => s.accountId === accountId && s.week === prevWeek);
        if (prevStatus && (prevStatus.people > 0 || prevStatus.billedAmount > 0 || prevStatus.status !== 'healthy')) {
          return {
            status: prevStatus.status || 'healthy',
            people: prevStatus.people,
            notes: '',
            billedAmount: prevStatus.billedAmount || 0
          };
        }
      }
    }

    return { status: 'healthy', people: 0, notes: '', billedAmount: 0 };
  };

  const enrichedAccounts = useMemo(() => {
    // Determine the year from the selected viewing period
    let displayYear;
    if (selectedWeek) {
      // Get year from selected week
      displayYear = new Date(selectedWeek).getFullYear();
    } else if (viewMode === 'month') {
      // Get year from current month (format: YYYY-MM)
      displayYear = parseInt(currentMonth.split('-')[0]);
    } else if (viewMode === 'quarter') {
      // Get year from selected quarter (format: Q1-YYYY)
      displayYear = parseInt(selectedQuarter.split('-')[1]);
    } else {
      displayYear = new Date().getFullYear();
    }

    return accounts.map(account => {
      const manager = managers.find(m => m.id === account.managerId);
      const accountActions = actionItems.filter(a => a.accountId === account.id);

      // Get satisfaction scores for the display year from satisfaction_scores table
      const displayYearScores = satisfactionScores.filter(s => s.accountId === account.id && s.year === displayYear);

      // Only use satisfaction_scores table data - no fallback to old accounts table data
      const satisfactionScore = {
        Q1: displayYearScores.find(s => s.quarter === 1)?.score ?? null,
        Q2: displayYearScores.find(s => s.quarter === 2)?.score ?? null,
        Q3: displayYearScores.find(s => s.quarter === 3)?.score ?? null,
        Q4: displayYearScores.find(s => s.quarter === 4)?.score ?? null
      };
      const quarterlyComments = {
        Q1: displayYearScores.find(s => s.quarter === 1)?.comments || '',
        Q2: displayYearScores.find(s => s.quarter === 2)?.comments || '',
        Q3: displayYearScores.find(s => s.quarter === 3)?.comments || '',
        Q4: displayYearScores.find(s => s.quarter === 4)?.comments || ''
      };

      return {
        ...account,
        satisfactionScore,
        quarterlyComments,
        displayYear,
        managerName: manager ? manager.name : 'Unassigned',
        actionItems: accountActions
      };
    });
  }, [accounts, managers, actionItems, satisfactionScores, selectedWeek, currentMonth, viewMode, selectedQuarter]);

  const filteredAccounts = useMemo(() => {
    return enrichedAccounts.filter(account => {
      const managerMatch = filterManager === 'All' || account.managerName === filterManager;
      const currentWeekData = selectedWeek ? getStatusForWeek(account.id, selectedWeek) : null;
      const statusMatch = filterStatus === 'All' || (selectedWeek && currentWeekData.status === filterStatus);
      return managerMatch && statusMatch;
    });
  }, [enrichedAccounts, filterManager, filterStatus, selectedWeek, statuses]);

  const sortedAccounts = useMemo(() => {
    if (!sortConfig.key) return filteredAccounts;

    return [...filteredAccounts].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal ? bVal.toLowerCase() : '';
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAccounts, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const summaryStats = useMemo(() => {
    if (!selectedWeek) return { total: 0, healthy: 0, attention: 0, critical: 0, totalPeople: 0, pendingActions: 0 };

    // Calculate stats for the selected week only
    const selectedWeekStatuses = enrichedAccounts.map(account =>
      getStatusForWeek(account.id, selectedWeek)
    );

    // Filter action items for the selected week
    const weekStart = new Date(selectedWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekActionItems = actionItems.filter(item => {
      if (item.completed) return false;
      const dueDate = new Date(item.dueDate);
      return dueDate >= weekStart && dueDate <= weekEnd;
    });

    return {
      total: enrichedAccounts.length,
      healthy: selectedWeekStatuses.filter(s => s.status === 'healthy').length,
      attention: selectedWeekStatuses.filter(s => s.status === 'attention').length,
      critical: selectedWeekStatuses.filter(s => s.status === 'critical').length,
      totalPeople: selectedWeekStatuses.reduce((sum, s) => sum + s.people, 0),
      pendingActions: weekActionItems.length
    };
  }, [enrichedAccounts, selectedWeek, actionItems, statuses]);

  const handleSaveAccount = async () => {
    if (showModal === 'addAccount') {
      await supabaseService.addAccount({
        name: modalData.name,
        managerId: modalData.managerId,
        people: parseInt(modalData.people),
        satisfactionScore: { Q1: null, Q2: null, Q3: null, Q4: null },
        quarterlyComments: { Q1: '', Q2: '', Q3: '', Q4: '' },
        primaryLanguage: modalData.primaryLanguage || null,
        languageStack: modalData.languageStack || []
      });
    } else if (showModal === 'editAccount') {
      // Use the displayYear from modalData (the year being viewed)
      const saveYear = modalData.displayYear || new Date().getFullYear();

      // Update account basic info (without satisfaction scores)
      await supabaseService.updateAccount(modalData.id, {
        name: modalData.name,
        managerId: modalData.managerId,
        people: modalData.people,
        primaryLanguage: modalData.primaryLanguage || null,
        languageStack: modalData.languageStack || []
      });

      // Upsert satisfaction scores for the display year
      const quarters = [1, 2, 3, 4];
      const quarterKeys = ['Q1', 'Q2', 'Q3', 'Q4'];

      for (let i = 0; i < quarters.length; i++) {
        const quarter = quarters[i];
        const quarterKey = quarterKeys[i];
        const score = modalData.satisfactionScore?.[quarterKey];
        const comments = modalData.quarterlyComments?.[quarterKey] || '';

        if (score !== null && score !== undefined && score !== '') {
          await supabaseService.upsertSatisfactionScore(
            modalData.id,
            saveYear,
            quarter,
            parseInt(score),
            comments
          );
        }
      }
    }
    await refreshData();
    // Reload satisfaction scores
    const scores = await supabaseService.getSatisfactionScores();
    setSatisfactionScores(scores);
    setShowModal(null);
  };

  const handleSaveActionItem = async () => {
    await supabaseService.addActionItem({
      accountId: modalData.accountId,
      managerId: modalData.managerId,
      description: modalData.description,
      dueDate: modalData.dueDate,
      priority: modalData.priority,
      completed: false,
      createdDate: new Date().toISOString().split('T')[0],
      createdByUserId: currentUser?.id || null,
      createdByUserName: currentUser?.fullName || currentUser?.username || 'Unknown'
    });
    await refreshData();
    setShowModal(null);
  };

  const handleToggleActionItem = async (itemId) => {
    const item = actionItems.find(i => i.id === itemId);
    if (item) {
      const updates = { completed: !item.completed };

      // If marking as completed, add user and timestamp info
      if (!item.completed) {
        updates.completedByUserId = currentUser?.id || null;
        updates.completedByUserName = currentUser?.fullName || currentUser?.username || 'Unknown';
        updates.completedAt = new Date().toISOString();
      } else {
        // If uncompleting, clear the completion info
        updates.completedByUserId = null;
        updates.completedByUserName = null;
        updates.completedAt = null;
      }

      await supabaseService.updateActionItem(itemId, updates);
      await refreshData();
    }
  };

  const handleUpdateWeekStatus = async (accountId, week, status, people, notes = '') => {
    await supabaseService.updateWeeklyStatus(
      accountId,
      week,
      status,
      people,
      notes,
      currentUser?.id || null,
      currentUser?.fullName || currentUser?.username || 'Unknown'
    );
    await refreshData();
  };

  const handleSaveWeekEdit = async () => {
    // Update current week
    await handleUpdateWeekStatus(editWeekData.accountId, editWeekData.week, editWeekData.status, editWeekData.people, editWeekData.notes);

    // Update ALL subsequent weeks in the same month (override any existing data)
    const allWeeks = weeks;
    const weekIndex = allWeeks.indexOf(editWeekData.week);
    const currentMonth = dateUtils.getMonthFromWeek(editWeekData.week);

    if (weekIndex >= 0 && weekIndex < allWeeks.length - 1) {
      for (let i = weekIndex + 1; i < allWeeks.length; i++) {
        const nextWeek = allWeeks[i];
        const nextMonth = dateUtils.getMonthFromWeek(nextWeek);

        // Stop if we've moved to a different month
        if (nextMonth !== currentMonth) break;

        // Get existing notes for the next week to preserve them
        const existingStatus = statuses.find(s => s.accountId === editWeekData.accountId && s.week === nextWeek);
        const nextWeekNotes = existingStatus ? existingStatus.notes : '';

        // Always update the status and people count, preserving only the notes
        await handleUpdateWeekStatus(editWeekData.accountId, nextWeek, editWeekData.status, editWeekData.people, nextWeekNotes);
      }
    }

    setShowEditWeekModal(false);
  };

  const openEditWeekModal = (accountId, week) => {
    const weekData = getStatusForWeek(accountId, week);
    setEditWeekData({ accountId, week, status: weekData.status, people: weekData.people, notes: weekData.notes || '' });
    setShowEditWeekModal(true);
  };

  const handleToggleStatus = async (e, accountId, week) => {
    e.stopPropagation(); // Prevent modal from opening
    const weekData = getStatusForWeek(accountId, week);
    const newStatus = statusUtils.cycleStatus(weekData.status);

    // Update current week
    await handleUpdateWeekStatus(accountId, week, newStatus, weekData.people, weekData.notes);

    // Update ALL subsequent weeks in the same month (override any existing data)
    const allWeeks = weeks;
    const weekIndex = allWeeks.indexOf(week);
    const currentMonth = dateUtils.getMonthFromWeek(week);

    if (weekIndex >= 0 && weekIndex < allWeeks.length - 1) {
      for (let i = weekIndex + 1; i < allWeeks.length; i++) {
        const nextWeek = allWeeks[i];
        const nextMonth = dateUtils.getMonthFromWeek(nextWeek);

        // Stop if we've moved to a different month
        if (nextMonth !== currentMonth) break;

        // Get existing data for the next week to preserve people count and notes
        const existingStatus = statuses.find(s => s.accountId === accountId && s.week === nextWeek);
        const nextWeekPeople = existingStatus ? existingStatus.people : weekData.people;
        const nextWeekNotes = existingStatus ? existingStatus.notes : '';

        // Always update the status, even if explicit data exists
        await handleUpdateWeekStatus(accountId, nextWeek, newStatus, nextWeekPeople, nextWeekNotes);
      }
    }
  };

  const handleDeleteWeekNote = async (accountId, week) => {
    if (window.confirm('Are you sure you want to delete this note? This will remove the entire weekly status entry.')) {
      await supabaseService.deleteWeeklyStatus(accountId, week);
      await refreshData();
    }
  };

  // Get billing amount for a specific month
  const getBillingForMonth = (accountId, monthStr) => {
    const billingMonth = `${monthStr}-01`; // Format: YYYY-MM-01
    const billingRecord = billing.find(b => b.accountId === accountId && b.billingMonth === billingMonth);
    return billingRecord ? billingRecord.billedAmount : 0;
  };

  // Open billing modal for a specific month
  const openBillingModal = (accountId, monthStr) => {
    const amount = getBillingForMonth(accountId, monthStr);
    setBillingData({ accountId, month: monthStr, amount });
    setShowBillingModal(true);
  };

  // Save billing data
  const handleSaveBilling = async () => {
    const billingMonth = `${billingData.month}-01`;
    await supabaseService.upsertBilling(billingData.accountId, billingMonth, billingData.amount);
    await refreshData();
    setShowBillingModal(false);
  };

  const exportData = () => {
    const data = JSON.stringify({ managers, accounts, statuses, actionItems }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-data-${currentMonth}.json`;
    a.click();
  };

  // Check authentication on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setIsAuthChecking(false);
  }, []);

  // Load satisfaction scores on mount
  useEffect(() => {
    const loadSatisfactionScores = async () => {
      try {
        const scores = await supabaseService.getSatisfactionScores();
        setSatisfactionScores(scores);
      } catch (error) {
        console.error('Error loading satisfaction scores:', error);
      }
    };
    loadSatisfactionScores();
  }, []);

  // Auto-select current week on mount
  useEffect(() => {
    if (weeks.length > 0 && !selectedWeek) {
      const currentMonday = dateUtils.getCurrentMonday();
      // Try to find current week in the list
      const currentWeekInList = weeks.find(w => w === currentMonday);
      if (currentWeekInList) {
        setSelectedWeek(currentWeekInList);
      } else {
        // If current week not in list, select the closest one (last week in list)
        setSelectedWeek(weeks[weeks.length - 1]);
      }
    }
  }, [weeks]);

  // Handle login
  const handleLogin = async (username, password) => {
    const user = await authService.login(username, password);
    setCurrentUser(user);
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // Get notifications for action items
  const getActionNotifications = () => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = selectedWeek;
    const weekEnd = new Date(selectedWeek);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    return actionItems.filter(item => {
      if (item.completed) return false;
      const dueDate = item.dueDate;
      // Due today or within the selected week
      return dueDate === today || (dueDate >= weekStart && dueDate <= weekEndStr);
    });
  };

  const notifications = useMemo(() => getActionNotifications(), [actionItems, selectedWeek]);

  // Check if account has notifications
  const hasNotifications = (accountId) => {
    return notifications.some(n => n.accountId === accountId);
  };

  // Check if a week has any action items due
  const weekHasActionItems = (week) => {
    const weekStart = new Date(week);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return actionItems.some(item => {
      if (item.completed) return false;
      const dueDate = new Date(item.dueDate);
      return dueDate >= weekStart && dueDate <= weekEnd;
    });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  // Navigate to previous quarter
  const goToPreviousQuarter = () => {
    const [quarter, year] = selectedQuarter.split('-');
    const quarterNum = parseInt(quarter.substring(1));
    let newQuarter, newYear;

    if (quarterNum === 1) {
      newQuarter = 'Q4';
      newYear = parseInt(year) - 1;
    } else {
      newQuarter = `Q${quarterNum - 1}`;
      newYear = parseInt(year);
    }

    setSelectedQuarter(`${newQuarter}-${newYear}`);
  };

  // Navigate to next quarter
  const goToNextQuarter = () => {
    const [quarter, year] = selectedQuarter.split('-');
    const quarterNum = parseInt(quarter.substring(1));
    let newQuarter, newYear;

    if (quarterNum === 4) {
      newQuarter = 'Q1';
      newYear = parseInt(year) + 1;
    } else {
      newQuarter = `Q${quarterNum + 1}`;
      newYear = parseInt(year);
    }

    setSelectedQuarter(`${newQuarter}-${newYear}`);
  };

  // Show login page if not authenticated
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with User Info and Notifications */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <img
                src="/arkus-logo.webp"
                alt="Arkus Nexus"
                className="h-10 object-contain"
              />
              <div className="border-l-2 border-gray-300 pl-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Delivery Management Dashboard</h1>
                <p className="text-gray-600 text-sm">Track account health and team performance</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow border border-gray-200">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{currentUser.fullName || currentUser.username}</div>
                  <div className="text-xs text-gray-500">{currentUser.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4 bg-white rounded-lg shadow p-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
             <button
              onClick={() => setActiveTab('managers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                activeTab === 'managers'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Manager Summary
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                activeTab === 'accounts'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Accounts
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                activeTab === 'comparison'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Year Comparison
            </button>
          </div>
          {activeTab === 'dashboard' && (
            <div className="flex gap-2">
              <button onClick={() => { setModalData({ name: '', managerId: managers[0]?.id || '', people: 1 }); setShowModal('addAccount'); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md transition-all">
                <Plus className="w-4 h-4" />Add Account
              </button>
              <button onClick={() => { setModalData({ accountId: enrichedAccounts[0]?.id || '', managerId: managers[0]?.id || '', description: '', dueDate: '', priority: 'medium' }); setShowModal('addActionItem'); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-md transition-all">
                <Plus className="w-4 h-4" />Add Action
              </button>
              <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 shadow-md transition-all">
                <Download className="w-4 h-4" />Export
              </button>
            </div>
          )}
        </div>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <>
        {/* All Due Action Items Section - Filtered by Selected Week */}
        {(() => {
          // Filter action items by selected week
          const weekStart = selectedWeek ? new Date(selectedWeek) : null;
          const weekEnd = weekStart ? new Date(weekStart) : null;
          if (weekEnd) {
            weekEnd.setDate(weekEnd.getDate() + 6);
          }

          const weekActionItems = actionItems.filter(item => {
            if (item.completed) return false;
            if (!weekStart || !weekEnd) return false;
            const dueDate = new Date(item.dueDate);
            return dueDate >= weekStart && dueDate <= weekEnd;
          });

          return (
            <div className="bg-white rounded-lg shadow mb-6">
              <div
                className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowAllActionItems(!showAllActionItems)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {showAllActionItems ? <ChevronDown className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
                    <MessageSquare className="w-6 h-6 text-orange-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Action Items for Selected Week ({weekActionItems.length})
                    </h3>
                  </div>
                  <span className="text-sm text-gray-600">
                    {selectedWeek ? dateUtils.formatWeekDisplay(selectedWeek) : 'No week selected'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 ml-11">Click to {showAllActionItems ? 'collapse' : 'expand'}</p>
              </div>
              {showAllActionItems && (
                <div className="p-6">
                  {weekActionItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No pending action items for this week</p>
                  ) : (
                    <div className="space-y-3">
                      {weekActionItems
                        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                        .map(item => {
                          const account = accounts.find(a => a.id === item.accountId);
                          const manager = managers.find(m => m.id === item.managerId);
                          const today = new Date().toISOString().split('T')[0];
                          const isDueToday = item.dueDate === today;
                          const isPastDue = item.dueDate < today;
                          const isDueSoon = notifications.some(n => n.id === item.id);

                          return (
                            <div key={item.id} className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
                              isPastDue ? 'bg-red-50 border-red-400' :
                              isDueToday ? 'bg-orange-50 border-orange-400' :
                              isDueSoon ? 'bg-yellow-50 border-yellow-300' :
                              'bg-gray-50 border-gray-200'
                            }`}>
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => handleToggleActionItem(item.id)}
                                className="mt-1 w-5 h-5 text-blue-600 rounded flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-2">
                                  {(isDueToday || isPastDue) && <Bell className="w-5 h-5 text-red-600 animate-pulse flex-shrink-0" />}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                      <span className="text-xs text-gray-700">
                                        <strong>Account:</strong> {account?.name || 'Unknown'}
                                      </span>
                                      <span className="text-xs text-gray-700">
                                        <strong>Manager:</strong> {manager?.name || 'Unknown'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className={`text-xs font-semibold ${
                                    isPastDue ? 'text-red-700 bg-red-100 px-2 py-1 rounded' :
                                    isDueToday ? 'text-orange-700 bg-orange-100 px-2 py-1 rounded' :
                                    'text-gray-600'
                                  }`}>
                                    {isPastDue ? `⚠️ Overdue: ${item.dueDate}` :
                                     isDueToday ? '⚠️ Due Today!' :
                                     `Due: ${item.dueDate}`}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                                    item.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {item.priority}
                                  </span>
                                  {item.createdByUserName && (
                                    <span className="text-xs text-blue-600">
                                      Created by {item.createdByUserName}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    Created: {item.createdDate}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Total Accounts</div>
            <div className="text-2xl font-bold text-gray-900">{summaryStats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm text-green-700 mb-1">Healthy</div>
            <div className="text-2xl font-bold text-green-700">{summaryStats.healthy}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-sm text-yellow-700 mb-1">Attention</div>
            <div className="text-2xl font-bold text-yellow-700">{summaryStats.attention}</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-sm text-red-700 mb-1">Critical</div>
            <div className="text-2xl font-bold text-red-700">{summaryStats.critical}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-sm text-blue-700 mb-1">Total People</div>
            <div className="text-2xl font-bold text-blue-700">{summaryStats.totalPeople}</div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4">
            <div className="text-sm text-purple-700 mb-1">Pending Actions</div>
            <div className="text-2xl font-bold text-purple-700">{summaryStats.pendingActions}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          {/* Quick Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mb-4 pb-4 border-b border-gray-200">
            <button
              onClick={viewMode === 'month' ? goToPreviousMonth : goToPreviousQuarter}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition-all"
              title={viewMode === 'month' ? 'Previous Month' : 'Previous Quarter'}
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            <div className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {viewMode === 'month'
                ? (() => {
                    const [year, month] = currentMonth.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  })()
                : selectedQuarter.split('-').reverse().join(' ')
              }
            </div>
            <button
              onClick={viewMode === 'month' ? goToNextMonth : goToNextQuarter}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition-all"
              title={viewMode === 'month' ? 'Next Month' : 'Next Quarter'}
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
              <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="month">Monthly View</option>
                <option value="quarter">Quarterly View</option>
              </select>
            </div>
            {viewMode === 'month' ? (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <input type="month" value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            ) : (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quarter</label>
                <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="Q1-2025">Q1 2025</option>
                  <option value="Q2-2025">Q2 2025</option>
                  <option value="Q3-2025">Q3 2025</option>
                  <option value="Q4-2025">Q4 2025</option>
                  <option value="Q1-2026">Q1 2026</option>
                </select>
              </div>
            )}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Week</label>
              <select value={selectedWeek || ''} onChange={(e) => setSelectedWeek(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                {weeks.map(week => {
                  const hasItems = weekHasActionItems(week);
                  return (
                    <option key={week} value={week}>
                      {hasItems ? '🔴 ' : ''}{dateUtils.formatWeekDisplay(week)}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
              <select value={filterManager} onChange={(e) => setFilterManager(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="All">All Managers</option>
                {managers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="All">All Status</option>
                <option value="healthy">Healthy</option>
                <option value="attention">Attention</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white sticky top-0 z-10">
                <tr>
                  <th
                    onClick={() => handleSort('managerName')}
                    className="px-4 py-3 text-left text-sm font-semibold sticky left-0 bg-gray-800 z-20 cursor-pointer hover:bg-gray-700 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Manager
                      {sortConfig.key === 'managerName' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="px-4 py-3 text-left text-sm font-semibold sticky left-0 bg-gray-800 z-20 cursor-pointer hover:bg-gray-700 select-none"
                    style={{ left: '120px' }}
                  >
                    <div className="flex items-center gap-2">
                      Account
                      {sortConfig.key === 'name' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  {viewMode === 'quarter' ? (
                    // Quarterly view with month headers
                    monthsGrouped.map(monthData => (
                      <React.Fragment key={monthData.month}>
                        <th
                          colSpan={collapsedMonths[monthData.month] ? 1 : monthData.weeks.length}
                          className="px-4 py-3 text-center text-sm font-semibold border-l-2 border-gray-600 cursor-pointer hover:bg-gray-700"
                          onClick={() => setCollapsedMonths(prev => ({ ...prev, [monthData.month]: !prev[monthData.month] }))}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {collapsedMonths[monthData.month] ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {monthData.monthName}
                          </div>
                        </th>
                      </React.Fragment>
                    ))
                  ) : (
                    // Monthly view with week headers
                    weeks.map(week => (
                      <th
                        key={week}
                        className={`px-4 py-3 text-center text-sm font-semibold min-w-[100px] cursor-pointer hover:bg-gray-700 transition-colors ${selectedWeek === week ? 'bg-blue-600' : ''}`}
                        onClick={() => setSelectedWeek(week)}
                        title="Click to filter by this week"
                      >
                        {dateUtils.formatWeekDisplay(week)}
                      </th>
                    ))
                  )}
                  <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                </tr>
                {viewMode === 'quarter' && (
                  // Week headers for uncollapsed months in quarterly view
                  <tr>
                    <th className="sticky left-0 bg-gray-800 z-20"></th>
                    <th className="sticky left-0 bg-gray-800 z-20" style={{ left: '120px' }}></th>
                    {monthsGrouped.map(monthData => (
                      <React.Fragment key={`weeks-${monthData.month}`}>
                        {!collapsedMonths[monthData.month] ? (
                          monthData.weeks.map(week => (
                            <th
                              key={week}
                              className={`px-2 py-2 text-center text-xs font-normal min-w-[80px] cursor-pointer hover:bg-gray-700 transition-colors ${selectedWeek === week ? 'bg-blue-600' : ''}`}
                              onClick={() => setSelectedWeek(week)}
                              title="Click to filter by this week"
                            >
                              {dateUtils.formatWeekDisplay(week)}
                            </th>
                          ))
                        ) : (
                          <th className="px-2 py-2 text-center text-xs font-normal">...</th>
                        )}
                      </React.Fragment>
                    ))}
                    <th></th>
                  </tr>
                )}
              </thead>
              <tbody>
                {sortedAccounts.map((account, idx) => (
                  <React.Fragment key={account.id}>
                    <tr className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b hover:bg-gray-100 ${hasNotifications(account.id) ? 'border-l-4 border-l-orange-500' : ''}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10">{account.managerName}</td>
                      <td className="px-4 py-3 sticky bg-inherit z-10" style={{ left: '120px' }}>
                        <div className="flex items-center gap-2">
                          {hasNotifications(account.id) && (
                            <Bell className="w-4 h-4 text-orange-600 animate-pulse" title="Has action items due" />
                          )}
                          <button onClick={() => setExpandedAccounts(prev => ({ ...prev, [account.id]: !prev[account.id] }))} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                            {expandedAccounts[account.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {account.name}
                          </button>
                          <button onClick={() => { setModalData({ ...account }); setShowModal('editAccount'); }} className="text-gray-400 hover:text-gray-600">
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      {viewMode === 'quarter' ? (
                        // Quarterly view with collapsible months
                        monthsGrouped.map(monthData => (
                          <React.Fragment key={`${account.id}-${monthData.month}`}>
                            {!collapsedMonths[monthData.month] ? (
                              monthData.weeks.map(week => {
                                const weekData = getStatusForWeek(account.id, week);
                                return (
                                  <td key={week} className={'px-2 py-3 cursor-pointer ' + statusUtils.getStatusColor(weekData.status)} onClick={() => openEditWeekModal(account.id, week)}>
                                    <div className="flex flex-col items-center justify-center">
                                      <div onClick={(e) => handleToggleStatus(e, account.id, week)} className="hover:scale-110 transition-transform">
                                        {statusUtils.getStatusIcon(weekData.status)}
                                      </div>
                                      <span className="text-xs font-semibold mt-1 text-gray-800">{weekData.people}</span>
                                    </div>
                                  </td>
                                );
                              })
                            ) : (
                              <td className="px-2 py-3 text-center text-xs text-gray-500 bg-gray-100">
                                Collapsed
                              </td>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        // Monthly view
                        weeks.map(week => {
                          const weekData = getStatusForWeek(account.id, week);
                          return (
                            <td key={week} className={'px-4 py-3 cursor-pointer ' + statusUtils.getStatusColor(weekData.status)} onClick={() => openEditWeekModal(account.id, week)}>
                              <div className="flex flex-col items-center justify-center">
                                <div onClick={(e) => handleToggleStatus(e, account.id, week)} className="hover:scale-110 transition-transform">
                                  {statusUtils.getStatusIcon(weekData.status)}
                                </div>
                                <span className="text-xs font-semibold mt-1 text-gray-800">{weekData.people}</span>
                              </div>
                            </td>
                          );
                        })
                      )}
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-center gap-2">
                          <button onClick={() => { setModalData({ accountId: account.id, managerId: account.managerId, description: '', dueDate: '', priority: 'medium' }); setShowModal('addActionItem'); }} className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
                            <MessageSquare className="w-4 h-4" />{account.actionItems.filter(i => !i.completed).length}
                          </button>
                          <button onClick={() => openBillingModal(account.id, currentMonth)} className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded" title="Monthly Billing">
                            ${(getBillingForMonth(account.id, currentMonth) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedAccounts[account.id] && (
                      <tr className="bg-blue-50">
                        <td colSpan={weeks.length + 4} className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Action Items</h4>
                              {account.actionItems.length > 0 ? (
                                <div className="space-y-2">
                                  {account.actionItems.map(item => {
                                    const today = new Date().toISOString().split('T')[0];
                                    const isDueToday = item.dueDate === today && !item.completed;
                                    const isDueSoon = notifications.some(n => n.id === item.id);
                                    return (
                                      <div key={item.id} className={`flex items-start gap-3 p-3 rounded ${isDueToday ? 'bg-red-50 border-2 border-red-300' : isDueSoon ? 'bg-orange-50 border-2 border-orange-300' : 'bg-white'}`}>
                                        <input type="checkbox" checked={item.completed} onChange={() => handleToggleActionItem(item.id)} className="mt-1 w-4 h-4 text-blue-600 rounded" />
                                        <div className="flex-1">
                                          <div className="flex items-start gap-2">
                                            {isDueToday && <Bell className="w-4 h-4 text-red-600 animate-pulse flex-shrink-0" />}
                                            <p className={item.completed ? 'text-sm line-through text-gray-500' : 'text-sm text-gray-900'}>{item.description}</p>
                                          </div>
                                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            <span className={`text-xs ${isDueToday ? 'text-red-700 font-semibold' : 'text-gray-500'}`}>
                                              {isDueToday ? '⚠️ Due Today!' : item.dueDate}
                                            </span>
                                            <span className={'text-xs px-2 py-0.5 rounded ' + (item.priority === 'high' ? 'bg-red-100 text-red-700' : item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700')}>{item.priority}</span>
                                            {item.createdByUserName && (
                                              <span className="text-xs text-blue-600">
                                                Created by {item.createdByUserName}
                                              </span>
                                            )}
                                            {item.completed && item.completedByUserName && (
                                              <span className="text-xs text-green-600">
                                                ✓ Resolved by {item.completedByUserName} on {new Date(item.completedAt).toLocaleDateString()} at {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : <p className="text-sm text-gray-500">No action items</p>}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Quarterly Data - {account.displayYear}</h4>
                              <div className="bg-white p-3 rounded space-y-2">
                                {CONSTANTS.QUARTERS.map(quarter => (
                                  <div key={quarter} className="text-sm">
                                    <span className="font-medium text-gray-700">{quarter}:</span>
                                    <span className="ml-2 text-gray-900">Score: {account.satisfactionScore[quarter] || 'N/A'}</span>
                                    {account.quarterlyComments[quarter] && <p className="text-xs text-gray-600 mt-1">{account.quarterlyComments[quarter]}</p>}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                View historical scores in the Accounts tab
                              </div>
                            </div>
                          </div>
                          <div>
                            <div
                              className="flex items-center gap-2 cursor-pointer mb-2"
                              onClick={() => setExpandedWeeklyNotes(prev => ({ ...prev, [account.id]: !prev[account.id] }))}
                            >
                              {expandedWeeklyNotes[account.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <h4 className="text-sm font-semibold text-gray-900">Weekly Notes</h4>
                            </div>
                            {expandedWeeklyNotes[account.id] && (
                              <div className="bg-white p-3 rounded space-y-2">
                                {weeks.map(week => {
                                  const weekData = getStatusForWeek(account.id, week);
                                  if (weekData.notes) {
                                    return (
                                      <div key={week} className="text-sm border-b border-gray-200 pb-2 last:border-b-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-gray-700">{dateUtils.formatWeekDisplay(week)}:</span>
                                              {weekData.createdByUserName && (
                                                <span className="text-xs text-gray-500">by {weekData.createdByUserName}</span>
                                              )}
                                            </div>
                                            <p className="text-gray-900 mt-1">{weekData.notes}</p>
                                          </div>
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                              onClick={() => openEditWeekModal(account.id, week)}
                                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                              title="Edit note"
                                            >
                                              <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteWeekNote(account.id, week)}
                                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                              title="Delete note"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                                {weeks.every(week => !getStatusForWeek(account.id, week).notes) && (
                                  <p className="text-sm text-gray-500">No weekly notes</p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                <tr className="bg-blue-100 border-t-2 border-blue-300 font-bold">
                  <td colSpan={2} className="px-4 py-3 text-sm text-center text-gray-900">TOTAL PEOPLE PER WEEK</td>
                  {weeks.map(week => {
                    const totalPeople = enrichedAccounts.reduce((sum, account) => {
                      const weekData = getStatusForWeek(account.id, week);
                      return sum + weekData.people;
                    }, 0);
                    return (
                      <td key={week} className="px-4 py-3 text-center bg-blue-200">
                        <span className="text-lg font-bold text-blue-900">{totalPeople}</span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 bg-blue-200">
                    <div className="text-center">
                      <div className="text-xs text-gray-700 mb-1">Total Billing/Month</div>
                      <span className="text-lg font-bold text-green-900">${(() => {
                        const monthStr = `${currentMonth}-01`;
                        return enrichedAccounts.reduce((sum, account) => {
                          const billingRecord = billing.find(b => b.accountId === account.id && b.billingMonth === monthStr);
                          return sum + (billingRecord?.billedAmount || 0);
                        }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {/* Accounts Analytics View */}
        {activeTab === 'accounts' && (
          <AccountsView
            accounts={accounts}
            managers={managers}
            actionItems={actionItems}
            statuses={statuses}
          />
        )}

        {/* Manager Summary View */}
        {activeTab === 'managers' && (
          <ManagerSummary
            accounts={accounts}
            managers={managers}
            statuses={statuses}
            satisfactionScores={satisfactionScores}
            billing={billing}
          />
        )}

        {/* Account Analytics View */}
        {activeTab === 'analytics' && (
          <AccountAnalytics
            accounts={accounts}
            statuses={statuses}
            billing={billing}
          />
        )}

        {/* Year Comparison View */}
        {activeTab === 'comparison' && (
          <YearComparison
            accounts={accounts}
            statuses={statuses}
            billing={billing}
          />
        )}

        {showModal === 'addAccount' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add New Account</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input type="text" value={modalData.name} onChange={(e) => setModalData({...modalData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Manager</label>
                  <select value={modalData.managerId} onChange={(e) => setModalData({...modalData, managerId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
                  <input type="number" value={modalData.people} onChange={(e) => setModalData({...modalData, people: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Language</label>
                  <input
                    type="text"
                    value={modalData.primaryLanguage || ''}
                    onChange={(e) => setModalData({...modalData, primaryLanguage: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., JavaScript"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language Stack (comma-separated)</label>
                  <input
                    type="text"
                    value={modalData.languageStackInput !== undefined ? modalData.languageStackInput : (modalData.languageStack?.join(', ') || '')}
                    onChange={(e) => setModalData({
                      ...modalData,
                      languageStackInput: e.target.value,
                      languageStack: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., JavaScript, React, Node.js, Python"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate technologies with commas</p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={handleSaveAccount} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4 inline mr-2" />Save</button>
                <button onClick={() => setShowModal(null)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showModal === 'editAccount' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Edit Account: {modalData.name}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <input type="text" value={modalData.name} onChange={(e) => setModalData({...modalData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Manager</label>
                    <select value={modalData.managerId} onChange={(e) => setModalData({...modalData, managerId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
                    <input type="number" value={modalData.people} onChange={(e) => setModalData({...modalData, people: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Language</label>
                    <input
                      type="text"
                      value={modalData.primaryLanguage || ''}
                      onChange={(e) => setModalData({...modalData, primaryLanguage: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., JavaScript"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language Stack (comma-separated)</label>
                    <input
                      type="text"
                      value={modalData.languageStackInput !== undefined ? modalData.languageStackInput : (modalData.languageStack?.join(', ') || '')}
                      onChange={(e) => setModalData({
                        ...modalData,
                        languageStackInput: e.target.value,
                        languageStack: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., JavaScript, React, Node.js, Python"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate technologies with commas</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Technology Stack</h3>
                  {modalData.languageStack && modalData.languageStack.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {modalData.languageStack.map((lang, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Quarterly Satisfaction Scores - {modalData.displayYear || new Date().getFullYear()}</h3>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-sm text-blue-800">
                    <strong>Note:</strong> Scores are saved per year. These scores will be saved for {modalData.displayYear || new Date().getFullYear()}. Historical scores are preserved and can be viewed in the Accounts tab.
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {CONSTANTS.QUARTERS.map(q => (
                      <div key={q}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{q} Score (1-100)</label>
                        <input type="number" min="1" max="100" value={modalData.satisfactionScore?.[q] || ''} onChange={(e) => setModalData({ ...modalData, satisfactionScore: { ...modalData.satisfactionScore, [q]: e.target.value ? parseInt(e.target.value) : null }})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Quarterly Comments</h3>
                  <div className="space-y-3">
                    {CONSTANTS.QUARTERS.map(q => (
                      <div key={q}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{q} Comments</label>
                        <textarea value={modalData.quarterlyComments?.[q] || ''} onChange={(e) => setModalData({ ...modalData, quarterlyComments: { ...modalData.quarterlyComments, [q]: e.target.value }})} className="w-full px-3 py-2 border border-gray-300 rounded-md" rows="2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={handleSaveAccount} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4 inline mr-2" />Save Changes</button>
                <button onClick={() => setShowModal(null)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          </div>
        )}





        {showModal === 'addActionItem' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Action Item</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                  <select value={modalData.accountId} onChange={(e) => setModalData({...modalData, accountId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {enrichedAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                  <select value={modalData.managerId} onChange={(e) => setModalData({...modalData, managerId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={modalData.description} onChange={(e) => setModalData({...modalData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={modalData.dueDate} onChange={(e) => setModalData({...modalData, dueDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={modalData.priority} onChange={(e) => setModalData({...modalData, priority: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={handleSaveActionItem} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><Save className="w-4 h-4 inline mr-2" />Save</button>
                <button onClick={() => setShowModal(null)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showEditWeekModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Week Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
                  <input type="text" value={editWeekData.week} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={editWeekData.status} onChange={(e) => setEditWeekData({...editWeekData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="healthy">Healthy</option>
                    <option value="attention">Attention</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
                  <input type="number" min="0" value={editWeekData.people} onChange={(e) => setEditWeekData({...editWeekData, people: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editWeekData.notes}
                    onChange={(e) => setEditWeekData({...editWeekData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="3"
                    placeholder="Add any notes for this week..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={handleSaveWeekEdit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4 inline mr-2" />Save</button>
                <button onClick={() => setShowEditWeekModal(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Billing Modal */}
        {showBillingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Monthly Billing Amount</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <input type="text" value={new Date(billingData.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billed Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={billingData.amount}
                    onChange={(e) => setBillingData({...billingData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">This amount will automatically carry forward to next months unless overridden</p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={handleSaveBilling} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><Save className="w-4 h-4 inline mr-2" />Save</button>
                <button onClick={() => setShowBillingModal(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryManagerDashboard;
