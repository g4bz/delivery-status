# Next Steps - Quick Action Guide

## 🚀 Immediate Actions Required

### Step 1: Run New Database Migration (5 minutes)
```
1. Open https://app.supabase.com/project/rngwmoxllrkipvdbqntf/sql
2. Click "New query"
3. Copy contents of: supabase/migrations/004_add_new_features.sql
4. Click "Run"
5. Verify new tables exist in Table Editor
```

### Step 2: Update Your .env (Already Done!)
Your Supabase credentials are already configured in `.env`

### Step 3: Test Current Features
```bash
npm run dev
```
Login with: `admin` / `admin$`

---

## 📝 Remaining Implementation Tasks

### Priority 1: Service Layer (30 min)
Update `src/supabase/supabaseService.js` to add:

```javascript
// Add these new functions:

export const getSatisfactionScores = async (accountId) => {
  const { data, error } = await supabase
    .from('satisfaction_scores')
    .select('*')
    .eq('account_id', accountId)
    .order('year', { ascending: true })
    .order('quarter', { ascending: true });
  if (error) throw error;
  return data;
};

export const upsertSatisfactionScore = async (accountId, year, quarter, score, comments) => {
  const { data, error } = await supabase
    .from('satisfaction_scores')
    .upsert({
      account_id: accountId,
      year,
      quarter,
      score,
      comments
    }, { onConflict: 'account_id,year,quarter' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getAccountBilling = async (accountId) => {
  const { data, error } = await supabase
    .from('account_billing')
    .select('*')
    .eq('account_id', accountId)
    .order('billing_month', { ascending: false });
  if (error) throw error;
  return data;
};

export const upsertBilling = async (accountId, billingMonth, amount, currency = 'USD', notes = '') => {
  const { data, error } = await supabase
    .from('account_billing')
    .upsert({
      account_id: accountId,
      billing_month: billingMonth,
      billed_amount: amount,
      currency,
      notes
    }, { onConflict: 'account_id,billing_month' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Update updateWeeklyStatus to include notes:
export const updateWeeklyStatus = async (accountId, week, status, people, notes = '') => {
  // ... existing code ...
  // Add notes field to insert/update
};
```

### Priority 2: Remove People Column (5 min)
In `src/App.jsx`, find and remove (around line 718-720):
```jsx
// DELETE THIS:
<td className="px-4 py-3 text-center sticky left-[280px] bg-inherit z-10">
  <span className="inline-flex items-center gap-1 text-sm text-gray-700">
    <Users className="w-4 h-4" />{account.people}
  </span>
</td>
```

Also remove from header (around line 649):
```jsx
// DELETE THIS:
<th className="px-4 py-3 text-center text-sm font-semibold sticky left-[280px] bg-gray-800 z-20">
  People
</th>
```

### Priority 3: Add Notes to Week Edit Modal (15 min)
In `src/App.jsx`, update the `editWeekData` state and modal:

```javascript
// Update state initialization (around line 221):
const [editWeekData, setEditWeekData] = useState({
  accountId: null,
  week: null,
  status: 'healthy',
  people: 0,
  notes: ''  // ADD THIS
});

// Update openEditWeekModal function (around line 393):
const openEditWeekModal = (accountId, week) => {
  const weekData = getStatusForWeek(accountId, week);
  setEditWeekData({
    accountId,
    week,
    status: weekData.status,
    people: weekData.people,
    notes: weekData.notes || ''  // ADD THIS
  });
  setShowEditWeekModal(true);
};

// In the week edit modal JSX (around line 790), add before the buttons:
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
```

### Priority 4: Add Sorting (30 min)
Add to `src/App.jsx`:

