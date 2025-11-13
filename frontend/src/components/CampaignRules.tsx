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
  last_execution_result?: {
    checked: number;
    paused: number;
    errors: number;
    unchanged: number;
    execution_time_ms: number;
    paused_ads?: Array<{
      adId: string;
      adName: string;
      reason: string;
      metrics: {
        lifetimeImpressions: number;
        costPerResult: number;
      };
    }>;
  };
  created_at: string;
  updated_at: string;
}

interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateRuleModal: React.FC<CreateRuleModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [lifetimeImpressions, setLifetimeImpressions] = useState(8000);
  const [costPerResult, setCostPerResult] = useState(300);
  const [timeRangeMonths, setTimeRangeMonths] = useState(37);
  const [scheduleInterval, setScheduleInterval] = useState(15);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setLifetimeImpressions(8000);
      setCostPerResult(300);
      setTimeRangeMonths(37);
      setScheduleInterval(15);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      await apiService.createAutomatedRule({
        name,
        scope: 'ALL_ACTIVE_ADS',
        action: 'PAUSE_AD',
        conditions: {
          lifetime_impressions_threshold: lifetimeImpressions,
          cost_per_result_threshold: Math.round(costPerResult * 100), // Convert EUR to cents
          time_range_months: timeRangeMonths,
        },
        schedule_interval_minutes: scheduleInterval,
      });
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create rule');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="card p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Create New Rule</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rule Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-lighter text-gray-900 dark:text-white"
              required
              placeholder="e.g., Pause Ad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lifetime Impressions Threshold
            </label>
            <input
              type="number"
              value={lifetimeImpressions}
              onChange={(e) => setLifetimeImpressions(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-lighter text-gray-900 dark:text-white"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cost per Result Threshold (EUR)
            </label>
            <input
              type="number"
              value={costPerResult}
              onChange={(e) => setCostPerResult(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-lighter text-gray-900 dark:text-white"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Range (Months)
            </label>
            <input
              type="number"
              value={timeRangeMonths}
              onChange={(e) => setTimeRangeMonths(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-lighter text-gray-900 dark:text-white"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Schedule Interval (Minutes)
            </label>
            <input
              type="number"
              value={scheduleInterval}
              onChange={(e) => setScheduleInterval(parseInt(e.target.value) || 15)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-lighter text-gray-900 dark:text-white"
              required
              min="1"
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CampaignRules: React.FC<{ agentId: string; campaigns: any[] }> = () => {
  const [rules, setRules] = useState<AutomatedRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      <div className="card p-6">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Campaign Rules</h2>
          <div className="flex gap-2">
            <button
              onClick={fetchRules}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors"
            >
              + Create Rule
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {rules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No automated rules found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {rule.name}
                      </h3>
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

                    {/* Execution Results */}
                    {rule.enabled && rule.last_execution_result && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Last Execution Results
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {rule.last_execution_result.checked}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Ads Checked
                            </div>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {rule.last_execution_result.paused}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Ads Paused
                            </div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {rule.last_execution_result.unchanged}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Unchanged
                            </div>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                              {rule.last_execution_result.errors}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Errors
                            </div>
                          </div>
                        </div>
                        
                        {rule.last_execution_result.execution_time_ms && (
                          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            Execution time: {(rule.last_execution_result.execution_time_ms / 1000).toFixed(2)}s
                          </div>
                        )}

                        {/* Show paused ads details if any */}
                        {rule.last_execution_result.paused_ads && rule.last_execution_result.paused_ads.length > 0 && (
                          <div className="mt-4">
                            <details className="cursor-pointer">
                              <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                                View Paused Ads ({rule.last_execution_result.paused_ads.length})
                              </summary>
                              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                {rule.last_execution_result.paused_ads.map((pausedAd, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 bg-gray-50 dark:bg-dark-lighter rounded text-xs"
                                  >
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {pausedAd.adName}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 mt-1">
                                      {pausedAd.reason}
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-500 mt-1">
                                      Impressions: {pausedAd.metrics.lifetimeImpressions.toLocaleString()} | 
                                      Cost/Result: {pausedAd.metrics.costPerResult.toFixed(2)} EUR
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    )}
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

      <CreateRuleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchRules();
        }}
      />
    </div>
  );
};

export default CampaignRules;
