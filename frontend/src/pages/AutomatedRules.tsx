import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface AutomatedRule {
  id: string;
  name: string;
  enabled: boolean;
  scope: string;
  action: string;
  conditions: {
    lifetime_impressions_threshold?: number;
    cost_per_result_threshold?: number;
    time_range_months?: number;
  };
  schedule_interval_minutes: number;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
}

const AutomatedRules: React.FC = () => {
  const [rules, setRules] = useState<AutomatedRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getAutomatedRules();
      setRules(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch automated rules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    setUpdating(prev => new Set(prev).add(ruleId));
    
    try {
      const response = await apiService.updateAutomatedRule(ruleId, { enabled: !currentEnabled });
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? response.data : rule
      ));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update rule');
    } finally {
      setUpdating(prev => {
        const next = new Set(prev);
        next.delete(ruleId);
        return next;
      });
    }
  };

  const formatConditions = (rule: AutomatedRule): string => {
    const conditions: string[] = [];
    
    if (rule.conditions.lifetime_impressions_threshold) {
      conditions.push(`Lifetime impressions > ${rule.conditions.lifetime_impressions_threshold.toLocaleString()}`);
    }
    
    if (rule.conditions.cost_per_result_threshold) {
      const costEUR = rule.conditions.cost_per_result_threshold / 100;
      conditions.push(`Cost per result > ${costEUR.toFixed(2)} EUR`);
    }
    
    if (rule.conditions.time_range_months) {
      conditions.push(`Time range: Last ${rule.conditions.time_range_months} months`);
    }
    
    return conditions.join(' AND ');
  };

  const formatScope = (scope: string): string => {
    switch (scope) {
      case 'ALL_ACTIVE_ADS':
        return 'All active ads';
      default:
        return scope;
    }
  };

  const formatAction = (action: string): string => {
    switch (action) {
      case 'PAUSE_AD':
        return 'Turn off ads (pause)';
      default:
        return action;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && rules.length === 0) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Automated Rules</h1>
        <button
          onClick={fetchRules}
          className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {rules.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">No automated rules found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {rule.name}
                    </h2>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rule.enabled
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Scope:</span>{' '}
                      {formatScope(rule.scope)}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Action:</span>{' '}
                      {formatAction(rule.action)}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Conditions:</span>{' '}
                      {formatConditions(rule)}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Schedule:</span>{' '}
                      Runs every {rule.schedule_interval_minutes} minutes
                    </div>
                    {rule.last_run_at && (
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">Last run:</span>{' '}
                        {new Date(rule.last_run_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id, rule.enabled)}
                      disabled={updating.has(rule.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    {updating.has(rule.id) && (
                      <span className="ml-3 text-sm text-gray-500">Updating...</span>
                    )}
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutomatedRules;

