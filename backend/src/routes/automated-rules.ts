import { Router, Request, Response } from 'express';
import { AutomatedRule } from '../models';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';

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

// Update rule (enable/disable)
router.patch('/:rule_id', authenticate, requireRoles('USER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { rule_id } = req.params;
    const { enabled } = req.body;
    
    const rule = await AutomatedRule.findOne({ id: rule_id });
    
    if (!rule) {
      return res.status(404).json({ detail: 'Rule not found' });
    }
    
    if (typeof enabled === 'boolean') {
      rule.enabled = enabled;
      await rule.save();
    }
    
    res.json(rule);
  } catch (error) {
    console.error('Update automated rule error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;

