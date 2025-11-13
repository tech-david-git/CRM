import mongoose, { Schema, Document } from 'mongoose';

export interface IAutomatedRule extends Document {
  id: string;
  name: string;
  enabled: boolean;
  scope: string; // e.g., 'ALL_ACTIVE_ADS'
  action: string; // e.g., 'PAUSE_AD'
  conditions: {
    lifetime_impressions_threshold?: number;
    cost_per_result_threshold?: number; // in minor currency units (e.g., cents)
    time_range_months?: number;
  };
  schedule_interval_minutes: number;
  last_run_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const AutomatedRuleSchema = new Schema<IAutomatedRule>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  enabled: { type: Boolean, default: false, required: true },
  scope: { type: String, required: true },
  action: { type: String, required: true },
  conditions: {
    lifetime_impressions_threshold: { type: Number },
    cost_per_result_threshold: { type: Number },
    time_range_months: { type: Number },
  },
  schedule_interval_minutes: { type: Number, required: true, default: 15 },
  last_run_at: { type: Date },
  created_at: { type: Date, default: Date.now, required: true },
  updated_at: { type: Date, default: Date.now, required: true },
});

// Update the updated_at field before saving
AutomatedRuleSchema.pre('save', function(next: () => void) {
  (this as IAutomatedRule).updated_at = new Date();
  next();
});

export const AutomatedRule = mongoose.model<IAutomatedRule>('AutomatedRule', AutomatedRuleSchema);

