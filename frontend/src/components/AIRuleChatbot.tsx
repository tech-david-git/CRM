import React, { useState } from 'react';
import { apiService } from '../services/api';
import { GeneratedRule, RulePreview, AdSetRuleCreate } from '../types';

interface AIRuleChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  campaignId: string;
  campaignName: string;
  onRuleCreated?: () => void;
}

interface Message {
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const AIRuleChatbot: React.FC<AIRuleChatbotProps> = ({
  isOpen,
  onClose,
  agentId,
  campaignId,
  campaignName,
  onRuleCreated,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'system',
      content: `I'll help you create a rule for filtering Ad Sets in the campaign "${campaignName}". Describe what you want to do in natural language. For example: "Pause all ad sets which costs are in the range of $60 - $100"`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedRule, setGeneratedRule] = useState<GeneratedRule | null>(null);
  const [preview, setPreview] = useState<RulePreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [executionMode, setExecutionMode] = useState<'AUTO' | 'MANUAL'>('MANUAL');

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setGeneratedRule(null);
    setPreview(null);

    try {
      const response = await apiService.generateRule(input.trim(), agentId, campaignId);
      const rule = response.data;

      setGeneratedRule(rule);

      const assistantMessage: Message = {
        type: 'assistant',
        content: `I've generated a rule for you:\n\n**${rule.rule_name}**\n${rule.description || ''}\n\n${rule.explanation || ''}\n\nWould you like to preview which ad sets would match this rule?`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-preview
      try {
        const previewResponse = await apiService.previewRule(agentId, campaignId, rule.filter_config);
        setPreview(previewResponse.data);
      } catch (error: any) {
        console.error('Preview error:', error);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error.response?.data?.detail || error.message || 'Unknown error'}. Please try rephrasing your request.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!generatedRule) return;

    setLoading(true);
    try {
      const response = await apiService.previewRule(agentId, campaignId, generatedRule.filter_config);
      setPreview(response.data);
    } catch (error: any) {
      alert(`Failed to preview rule: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedRule) return;

    setSaving(true);
    try {
      const ruleToCreate: AdSetRuleCreate = {
        agent_id: agentId,
        campaign_id: campaignId,
        rule_name: generatedRule.rule_name,
        description: generatedRule.description,
        filter_config: generatedRule.filter_config,
        action: generatedRule.action,
        execution_mode: executionMode,
      };

      await apiService.createAdSetRule(ruleToCreate);

      const successMessage: Message = {
        type: 'system',
        content: `✅ Rule "${generatedRule.rule_name}" has been saved successfully! It will ${executionMode === 'AUTO' ? 'execute automatically every 5 minutes' : 'require manual execution'}.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, successMessage]);
      setGeneratedRule(null);
      setPreview(null);
      setInput('');

      if (onRuleCreated) {
        onRuleCreated();
      }

      // Close after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      alert(`Failed to save rule: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              AI Rule Assistant
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Campaign: {campaignName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.type === 'system'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Rule Preview */}
          {generatedRule && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Generated Rule: {generatedRule.rule_name}
              </h3>
              {generatedRule.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {generatedRule.description}
                </p>
              )}
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>Action:</strong> {generatedRule.action.type}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Conditions:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {generatedRule.filter_config.conditions.map((condition, idx) => (
                    <li key={idx}>
                      {condition.field} {condition.operator} {condition.value}
                      {condition.value2 && ` and ${condition.value2}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Preview Results */}
          {preview && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Preview Results
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {preview.matching_ad_sets} out of {preview.total_ad_sets} ad sets match this rule.
              </p>
              {preview.matched_ad_sets.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto">
                  <ul className="text-sm space-y-1">
                    {preview.matched_ad_sets.slice(0, 10).map((adSet) => (
                      <li key={adSet.id} className="text-gray-700 dark:text-gray-300">
                        • {adSet.name} ({adSet.status})
                      </li>
                    ))}
                    {preview.matched_ad_sets.length > 10 && (
                      <li className="text-gray-500 dark:text-gray-400">
                        ... and {preview.matched_ad_sets.length - 10} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input and Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {generatedRule && (
            <div className="mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Execution Mode
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="MANUAL"
                      checked={executionMode === 'MANUAL'}
                      onChange={(e) => setExecutionMode(e.target.value as 'MANUAL')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Manual</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="AUTO"
                      checked={executionMode === 'AUTO'}
                      onChange={(e) => setExecutionMode(e.target.value as 'AUTO')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Automatic (every 5 min)</span>
                  </label>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handlePreview}
                  disabled={loading}
                  className="btn btn-secondary flex-1"
                >
                  Preview Again
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary flex-1"
                >
                  {saving ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Describe the rule you want to create..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn btn-primary px-6"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRuleChatbot;

