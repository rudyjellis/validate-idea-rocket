// Netlify serverless function to securely generate MVP document with Claude
// Uses Node 18+ built-in fetch
// Model: claude-haiku-4-5-20250929

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const MODEL = 'claude-haiku-4-5-20250929'; // Claude Haiku 4.5

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('=== GENERATE MVP FUNCTION START ===');
    console.log('Event body:', event.body);
    
    // Get API key from environment (server-side only)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('ERROR: ANTHROPIC_API_KEY not found in environment');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Server configuration error. API key not configured.' 
        })
      };
    }
    console.log('API key found');

    // Parse the request body
    const { fileId } = JSON.parse(event.body);
    console.log('Parsed fileId:', fileId);
    
    if (!fileId) {
      console.log('ERROR: No file ID provided');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No file ID provided' })
      };
    }

    // Call Anthropic API to generate MVP document
    console.log('Calling Anthropic Messages API...');
    console.log('URL:', `${ANTHROPIC_API_BASE}/messages`);
    console.log('Model:', MODEL);
    
    const requestBody = {
      model: MODEL,
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
    };
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14',
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify([...response.headers.entries()]));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== ANTHROPIC API ERROR ===');
      console.error('Status:', response.status);
      console.error('Error text:', errorText);
      console.error('Anthropic API error:', response.status, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }
      
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: errorData.error?.message || `MVP generation failed with status ${response.status}` 
        })
      };
    }

    const data = await response.json();
    console.log('=== SUCCESS ===');
    console.log('Response data keys:', Object.keys(data));
    console.log('Content blocks:', data.content?.length);
    
    // Extract the text content from Claude's response
    const mvpContent = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n\n');

    console.log('MVP content length:', mvpContent.length);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: mvpContent,
        model: MODEL,
        usage: data.usage
      })
    };

  } catch (error) {
    console.error('=== EXCEPTION CAUGHT ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message || 'Internal server error' 
      })
    };
  }
};
