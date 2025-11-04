import { Router, Response } from 'express';
import { Agent } from '../models';
import { authenticate, requireRoles, AuthRequest, verifyAgentRequest } from '../middleware/auth';
import { config } from '../config';
import axios from 'axios';

const router = Router();

async function getAgentMetaData(agentId: string, endpoint: string): Promise<any> {
  const agent = await Agent.findOne({ id: agentId });
  
  if (!agent) {
    throw new Error('Agent not found');
  }
  
  if (agent.status !== 'ONLINE') {
    throw new Error('Agent is offline. Meta data is only available when agent is connected.');
  }

  try {
    const agentUrl = `${config.agent.baseUrl}/meta/${endpoint}`;
    const response = await axios.get(agentUrl, { timeout: 10000 });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Agent request timed out');
    }
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to agent. Make sure the agent is running on ' + config.agent.baseUrl);
    }
    if (error.response) {
      throw new Error(`Agent returned error: ${error.response.status} ${error.response.statusText}`);
    }
    throw new Error('Agent returned an error');
  }
}

// Test Meta connection
router.get('/test', authenticate, requireRoles('USER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { agent_id } = req.query;
    if (!agent_id || typeof agent_id !== 'string') {
      return res.status(400).json({ detail: 'agent_id is required' });
    }
    const data = await getAgentMetaData(agent_id, 'test');
    res.json(data);
  } catch (error: any) {
    if (error.message === 'Agent not found') {
      return res.status(404).json({ detail: error.message });
    }
    if (error.message.includes('offline')) {
      return res.status(503).json({ detail: error.message });
    }
    if (error.message.includes('timeout')) {
      return res.status(504).json({ detail: error.message });
    }
    if (error.message.includes('connect')) {
      return res.status(503).json({ detail: error.message });
    }
    return res.status(502).json({ detail: error.message });
  }
});

// Get Meta account
router.get('/account', authenticate, requireRoles('USER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { agent_id } = req.query;
    if (!agent_id || typeof agent_id !== 'string') {
      return res.status(400).json({ detail: 'agent_id is required' });
    }
    const data = await getAgentMetaData(agent_id, 'account');
    res.json(data);
  } catch (error: any) {
    if (error.message === 'Agent not found') {
      return res.status(404).json({ detail: error.message });
    }
    if (error.message.includes('offline')) {
      return res.status(503).json({ detail: error.message });
    }
    if (error.message.includes('timeout')) {
      return res.status(504).json({ detail: error.message });
    }
    if (error.message.includes('connect')) {
      return res.status(503).json({ detail: error.message });
    }
    return res.status(502).json({ detail: error.message });
  }
});

// Get Meta campaigns
router.get('/campaigns', authenticate, requireRoles('USER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { agent_id } = req.query;
    if (!agent_id || typeof agent_id !== 'string') {
      return res.status(400).json({ detail: 'agent_id is required' });
    }
    const data = await getAgentMetaData(agent_id, 'campaigns');
    res.json(data);
  } catch (error: any) {
    if (error.message === 'Agent not found') {
      return res.status(404).json({ detail: error.message });
    }
    if (error.message.includes('offline')) {
      return res.status(503).json({ detail: error.message });
    }
    if (error.message.includes('timeout')) {
      return res.status(504).json({ detail: error.message });
    }
    if (error.message.includes('connect')) {
      return res.status(503).json({ detail: error.message });
    }
    return res.status(502).json({ detail: error.message });
  }
});

// Get Meta insights
router.get('/insights', authenticate, requireRoles('USER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { agent_id } = req.query;
    if (!agent_id || typeof agent_id !== 'string') {
      return res.status(400).json({ detail: 'agent_id is required' });
    }
    const data = await getAgentMetaData(agent_id, 'insights');
    res.json(data);
  } catch (error: any) {
    if (error.message === 'Agent not found') {
      return res.status(404).json({ detail: error.message });
    }
    if (error.message.includes('offline')) {
      return res.status(503).json({ detail: error.message });
    }
    if (error.message.includes('timeout')) {
      return res.status(504).json({ detail: error.message });
    }
    if (error.message.includes('connect')) {
      return res.status(503).json({ detail: error.message });
    }
    return res.status(502).json({ detail: error.message });
  }
});

// Get hierarchical campaigns
router.get('/campaigns/hierarchical', authenticate, requireRoles('USER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { agent_id } = req.query;
    if (!agent_id || typeof agent_id !== 'string') {
      return res.status(400).json({ detail: 'agent_id is required' });
    }
    const data = await getAgentMetaData(agent_id, 'campaigns/hierarchical');
    res.json(data);
  } catch (error: any) {
    if (error.message === 'Agent not found') {
      return res.status(404).json({ detail: error.message });
    }
    if (error.message.includes('offline')) {
      return res.status(503).json({ detail: error.message });
    }
    if (error.message.includes('timeout')) {
      return res.status(504).json({ detail: error.message });
    }
    if (error.message.includes('connect')) {
      return res.status(503).json({ detail: error.message });
    }
    return res.status(502).json({ detail: error.message });
  }
});

// Get campaign ad sets
router.get('/campaigns/:campaign_id/adsets', authenticate, requireRoles('USER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { agent_id } = req.query;
    const { campaign_id } = req.params;
    if (!agent_id || typeof agent_id !== 'string') {
      return res.status(400).json({ detail: 'agent_id is required' });
    }
    const data = await getAgentMetaData(agent_id, `campaigns/${campaign_id}/adsets`);
    res.json(data);
  } catch (error: any) {
    if (error.message === 'Agent not found') {
      return res.status(404).json({ detail: error.message });
    }
    if (error.message.includes('offline')) {
      return res.status(503).json({ detail: error.message });
    }
    if (error.message.includes('timeout')) {
      return res.status(504).json({ detail: error.message });
    }
    if (error.message.includes('connect')) {
      return res.status(503).json({ detail: error.message });
    }
    return res.status(502).json({ detail: error.message });
  }
});

// Get ad set ads
router.get('/adsets/:adset_id/ads', authenticate, requireRoles('USER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { agent_id } = req.query;
    const { adset_id } = req.params;
    if (!agent_id || typeof agent_id !== 'string') {
      return res.status(400).json({ detail: 'agent_id is required' });
    }
    const data = await getAgentMetaData(agent_id, `adsets/${adset_id}/ads`);
    res.json(data);
  } catch (error: any) {
    if (error.message === 'Agent not found') {
      return res.status(404).json({ detail: error.message });
    }
    if (error.message.includes('offline')) {
      return res.status(503).json({ detail: error.message });
    }
    if (error.message.includes('timeout')) {
      return res.status(504).json({ detail: error.message });
    }
    if (error.message.includes('connect')) {
      return res.status(503).json({ detail: error.message });
    }
    return res.status(502).json({ detail: error.message });
  }
});

export default router;

