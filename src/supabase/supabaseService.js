import { supabase } from './config';

// ============================================================================
// DELIVERY MANAGERS
// ============================================================================
export const getManagers = async () => {
  try {
    const { data, error } = await supabase
      .from('delivery_managers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching managers:', error);
    throw error;
  }
};

export const addManager = async (manager) => {
  try {
    const { data, error } = await supabase
      .from('delivery_managers')
      .insert([manager])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding manager:', error);
    throw error;
  }
};

// ============================================================================
// ACCOUNTS
// ============================================================================
export const getAccounts = async () => {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    // Transform database format to application format
    return data.map(account => ({
      id: account.id,
      name: account.name,
      managerId: account.manager_id,
      people: account.people,
      languageStack: account.language_stack || [],
      primaryLanguage: account.primary_language,
      satisfactionScore: {
        Q1: account.satisfaction_score_q1,
        Q2: account.satisfaction_score_q2,
        Q3: account.satisfaction_score_q3,
        Q4: account.satisfaction_score_q4
      },
      quarterlyComments: {
        Q1: account.quarterly_comment_q1 || '',
        Q2: account.quarterly_comment_q2 || '',
        Q3: account.quarterly_comment_q3 || '',
        Q4: account.quarterly_comment_q4 || ''
      }
    }));
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

export const addAccount = async (account) => {
  try {
    const dbAccount = {
      name: account.name,
      manager_id: account.managerId,
      people: account.people,
      satisfaction_score_q1: account.satisfactionScore?.Q1,
      satisfaction_score_q2: account.satisfactionScore?.Q2,
      satisfaction_score_q3: account.satisfactionScore?.Q3,
      satisfaction_score_q4: account.satisfactionScore?.Q4,
      quarterly_comment_q1: account.quarterlyComments?.Q1 || '',
      quarterly_comment_q2: account.quarterlyComments?.Q2 || '',
      quarterly_comment_q3: account.quarterlyComments?.Q3 || '',
      quarterly_comment_q4: account.quarterlyComments?.Q4 || '',
      primary_language: account.primaryLanguage || null,
      language_stack: account.languageStack || []
    };

    const { data, error } = await supabase
      .from('accounts')
      .insert([dbAccount])
      .select()
      .single();

    if (error) throw error;

    // Transform back to application format
    return {
      id: data.id,
      name: data.name,
      managerId: data.manager_id,
      people: data.people,
      satisfactionScore: {
        Q1: data.satisfaction_score_q1,
        Q2: data.satisfaction_score_q2,
        Q3: data.satisfaction_score_q3,
        Q4: data.satisfaction_score_q4
      },
      quarterlyComments: {
        Q1: data.quarterly_comment_q1 || '',
        Q2: data.quarterly_comment_q2 || '',
        Q3: data.quarterly_comment_q3 || '',
        Q4: data.quarterly_comment_q4 || ''
      }
    };
  } catch (error) {
    console.error('Error adding account:', error);
    throw error;
  }
};

export const updateAccount = async (id, updates) => {
  try {
    const dbUpdates = {
      name: updates.name,
      manager_id: updates.managerId,
      people: updates.people
    };

    // Handle satisfaction scores if present
    if (updates.satisfactionScore) {
      dbUpdates.satisfaction_score_q1 = updates.satisfactionScore.Q1;
      dbUpdates.satisfaction_score_q2 = updates.satisfactionScore.Q2;
      dbUpdates.satisfaction_score_q3 = updates.satisfactionScore.Q3;
      dbUpdates.satisfaction_score_q4 = updates.satisfactionScore.Q4;
    }

    // Handle quarterly comments if present
    if (updates.quarterlyComments) {
      dbUpdates.quarterly_comment_q1 = updates.quarterlyComments.Q1;
      dbUpdates.quarterly_comment_q2 = updates.quarterlyComments.Q2;
      dbUpdates.quarterly_comment_q3 = updates.quarterlyComments.Q3;
      dbUpdates.quarterly_comment_q4 = updates.quarterlyComments.Q4;
    }

    // Handle language stack if present
    if (updates.primaryLanguage !== undefined) {
      dbUpdates.primary_language = updates.primaryLanguage;
    }
    if (updates.languageStack !== undefined) {
      dbUpdates.language_stack = updates.languageStack;
    }

    const { data, error } = await supabase
      .from('accounts')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Transform back to application format
    return {
      id: data.id,
      name: data.name,
      managerId: data.manager_id,
      people: data.people,
      satisfactionScore: {
        Q1: data.satisfaction_score_q1,
        Q2: data.satisfaction_score_q2,
        Q3: data.satisfaction_score_q3,
        Q4: data.satisfaction_score_q4
      },
      quarterlyComments: {
        Q1: data.quarterly_comment_q1 || '',
        Q2: data.quarterly_comment_q2 || '',
        Q3: data.quarterly_comment_q3 || '',
        Q4: data.quarterly_comment_q4 || ''
      }
    };
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
};

// ============================================================================
// WEEKLY STATUSES
// ============================================================================
export const getWeeklyStatuses = async () => {
  try {
    const { data, error } = await supabase
      .from('weekly_statuses')
      .select('*')
      .order('week', { ascending: true });

    if (error) throw error;

    // Transform database format to application format
    return data.map(status => ({
      id: status.id,
      accountId: status.account_id,
      week: status.week,
      status: status.status,
      people: status.people,
      notes: status.notes || '',
      createdByUserId: status.created_by_user_id,
      createdByUserName: status.created_by_user_name
    }));
  } catch (error) {
    console.error('Error fetching weekly statuses:', error);
    throw error;
  }
};

export const updateWeeklyStatus = async (accountId, week, status, people, notes = '', createdByUserId = null, createdByUserName = null) => {
  try {
    // Check if status exists
    const { data: existing } = await supabase
      .from('weekly_statuses')
      .select('id')
      .eq('account_id', accountId)
      .eq('week', week)
      .single();

    if (existing) {
      // Update existing status
      const { error } = await supabase
        .from('weekly_statuses')
        .update({ status, people, notes })
        .eq('account_id', accountId)
        .eq('week', week);

      if (error) throw error;
    } else {
      // Insert new status with user tracking
      const { error } = await supabase
        .from('weekly_statuses')
        .insert([{
          account_id: accountId,
          week,
          status,
          people,
          notes,
          created_by_user_id: createdByUserId,
          created_by_user_name: createdByUserName
        }]);

      if (error) throw error;
    }

    // Return all statuses
    return getWeeklyStatuses();
  } catch (error) {
    console.error('Error updating weekly status:', error);
    throw error;
  }
};

export const deleteWeeklyStatus = async (accountId, week) => {
  try {
    const { error } = await supabase
      .from('weekly_statuses')
      .delete()
      .eq('account_id', accountId)
      .eq('week', week);

    if (error) throw error;

    // Return all statuses
    return getWeeklyStatuses();
  } catch (error) {
    console.error('Error deleting weekly status:', error);
    throw error;
  }
};

// ============================================================================
// ACTION ITEMS
// ============================================================================
export const getActionItems = async () => {
  try {
    const { data, error } = await supabase
      .from('action_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform database format to application format
    return data.map(item => ({
      id: item.id,
      accountId: item.account_id,
      managerId: item.manager_id,
      description: item.description,
      dueDate: item.due_date,
      completed: item.completed,
      priority: item.priority,
      createdDate: item.created_date,
      completedByUserId: item.completed_by_user_id,
      completedByUserName: item.completed_by_user_name,
      completedAt: item.completed_at,
      createdByUserId: item.created_by_user_id,
      createdByUserName: item.created_by_user_name
    }));
  } catch (error) {
    console.error('Error fetching action items:', error);
    throw error;
  }
};

export const addActionItem = async (item) => {
  try {
    const dbItem = {
      account_id: item.accountId,
      manager_id: item.managerId,
      description: item.description,
      due_date: item.dueDate,
      completed: item.completed || false,
      priority: item.priority,
      created_date: item.createdDate,
      created_by_user_id: item.createdByUserId || null,
      created_by_user_name: item.createdByUserName || null
    };

    const { data, error } = await supabase
      .from('action_items')
      .insert([dbItem])
      .select()
      .single();

    if (error) throw error;

    // Transform back to application format
    return {
      id: data.id,
      accountId: data.account_id,
      managerId: data.manager_id,
      description: data.description,
      dueDate: data.due_date,
      completed: data.completed,
      priority: data.priority,
      createdDate: data.created_date,
      createdByUserId: data.created_by_user_id,
      createdByUserName: data.created_by_user_name
    };
  } catch (error) {
    console.error('Error adding action item:', error);
    throw error;
  }
};

export const updateActionItem = async (id, updates) => {
  try {
    const dbUpdates = {};

    if (updates.accountId !== undefined) dbUpdates.account_id = updates.accountId;
    if (updates.managerId !== undefined) dbUpdates.manager_id = updates.managerId;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.createdDate !== undefined) dbUpdates.created_date = updates.createdDate;
    if (updates.completedByUserId !== undefined) dbUpdates.completed_by_user_id = updates.completedByUserId;
    if (updates.completedByUserName !== undefined) dbUpdates.completed_by_user_name = updates.completedByUserName;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

    const { data, error } = await supabase
      .from('action_items')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Transform back to application format
    return {
      id: data.id,
      accountId: data.account_id,
      managerId: data.manager_id,
      description: data.description,
      dueDate: data.due_date,
      completed: data.completed,
      priority: data.priority,
      createdDate: data.created_date,
      completedByUserId: data.completed_by_user_id,
      completedByUserName: data.completed_by_user_name,
      completedAt: data.completed_at
    };
  } catch (error) {
    console.error('Error updating action item:', error);
    throw error;
  }
};

// ============================================================================
// SATISFACTION SCORES
// ============================================================================
export const getSatisfactionScores = async (accountId = null) => {
  try {
    let query = supabase
      .from('satisfaction_scores')
      .select('*')
      .order('year', { ascending: true })
      .order('quarter', { ascending: true });

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(score => ({
      id: score.id,
      accountId: score.account_id,
      year: score.year,
      quarter: score.quarter,
      score: score.score,
      comments: score.comments || ''
    }));
  } catch (error) {
    console.error('Error fetching satisfaction scores:', error);
    throw error;
  }
};

export const upsertSatisfactionScore = async (accountId, year, quarter, score, comments = '') => {
  try {
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

    return {
      id: data.id,
      accountId: data.account_id,
      year: data.year,
      quarter: data.quarter,
      score: data.score,
      comments: data.comments || ''
    };
  } catch (error) {
    console.error('Error upserting satisfaction score:', error);
    throw error;
  }
};

export const getYearlyAverages = async (accountId) => {
  try {
    const scores = await getSatisfactionScores(accountId);
    const yearlyData = {};

    scores.forEach(score => {
      if (!yearlyData[score.year]) {
        yearlyData[score.year] = { total: 0, count: 0, quarters: {} };
      }
      yearlyData[score.year].total += score.score;
      yearlyData[score.year].count += 1;
      yearlyData[score.year].quarters[`Q${score.quarter}`] = score.score;
    });

    return Object.keys(yearlyData).map(year => ({
      year: parseInt(year),
      average: yearlyData[year].count > 0 ? (yearlyData[year].total / yearlyData[year].count).toFixed(1) : 0,
      quarters: yearlyData[year].quarters
    }));
  } catch (error) {
    console.error('Error calculating yearly averages:', error);
    throw error;
  }
};

// ============================================================================
// ACCOUNT BILLING
// ============================================================================
export const getAccountBilling = async (accountId = null) => {
  try {
    let query = supabase
      .from('account_billing')
      .select('*')
      .order('billing_month', { ascending: false });

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(billing => ({
      id: billing.id,
      accountId: billing.account_id,
      billingMonth: billing.billing_month,
      billedAmount: parseFloat(billing.billed_amount),
      currency: billing.currency,
      notes: billing.notes || ''
    }));
  } catch (error) {
    console.error('Error fetching account billing:', error);
    throw error;
  }
};

export const upsertBilling = async (accountId, billingMonth, amount, currency = 'USD', notes = '') => {
  try {
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

    return {
      id: data.id,
      accountId: data.account_id,
      billingMonth: data.billing_month,
      billedAmount: parseFloat(data.billed_amount),
      currency: data.currency,
      notes: data.notes || ''
    };
  } catch (error) {
    console.error('Error upserting billing:', error);
    throw error;
  }
};
