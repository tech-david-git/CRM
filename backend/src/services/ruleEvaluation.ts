import { Ad, AdAccount, Agent, MetricSnapshot, DailyMetric, AutomatedRule } from '../models';
import { config } from '../config';
import axios from 'axios';

interface AdMetrics {
  lifetimeImpressions: number;
  costPerResult: number; // in EUR (converted from minor units)
  hasCompleteData: boolean;
}

/**
 * Calculate lifetime impressions and cost per result for an ad
 * within the specified time range (last N months)
 * 
 * @param metaAdId - The Meta API ad ID (from Meta's API)
 * @param adAccountId - The ad account ID in our database
 * @param timeRangeMonths - Number of months to look back
 */
export async function calculateAdMetrics(
  metaAdId: string,
  adAccountId: string,
  timeRangeMonths: number
): Promise<AdMetrics> {
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setMonth(cutoffDate.getMonth() - timeRangeMonths);

  // Find the ad in our database by meta_id
  const dbAd = await Ad.findOne({
    meta_id: metaAdId,
    ad_account_id: adAccountId,
  });

  // If we don't have the ad in our database, we can't calculate metrics
  if (!dbAd) {
    return {
      lifetimeImpressions: 0,
      costPerResult: 0,
      hasCompleteData: false,
    };
  }

  // Get all metric snapshots for this ad within the time range
  const snapshots = await MetricSnapshot.find({
    ad_id: dbAd.id,
    ad_account_id: adAccountId,
    ts: { $gte: cutoffDate },
  });

  // Get all daily metrics for this ad within the time range
  const dailyMetrics = await DailyMetric.find({
    ad_id: dbAd.id,
    ad_account_id: adAccountId,
    date: { $gte: cutoffDate },
  });

  // Calculate lifetime impressions (sum of all impressions)
  let lifetimeImpressions = 0;
  let totalSpend = 0; // in minor units (cents)
  let totalConversions = 0;

  // Sum from snapshots
  for (const snapshot of snapshots) {
    lifetimeImpressions += snapshot.impressions || 0;
    totalSpend += snapshot.spend_minor || 0;
    totalConversions += snapshot.conversions || 0;
  }

  // Sum from daily metrics
  for (const daily of dailyMetrics) {
    lifetimeImpressions += daily.impressions || 0;
    totalSpend += daily.spend_minor || 0;
    totalConversions += daily.conversions || 0;
  }

  // Calculate cost per result (in EUR)
  // Convert spend from minor units (cents) to major units (EUR)
  const spendEUR = totalSpend / 100;
  const costPerResult = totalConversions > 0 ? spendEUR / totalConversions : 0;

  // Check if we have complete data (at least some metrics)
  const hasCompleteData = lifetimeImpressions > 0 || totalSpend > 0;

  return {
    lifetimeImpressions,
    costPerResult,
    hasCompleteData,
  };
}

/**
 * Get all active ads from all ad accounts
 */
export async function getAllActiveAds(): Promise<Array<{ ad: any; adAccount: any; agent: any }>> {
  const activeAds: Array<{ ad: any; adAccount: any; agent: any }> = [];

  // Get all active ad accounts
  const adAccounts = await AdAccount.find({ is_active: true });

  for (const adAccount of adAccounts) {
    if (!adAccount.agent_id) {
      continue;
    }

    // Get the agent
    const agent = await Agent.findOne({ id: adAccount.agent_id });
    if (!agent || agent.status !== 'ONLINE') {
      continue;
    }

    try {
      // Get all campaigns for this ad account via the agent
      // Note: Each agent handles its own Meta connection, so we use the agent's base URL
      // For now, we use the config's baseUrl, but in a multi-agent setup, you'd need
      // to store each agent's URL or use a service discovery mechanism
      const agentBaseUrl = config.agent.baseUrl; // In production, this might come from agent config
      
      const campaignsResponse = await axios.get(
        `${agentBaseUrl}/meta/campaigns/hierarchical`,
        { timeout: 10000 }
      );

      if (campaignsResponse.data.status !== 'success') {
        console.warn(`Failed to get campaigns for ad account ${adAccount.id}: ${campaignsResponse.data.message}`);
        continue;
      }

      const campaigns = campaignsResponse.data.data?.campaigns || [];

      // Traverse campaigns -> ad sets -> ads
      for (const campaign of campaigns) {
        const adSets = campaign.ad_sets || [];
        for (const adSet of adSets) {
          const ads = adSet.ads || [];
          for (const ad of ads) {
            // Only include active ads
            if (ad.status === 'ACTIVE' || ad.effective_status === 'ACTIVE') {
              activeAds.push({
                ad,
                adAccount,
                agent,
              });
            }
          }
        }
      }
    } catch (error: any) {
      console.error(`Error fetching ads for ad account ${adAccount.id}:`, error.message);
      // Continue with next ad account
      continue;
    }
  }

  return activeAds;
}

/**
 * Evaluate a rule against an ad and return whether it should be paused
 */
