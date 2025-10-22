// Netlify serverless function to securely generate MVP document with Claude
// Uses Node 18+ built-in fetch
// Model: claude-3-5-haiku-20241022 (Claude 4.5 Haiku)
//
// Claude 4.5 Haiku API Compatibility:
// - Model: claude-3-5-haiku-20241022
// - API Version: 2023-06-01
// - Beta Header: pdfs-2024-09-25 (required for document/audio processing)
// - Document Source Format: { type: 'base64', media_type: 'audio/wav', data: '<base64>' }
//
// Supported Audio Formats:
// - WAV (audio/wav) - recommended
// - MP3 (audio/mp3)
// - Other formats supported by Claude's document processing

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const MODEL = 'claude-3-5-haiku-20241022'; // Claude 4.5 Haiku
const API_VERSION = '2023-06-01';
const BETA_HEADER = 'pdfs-2024-09-25'; // Required for document processing

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
    // Priority: transcript (from Whisper) > audioData (Claude fallback) > fileId (legacy)
    let messageContent;
    
    if (transcript) {
      // PREFERRED: Use text transcript from Whisper
      console.log('✅ Using text transcript (preferred method - from Whisper)');
      console.log('Transcript length:', transcript.length, 'characters');
      console.log('First 100 chars:', transcript.substring(0, 100));
      
      messageContent = `Here is a transcript of a startup pitch video:\n\n"${transcript}"\n\n${MVP_PROMPT}`;
      
    } else if (audioData) {
      // FALLBACK: Use base64 audio data with proper document.source format (Claude 4.5 Haiku API)
      console.log('⚠️ Using audio data fallback (Claude native processing)');
      console.log('Audio data validation:');
      console.log('  - MIME type:', mimeType || 'audio/wav');
      console.log('  - Data length:', audioData.length);
      console.log('  - First 50 chars:', audioData.substring(0, 50));

      // Validate audio data format
      if (!audioData || audioData.length === 0) {
        console.error('ERROR: Audio data is empty');
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Audio data cannot be empty'
          })
        };
      }

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
      
    } else if (fileId) {
      // LEGACY: fileId provided but no audioData or transcript
      console.error('⚠️ Legacy fileId method used. Please update client to use Whisper transcription.');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Text transcript or audio data required. Please update the application.'
        })
      };
      
    } else {
      // No valid input provided
      console.error('ERROR: No transcript, audioData, or fileId provided');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Either transcript or audio data must be provided'
        })
      };
    }

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

    // Log request (truncate audio data for readability)
    const logBody = JSON.parse(JSON.stringify(requestBody));
    if (logBody.messages?.[0]?.content?.[0]?.source?.data) {
      logBody.messages[0].content[0].source.data = logBody.messages[0].content[0].source.data.substring(0, 100) + '... (truncated)';
    }
    console.log('Request body:', JSON.stringify(logBody, null, 2));

    console.log('Sending request to Claude 4.5 Haiku API...');
    console.log('  - Endpoint:', `${ANTHROPIC_API_BASE}/messages`);
    console.log('  - Model:', MODEL);
    console.log('  - API Version:', API_VERSION);
    console.log('  - Beta Header:', BETA_HEADER);

    const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
        'anthropic-beta': BETA_HEADER,
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
