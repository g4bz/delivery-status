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
      quarterly_comment_q4: account.quarterlyComments?.Q4 || ''
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
      people: status.people
    }));
  } catch (error) {
    console.error('Error fetching weekly statuses:', error);
    throw error;
  }
};

export const updateWeeklyStatus = async (accountId, week, status, people) => {
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
        .update({ status, people })
        .eq('account_id', accountId)
        .eq('week', week);

      if (error) throw error;
    } else {
      // Insert new status
      const { error } = await supabase
        .from('weekly_statuses')
        .insert([{
          account_id: accountId,
          week,
          status,
          people
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
      createdDate: item.created_date
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
      created_date: item.createdDate
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
      createdDate: data.created_date
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
      createdDate: data.created_date
    };
  } catch (error) {
    console.error('Error updating action item:', error);
    throw error;
  }
};
