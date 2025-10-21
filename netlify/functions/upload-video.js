// Netlify serverless function to securely upload video to Anthropic
// Uses Node 18+ built-in fetch

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

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
    // Get API key from environment (server-side only)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
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
    const { videoData, mimeType } = JSON.parse(event.body);
    
    if (!videoData) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No video data provided' })
      };
    }

    // Convert base64 to buffer
    const videoBuffer = Buffer.from(videoData, 'base64');
    
    // Check file size
    if (videoBuffer.length > MAX_FILE_SIZE) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: `File size (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size of 30MB.` 
        })
      };
    }

    // Create form data using FormData API
    const formData = new FormData();
    const blob = new Blob([videoBuffer], { type: mimeType || 'video/mp4' });
    formData.append('file', blob, 'video.mp4');

    // Upload to Anthropic
    const response = await fetch(`${ANTHROPIC_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14',
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
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
          error: errorData.error?.message || `Upload failed with status ${response.status}` 
        })
      };
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fileId: data.id,
        message: 'Video uploaded successfully' 
      })
    };

  } catch (error) {
    console.error('Upload function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message || 'Internal server error' 
      })
    };
  }
};
