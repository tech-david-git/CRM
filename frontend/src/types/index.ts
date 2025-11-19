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

// Ad Set Rule Types
export interface AdSetRule {
  id: string;
  user_id: string;
  agent_id: string;
  campaign_id: string;
  rule_name: string;
  description?: string;
  is_active: boolean;
  execution_mode: 'AUTO' | 'MANUAL';
  filter_config: {
    conditions: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'between' | 'contains' | 'in' | 'not_in';
      value: any;
      value2?: any;
    }>;
    logical_operator?: 'AND' | 'OR';
  };
  action: {
    type: 'PAUSE' | 'ACTIVATE';
  };
  last_executed_at?: string;
  execution_count: number;
  last_action?: string;
  last_matched_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AdSetRuleCreate {
  agent_id: string;
  campaign_id: string;
  rule_name: string;
  description?: string;
  filter_config: {
    conditions: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'between' | 'contains' | 'in' | 'not_in';
      value: any;
      value2?: any;
    }>;
    logical_operator?: 'AND' | 'OR';
  };
  action: {
    type: 'PAUSE' | 'ACTIVATE';
  };
  execution_mode?: 'AUTO' | 'MANUAL';
}

export interface AdSetRuleUpdate {
  rule_name?: string;
  description?: string;
  is_active?: boolean;
  execution_mode?: 'AUTO' | 'MANUAL';
  filter_config?: {
    conditions: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'between' | 'contains' | 'in' | 'not_in';
      value: any;
      value2?: any;
    }>;
    logical_operator?: 'AND' | 'OR';
  };
  action?: {
    type: 'PAUSE' | 'ACTIVATE';
  };
}

export interface RulePreview {
  total_ad_sets: number;
  matching_ad_sets: number;
  matched_ad_sets: Array<{
    id: string;
    name: string;
    status: string;
    effective_status: string;
    daily_budget?: number;
    lifetime_budget?: number;
  }>;
}

export interface GeneratedRule {
  rule_name: string;
  description?: string;
  filter_config: {
    conditions: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'between' | 'contains' | 'in' | 'not_in';
      value: any;
      value2?: any;
    }>;
    logical_operator?: 'AND' | 'OR';
  };
  action: {
    type: 'PAUSE' | 'ACTIVATE';
  };
  explanation?: string;
  agent_id: string;
  campaign_id: string;
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

