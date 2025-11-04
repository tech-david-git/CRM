export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE';
  last_heartbeat_at?: string;
  allowed_ip?: string;
  bootstrap?: {
    token: string;
    docker_run: string;
  };
}

export interface AgentCreate {
  name: string;
  user_id?: string;
  allowed_ip?: string;
}

export interface AdAccount {
  id: string;
  user_id: string;
  agent_id?: string;
  meta_ad_account_id: string;
  name: string;
  cred_ref?: string;
  currency_code?: string;
  is_active: boolean;
}

export interface Campaign {
  id: string;
  ad_account_id: string;
  meta_id: string;
  name: string;
  status: string;
}

export interface Command {
  id: string;
  ad_account_id: string;
  target_type: string;
  target_id: string;
  action: string;
  payload: Record<string, any>;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  idempotency_key: string;
  created_by: string;
  created_at: string;
}

export interface MetricSnapshot {
  id: string;
  ad_account_id: string;
  campaign_id?: string;
  ad_set_id?: string;
  ad_id?: string;
  ts: string;
  impressions: number;
  clicks: number;
  spend_minor: number;
  conversions: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Campaign Rules Types
export interface CampaignRule {
  id: string;
  agent_id: string;
  campaign_id: string;
  rule_name: string;
  rule_type: 'budget' | 'conversion_rate' | 'cost_per_result' | 'time_based';
  is_active: boolean;
  config: Record<string, any>;
  last_executed_at?: string;
  execution_count: number;
  last_action?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignRuleCreate {
  agent_id: string;
  campaign_id: string;
  rule_name: string;
  rule_type: 'budget' | 'conversion_rate' | 'cost_per_result' | 'time_based';
  is_active: boolean;
  config: Record<string, any>;
}

export interface CampaignRuleUpdate {
  rule_name?: string;
  is_active?: boolean;
  config?: Record<string, any>;
}

// Rule Configuration Types
export interface BudgetRuleConfig {
  daily_budget_limit: number;
  action: 'pause' | 'reduce_budget' | 'notify';
  reduce_by_percent?: number;
}

export interface ConversionRateRuleConfig {
  min_conversion_rate: number;
  min_impressions: number;
  action: 'pause' | 'notify';
}

export interface CostPerResultRuleConfig {
  max_cost_per_result: number;
  min_conversions: number;
  action: 'pause' | 'notify';
}

export interface TimeBasedRuleConfig {
  pause_hours: number[];
  pause_days: number[];
  timezone: string;
}

// Meta API Types
export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective?: string;
  daily_budget?: number | string;
  lifetime_budget?: number | string;
  performance_metrics?: Record<string, any>;
  ad_sets?: MetaAdSet[];
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  optimization_goal?: string;
  performance_metrics?: Record<string, any>;
  ads?: MetaAd[];
}

export interface MetaAd {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  creative?: {
    id: string;
    name: string;
  };
  performance_metrics?: Record<string, any>;
}

export interface MetaAppInfo {
  id: string;
  name?: string;
  category?: string;
  link?: string;
}

export interface MetaMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

