import { Router, Request, Response } from 'express';
import { AutomatedRule } from '../models';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { generateId } from '../utils';

const router = Router();

// Get all automated rules
router.get('/', authenticate, requireRoles('USER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const rules = await AutomatedRule.find().sort({ created_at: -1 });
    res.json(rules);
  } catch (error) {
    console.error('Get automated rules error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Get a specific automated rule
router.get('/:rule_id', authenticate, requireRoles('USER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { rule_id } = req.params;
    const rule = await AutomatedRule.findOne({ id: rule_id });
    
    if (!rule) {
      return res.status(404).json({ detail: 'Rule not found' });
    }
    
    res.json(rule);
  } catch (error) {
    console.error('Get automated rule error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Create a new automated rule
router.post('/', authenticate, requireRoles('USER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, scope, action, conditions, schedule_interval_minutes } = req.body;
    
    if (!name || !scope || !action) {
      return res.status(400).json({ detail: 'Name, scope, and action are required' });
    }
    
    const rule = new AutomatedRule({
      id: generateId('rule'),
      name,
      enabled: false, // New rules start disabled
      scope,
      action,
      conditions: conditions || {},
      schedule_interval_minutes: schedule_interval_minutes || 15,
    });
    
    await rule.save();
    res.status(201).json(rule);
  } catch (error: any) {
    console.error('Create automated rule error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ detail: 'Rule with this name already exists' });
    }
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Update rule (enable/disable or other fields)
router.patch('/:rule_id', authenticate, requireRoles('USER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { rule_id } = req.params;
    const { enabled, conditions, schedule_interval_minutes } = req.body;
    
    const rule = await AutomatedRule.findOne({ id: rule_id });
    
    if (!rule) {
      return res.status(404).json({ detail: 'Rule not found' });
    }
    
    if (typeof enabled === 'boolean') {
      rule.enabled = enabled;
    }
    
    if (conditions) {
      rule.conditions = { ...rule.conditions, ...conditions };
    }
    
    if (schedule_interval_minutes) {
      rule.schedule_interval_minutes = schedule_interval_minutes;
    }
    
    await rule.save();
    res.json(rule);
  } catch (error) {
    console.error('Update automated rule error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;

