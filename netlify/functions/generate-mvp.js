// Netlify serverless function to securely generate MVP document with Claude
const fetch = require('node-fetch');

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';

const MVP_PROMPT = `You are an expert startup advisor and product strategist. Analyze the video pitch and create a comprehensive Minimum Viable Product (MVP) document.

The MVP document should include:

1. **Executive Summary**
   - Core problem being solved
   - Target audience
   - Unique value proposition

2. **Product Vision**
   - Long-term vision
   - Mission statement
   - Key differentiators

3. **MVP Features**
   - Must-have features for launch
   - User stories
   - Success metrics

4. **Technical Requirements**
   - Technology stack recommendations
   - Architecture overview
   - Development timeline estimate

5. **Go-to-Market Strategy**
   - Target market
   - Marketing channels
   - Launch plan

6. **Success Metrics**
   - Key Performance Indicators (KPIs)
   - Validation criteria
   - Growth targets

Format the response in clear, well-structured markdown. Be specific and actionable.`;

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get API key from environment (server-side only)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Server configuration error. API key not configured.' 
        })
      };
    }

    // Parse the request body
    const { fileId } = JSON.parse(event.body);
    
    if (!fileId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No file ID provided' })
      };
    }

    // Call Anthropic API to generate MVP document
    const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'file',
                  file_id: fileId
                }
              },
              {
                type: 'text',
                text: MVP_PROMPT
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: errorData.error?.message || `MVP generation failed with status ${response.status}` 
        })
      };
    }

    const data = await response.json();
    
    // Extract the text content from Claude's response
    const mvpContent = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n\n');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        content: mvpContent,
        usage: data.usage
      })
    };

  } catch (error) {
    console.error('Generate MVP function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message || 'Internal server error' 
      })
    };
  }
};
