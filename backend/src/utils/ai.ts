import axios from 'axios';
import { config } from '../config';

export interface RuleGenerationRequest {
  naturalLanguage: string;
  availableFields: string[];
  availableMetrics: string[];
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
}

export async function generateRuleFromNaturalLanguage(
  request: RuleGenerationRequest
): Promise<GeneratedRule> {
  if (!config.openai.apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const systemPrompt = `You are an AI assistant that helps create filtering rules for Meta (Facebook) Ad Sets. 
Your task is to convert natural language requests into structured rule configurations.

Available fields for filtering:
- Basic fields: ${request.availableFields.join(', ')}
- Performance metrics: ${request.availableMetrics.join(', ')}

Operators available:
- equals: exact match
- not_equals: not equal to
- greater_than: > value
- less_than: < value
- greater_than_or_equal: >= value
- less_than_or_equal: <= value
- between: value between value and value2 (inclusive)
- contains: string contains substring
- in: value is in array
- not_in: value is not in array

Actions available:
- PAUSE: Pause matching ad sets
- ACTIVATE: Activate matching ad sets

For monetary values (cost, spend, budget), interpret them as numbers in the currency's base unit (e.g., $60 = 60).
For date/time fields, use ISO 8601 format or relative time in days/hours.

Return a JSON object with this exact structure:
{
  "rule_name": "A concise, descriptive name for the rule",
  "description": "Optional description explaining what the rule does",
  "filter_config": {
    "conditions": [
      {
        "field": "field_name",
        "operator": "operator_name",
        "value": value,
        "value2": value2 (only for 'between' operator)
      }
    ],
    "logical_operator": "AND" or "OR"
  },
  "action": {
    "type": "PAUSE" or "ACTIVATE"
  },
  "explanation": "Brief explanation of how you interpreted the request"
}`;

  const userPrompt = `Convert this natural language request into a rule configuration:
"${request.naturalLanguage}"

Make sure to:
1. Identify the correct field names from the available fields
2. Choose appropriate operators
3. Extract numeric values correctly
4. Determine the action (PAUSE or ACTIVATE)
5. Use 'between' operator when ranges are mentioned (e.g., "$60 - $100")
6. For time-based queries, convert relative time to appropriate date comparisons

Return ONLY valid JSON, no additional text.`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    // Validate the structure
    if (!parsed.rule_name || !parsed.filter_config || !parsed.action) {
      throw new Error('Invalid rule structure from AI');
    }

    return parsed as GeneratedRule;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`OpenAI API error: ${error.response.data?.error?.message || error.message}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
    throw error;
  }
}

