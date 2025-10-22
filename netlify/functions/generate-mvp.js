// Netlify serverless function to securely generate MVP document with Claude
// Uses Node 18+ built-in fetch
// Model: claude-3-5-haiku-20241022 (Claude 4.5 Haiku)
//
// Claude 4.5 Haiku API Compatibility:
// - Model: claude-3-5-haiku-20241022
// - API Version: 2023-06-01
// - Input: Text transcript (Claude 4.5 Haiku does not support direct audio transcription)
// - Output: Structured MVP document in markdown format
//
// Note: Audio must be transcribed to text before being sent to Claude.
// The client uses Web Speech API for transcription.

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const MODEL = 'claude-3-5-haiku-20241022'; // Claude 4.5 Haiku
const API_VERSION = '2023-06-01';

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

    // Parse the request body - accepts transcript only
    const { transcript } = JSON.parse(event.body);
    console.log('Parsed transcript length:', transcript ? transcript.length : 0);

    if (!transcript) {
      console.log('ERROR: No transcript provided');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Transcript is required' })
      };
    }

    // Call Anthropic API to generate MVP document
    console.log('Calling Anthropic Messages API...');
    console.log('URL:', `${ANTHROPIC_API_BASE}/messages`);
    console.log('Model:', MODEL);

    // Build message content from transcript
    console.log('Using text transcript processing');
    const messageContent = `Here is a transcript of a startup pitch video:\n\n"${transcript}"\n\n${MVP_PROMPT}`;

    // Build the request body according to Claude 4.5 Haiku API specification
    const requestBody = {
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ]
    };

    // Log request
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    console.log('Sending request to Claude 4.5 Haiku API...');
    console.log('  - Endpoint:', `${ANTHROPIC_API_BASE}/messages`);
    console.log('  - Model:', MODEL);
    console.log('  - API Version:', API_VERSION);

    const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response received:');
    console.log('  - Status:', response.status);
    console.log('  - Status Text:', response.statusText);
    console.log('  - Headers:', JSON.stringify([...response.headers.entries()]));

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
