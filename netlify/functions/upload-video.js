// Netlify serverless function to securely upload video to Anthropic
const fetch = require('node-fetch');
const FormData = require('form-data');

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

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

    // Parse the request body (base64 encoded video)
    const { videoData, mimeType } = JSON.parse(event.body);
    
    if (!videoData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No video data provided' })
      };
    }

    // Convert base64 to buffer
    const videoBuffer = Buffer.from(videoData, 'base64');
    
    // Check file size
    if (videoBuffer.length > MAX_FILE_SIZE) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: `File size (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size of 30MB.` 
        })
      };
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', videoBuffer, {
      filename: 'video.mp4',
      contentType: mimeType || 'video/mp4'
    });

    // Upload to Anthropic
    const response = await fetch(`${ANTHROPIC_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14',
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: errorData.error?.message || `Upload failed with status ${response.status}` 
        })
      };
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        fileId: data.id,
        message: 'Video uploaded successfully' 
      })
    };

  } catch (error) {
    console.error('Upload function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message || 'Internal server error' 
      })
    };
  }
};