export async function evaluateRuleForAd(
  rule: any,
  ad: any,
  adAccount: any,
  agent: any
): Promise<{ shouldPause: boolean; metrics: AdMetrics; reason?: string }> {
  // Get metrics for this ad (ad.id is the Meta API ad ID)
  const metrics = await calculateAdMetrics(
    ad.id, // Meta API ad ID
    adAccount.id,
    rule.conditions.time_range_months || 37
  );

  // If we don't have complete data, don't pause (conservative approach)
  if (!metrics.hasCompleteData) {
    return {
      shouldPause: false,
      metrics,
      reason: 'Incomplete metrics data',
    };
  }

  // Check conditions
  const impressionsThreshold = rule.conditions.lifetime_impressions_threshold || 8000;
  const costPerResultThreshold = rule.conditions.cost_per_result_threshold || 30000; // 300 EUR in cents

  const meetsImpressionsCondition = metrics.lifetimeImpressions > impressionsThreshold;
  const meetsCostPerResultCondition = metrics.costPerResult > costPerResultThreshold / 100; // Convert cents to EUR

  if (meetsImpressionsCondition && meetsCostPerResultCondition) {
    return {
      shouldPause: true,
      metrics,
      reason: `Lifetime impressions (${metrics.lifetimeImpressions}) > ${impressionsThreshold} AND Cost per result (${metrics.costPerResult.toFixed(2)} EUR) > ${costPerResultThreshold / 100} EUR`,
    };
  }

  return {
    shouldPause: false,
    metrics,
  };
}

/**
 * Pause an ad via the agent
 */
export async function pauseAd(adId: string, agentId: string): Promise<boolean> {
  try {
    const response = await axios.put(
      `${config.agent.baseUrl}/meta/ads/${adId}/status`,
      { status: 'PAUSED' },
      { timeout: 10000 }
    );

    return response.data.status === 'success';
  } catch (error: any) {
    console.error(`Failed to pause ad ${adId} via agent ${agentId}:`, error.message);
    return false;
  }
}

/**
 * Execute the automated rule
 */
export async function executeAutomatedRule(rule: any): Promise<{
  checked: number;
  paused: number;
  errors: number;
  unchanged: number;
  pausedAds: Array<{ adId: string; adName: string; reason: string; metrics: AdMetrics }>;
}> {
  const startTime = Date.now();
  const result = {
    checked: 0,
    paused: 0,
    errors: 0,
    unchanged: 0,
    pausedAds: [] as Array<{ adId: string; adName: string; reason: string; metrics: AdMetrics }>,
  };

  console.log(`[AutomatedRule] Starting execution of rule: ${rule.name}`);

  try {
    // Get all active ads
    const activeAds = await getAllActiveAds();
    result.checked = activeAds.length;

    console.log(`[AutomatedRule] Found ${activeAds.length} active ads to check`);

    // Evaluate each ad
    for (const { ad, adAccount, agent } of activeAds) {
      try {
        const evaluation = await evaluateRuleForAd(rule, ad, adAccount, agent);

        if (evaluation.shouldPause) {
          console.log(
            `[AutomatedRule] Ad ${ad.id} (${ad.name}) meets conditions. Metrics: impressions=${evaluation.metrics.lifetimeImpressions}, costPerResult=${evaluation.metrics.costPerResult.toFixed(2)} EUR. Reason: ${evaluation.reason}`
          );

          // Pause the ad
          const paused = await pauseAd(ad.id, agent.id);

          if (paused) {
            result.paused++;
            result.pausedAds.push({
              adId: ad.id,
              adName: ad.name || ad.id,
              reason: evaluation.reason || 'Rule conditions met',
              metrics: evaluation.metrics,
            });
            console.log(`[AutomatedRule] Successfully paused ad ${ad.id}`);
          } else {
            result.errors++;
            console.error(`[AutomatedRule] Failed to pause ad ${ad.id}`);
          }
        } else {
          // Ad was checked but didn't meet conditions
          result.unchanged++;
        }
      } catch (error: any) {
        result.errors++;
        console.error(`[AutomatedRule] Error evaluating ad ${ad.id}:`, error.message);
        // Continue with next ad
        continue;
      }
    }

    const executionTime = Date.now() - startTime;

    // Update last_run_at and last_execution_result
    rule.last_run_at = new Date();
    rule.last_execution_result = {
      checked: result.checked,
      paused: result.paused,
      errors: result.errors,
      unchanged: result.unchanged,
      execution_time_ms: executionTime,
      paused_ads: result.pausedAds.map(ad => ({
        adId: ad.adId,
        adName: ad.adName,
        reason: ad.reason,
        metrics: {
          lifetimeImpressions: ad.metrics.lifetimeImpressions,
          costPerResult: ad.metrics.costPerResult,
        },
      })),
    };
    await rule.save();

    console.log(
      `[AutomatedRule] Rule execution completed. Checked: ${result.checked}, Paused: ${result.paused}, Unchanged: ${result.unchanged}, Errors: ${result.errors}, Time: ${executionTime}ms`
    );
  } catch (error: any) {
    console.error(`[AutomatedRule] Fatal error executing rule:`, error);
    result.errors++;
    
    // Still save the partial results
    const executionTime = Date.now() - startTime;
    rule.last_run_at = new Date();
    rule.last_execution_result = {
      checked: result.checked,
      paused: result.paused,
      errors: result.errors,
      unchanged: result.unchanged,
      execution_time_ms: executionTime,
      paused_ads: result.pausedAds.map(ad => ({
        adId: ad.adId,
        adName: ad.adName,
        reason: ad.reason,
        metrics: {
          lifetimeImpressions: ad.metrics.lifetimeImpressions,
          costPerResult: ad.metrics.costPerResult,
        },
      })),
    };
    await rule.save();
  }

  return result;
}

