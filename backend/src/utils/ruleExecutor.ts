import axios from 'axios';
import { Agent } from '../models';
import { config } from '../config';

// Helper function to evaluate filter conditions
export function evaluateFilterConditions(adSet: any, filterConfig: any): boolean {
  const { conditions, logical_operator = 'AND' } = filterConfig;

  if (!conditions || conditions.length === 0) {
    return true;
  }

  const results = conditions.map((condition: any) => {
    const { field, operator, value, value2 } = condition;
    const fieldValue = getFieldValue(adSet, field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'greater_than_or_equal':
        return Number(fieldValue) >= Number(value);
      case 'less_than_or_equal':
        return Number(fieldValue) <= Number(value);
      case 'between':
        return Number(fieldValue) >= Number(value) && Number(fieldValue) <= Number(value2);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        return false;
    }
  });

  return logical_operator === 'AND' 
    ? results.every((r: boolean) => r)
    : results.some((r: boolean) => r);
}

// Helper function to get field value from ad set (including nested performance_metrics)
function getFieldValue(adSet: any, field: string): any {
  // Check if it's a performance metric
  if (adSet.performance_metrics && adSet.performance_metrics[field] !== undefined) {
    return adSet.performance_metrics[field];
  }
  
  // Check direct field
  if (adSet[field] !== undefined) {
    return adSet[field];
  }

  // Handle special cases
  if (field === 'cost_per_conversion' || field === 'cost_per_action') {
    const costPerAction = adSet.performance_metrics?.cost_per_action;
    if (costPerAction && Array.isArray(costPerAction) && costPerAction.length > 0) {
      return parseFloat(costPerAction[0].value || 0);
    }
    return 0;
  }

  if (field === 'conversion_rate') {
    const conversions = adSet.performance_metrics?.actions?.[0]?.value || 0;
    const clicks = adSet.performance_metrics?.clicks || 0;
    return clicks > 0 ? (conversions / clicks) * 100 : 0;
  }

  return null;
}

// Helper function to execute a rule
export async function executeRule(rule: any): Promise<any> {
  // Get ad sets from agent
  const agent = await Agent.findOne({ id: rule.agent_id });
  if (!agent || agent.status !== 'ONLINE') {
    throw new Error('Agent not found or offline');
  }

  const agentUrl = `${config.agent.baseUrl}/meta/campaigns/${rule.campaign_id}/adsets`;
  let adSetsResponse;
  try {
    adSetsResponse = await axios.get(agentUrl, { timeout: 10000 });
  } catch (error: any) {
    throw new Error('Failed to fetch ad sets from agent');
  }

  const adSets = adSetsResponse.data?.ad_sets || adSetsResponse.data?.data || [];
  
  // Find matching ad sets
  const matchingAdSets = adSets.filter((adSet: any) => {
    return evaluateFilterConditions(adSet, rule.filter_config);
  });

  // Execute action on matching ad sets
  const results = [];
  for (const adSet of matchingAdSets) {
    try {
      const newStatus = rule.action.type === 'PAUSE' ? 'PAUSED' : 'ACTIVE';
      const updateUrl = `${config.agent.baseUrl}/meta/adsets/${adSet.id}/status`;
      
      await axios.put(updateUrl, { status: newStatus }, { timeout: 10000 });
      
      results.push({
        ad_set_id: adSet.id,
        ad_set_name: adSet.name,
        action: rule.action.type,
        success: true,
      });
    } catch (error: any) {
      results.push({
        ad_set_id: adSet.id,
        ad_set_name: adSet.name,
        action: rule.action.type,
        success: false,
        error: error.message,
      });
    }
  }

  // Update rule execution stats
  rule.last_executed_at = new Date();
  rule.execution_count += 1;
  rule.last_matched_count = matchingAdSets.length;
  rule.last_action = `${rule.action.type} ${matchingAdSets.length} ad set(s)`;
  await rule.save();

  return {
    rule_id: rule.id,
    rule_name: rule.rule_name,
    matched_count: matchingAdSets.length,
    total_count: adSets.length,
    results,
  };
}

