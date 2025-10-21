// Netlify serverless function to securely upload video to Anthropic
// Uses Node 18+ built-in fetch

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

exports.handler = async (event, context) => {
  console.log('=== UPLOAD VIDEO FUNCTION STARTED ===');
  console.log('Method:', event.httpMethod);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('ERROR: Method not allowed');
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get API key from environment (server-side only)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('API Key present:', !!apiKey);
    console.log('API Key prefix:', apiKey ? apiKey.substring(0, 15) + '...' : 'MISSING');
    
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Server configuration error. API key not configured.' 
        })
      };
    }

    // Parse the request body (base64 encoded video)
    console.log('Parsing request body...');
    const { videoData, mimeType } = JSON.parse(event.body);
    console.log('MIME type:', mimeType);
    console.log('Video data length:', videoData ? videoData.length : 0);
    
    if (!videoData) {
      console.log('ERROR: No video data provided');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No video data provided' })
      };
    }

    // Convert base64 to buffer
    console.log('Converting base64 to buffer...');
    const videoBuffer = Buffer.from(videoData, 'base64');
    const fileSizeMB = (videoBuffer.length / 1024 / 1024).toFixed(2);
    console.log('File size:', fileSizeMB, 'MB');
    
    // Check file size
    if (videoBuffer.length > MAX_FILE_SIZE) {
      console.log('ERROR: File too large');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: `File size (${fileSizeMB}MB) exceeds maximum allowed size of 30MB.` 
        })
      };
    }

    // Create form data using FormData API
    console.log('Creating FormData...');
    const formData = new FormData();
    const blob = new Blob([videoBuffer], { type: mimeType || 'video/mp4' });
    formData.append('file', blob, 'video.mp4');
    console.log('FormData created successfully');

    // Upload to Anthropic
    console.log('Uploading to Anthropic Files API...');
    console.log('URL:', `${ANTHROPIC_API_BASE}/files`);
    
    const response = await fetch(`${ANTHROPIC_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14',
      },
      body: formData
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify([...response.headers.entries()]));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== ANTHROPIC API ERROR ===');
      console.error('Status:', response.status);
      console.error('Error text:', errorText);
      
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
          error: errorData.error?.message || `Upload failed with status ${response.status}` 
        })
      };
    }

    const data = await response.json();
    console.log('=== SUCCESS ===');
    console.log('File ID:', data.id);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fileId: data.id,
        message: 'Video uploaded successfully' 
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