```javascript
// Add state (after line 221):
const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

// Add sort handler:
const handleSort = (key) => {
  let direction = 'asc';
  if (sortConfig.key === key && sortConfig.direction === 'asc') {
    direction = 'desc';
  }
  setSortConfig({ key, direction });
};

// Replace filteredAccounts with sortedAccounts:
const sortedAccounts = useMemo(() => {
  if (!sortConfig.key) return filteredAccounts;

  return [...filteredAccounts].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
}, [filteredAccounts, sortConfig]);

// Update table headers to be clickable:
<th
  onClick={() => handleSort('managerName')}
  className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700"
>
  Manager {sortConfig.key === 'managerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
</th>
```

### Priority 5: Create Accounts View Tab (1-2 hours)
Create `src/components/AccountsView.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import * as supabaseService from '../supabase/supabaseService';

const AccountsView = ({ accounts }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [satisfactionData, setSatisfactionData] = useState([]);
  const [billingData, setBillingData] = useState([]);

  // Implement analytics view with charts
  // Use Chart.js or Recharts for visualizations

  return (
    <div className="p-6">
      <h2>Accounts Analytics</h2>
      {/* Add year selector, charts, tables */}
    </div>
  );
};

export default AccountsView;
```

### Priority 6: Add Tab Navigation (20 min)
In `src/App.jsx`, add tab state and navigation:

```javascript
const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'accounts', 'managers'

// Add tab navigation UI before the stats cards:
<div className="flex gap-2 mb-6 border-b border-gray-300">
  <button
    onClick={() => setActiveTab('dashboard')}
    className={`px-6 py-3 font-medium ${activeTab === 'dashboard' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
  >
    Dashboard
  </button>
  <button
    onClick={() => setActiveTab('accounts')}
    className={`px-6 py-3 font-medium ${activeTab === 'accounts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
  >
    Accounts Analytics
  </button>
  <button
    onClick={() => setActiveTab('managers')}
    className={`px-6 py-3 font-medium ${activeTab === 'managers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
  >
    Manager Summary
  </button>
</div>

// Conditionally render based on activeTab
{activeTab === 'dashboard' && (
  // Existing dashboard content
)}
{activeTab === 'accounts' && (
  <AccountsView accounts={accounts} />
)}
{activeTab === 'managers' && (
  <ManagerSummary managers={managers} accounts={accounts} />
)}
```

---

## 📚 Additional Features to Implement

### Language Stack UI
In account edit modal, add:
```jsx
<div>
  <label>Language Stack (comma-separated)</label>
  <input
    type="text"
    value={modalData.language_stack?.join(', ') || ''}
    onChange={(e) => setModalData({
      ...modalData,
      language_stack: e.target.value.split(',').map(s => s.trim())
    })}
    placeholder="JavaScript, Python, React, Node.js"
  />
</div>
```

### Billing Amount UI
Add to account details:
```jsx
<div>
  <label>Monthly Billing Amount</label>
  <input
    type="number"
    placeholder="Enter amount"
    // Add billing logic
  />
</div>
```

---

## 📦 Libraries You May Need

For charts/analytics:
```bash
npm install recharts
# or
npm install chart.js react-chartjs-2
```

---

## 🎯 Testing Checklist

- [ ] Run migration 004 successfully
- [ ] Login works
- [ ] Notifications appear for due actions
- [ ] Week selection defaults to current week
- [ ] Sticky columns work in quarterly view
- [ ] Month collapse/expand works
- [ ] Notes can be saved per week
- [ ] Sorting works on all columns
- [ ] Accounts tab shows analytics
- [ ] Manager summary displays correctly
- [ ] Billing amounts can be added
- [ ] Language stack displays properly

---

## 💡 Tips

1. Test each feature incrementally
2. Check browser console for errors
3. Verify data in Supabase Table Editor
4. Use React DevTools to debug state
5. Keep IMPLEMENTATION_STATUS.md updated

---

## 🔗 Quick Links

- [Supabase Dashboard](https://app.supabase.com/project/rngwmoxllrkipvdbqntf)
- [SQL Editor](https://app.supabase.com/project/rngwmoxllrkipvdbqntf/sql)
- [Table Editor](https://app.supabase.com/project/rngwmoxllrkipvdbqntf/editor)

Good luck! 🚀
