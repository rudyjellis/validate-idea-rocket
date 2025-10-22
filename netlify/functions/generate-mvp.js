// Netlify serverless function to securely generate MVP document with Claude
// Uses Node 18+ built-in fetch
// Model: claude-3-5-haiku-20241022 (Claude 4.5 Haiku)

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const MODEL = 'claude-3-5-haiku-20241022'; // Claude 4.5 Haiku

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

    // Parse the request body - accepts transcript, fileId, or audioData
    const { transcript, fileId, audioData, mimeType } = JSON.parse(event.body);
    console.log('Parsed transcript length:', transcript ? transcript.length : 0);
    console.log('File ID:', fileId || 'none');
    console.log('Audio data length:', audioData ? audioData.length : 0);
    console.log('MIME type:', mimeType || 'none');

    if (!transcript && !fileId && !audioData) {
      console.log('ERROR: No transcript, fileId, or audioData provided');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Either transcript, fileId, or audioData must be provided' })
      };
    }

    // Call Anthropic API to generate MVP document
    console.log('Calling Anthropic Messages API...');
    console.log('URL:', `${ANTHROPIC_API_BASE}/messages`);
    console.log('Model:', MODEL);

    // Build message content based on what we have
    let messageContent;
    if (audioData) {
      // Use base64 audio data with proper document.source format (Claude 4.5 Haiku API)
      console.log('Using audio data with document.source format');
      messageContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: mimeType || 'audio/wav',
            data: audioData
          }
        },
        {
          type: 'text',
          text: `Please listen to this audio recording of a startup pitch. First transcribe what you hear, then analyze it according to the following framework:\n\n${MVP_PROMPT}`
        }
      ];
    } else if (transcript) {
      // Fallback to text transcript
      console.log('Using text transcript processing');
      messageContent = `Here is a transcript of a startup pitch video:\n\n"${transcript}"\n\n${MVP_PROMPT}`;
    } else {
      // fileId provided but no audioData - this shouldn't happen in the new flow
      console.error('ERROR: fileId provided without audioData. Please update client to pass audioData.');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Audio data required. Please update the application.'
        })
      };
    }

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
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
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
