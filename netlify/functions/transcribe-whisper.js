// Netlify serverless function to transcribe audio using OpenAI Whisper API
// Uses Node 18+ built-in fetch and OpenAI SDK
// Supports audio files (WAV, MP3, WebM, etc.)

import OpenAI from 'openai';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper API limit)

export const handler = async (event, context) => {
  console.log('=== WHISPER TRANSCRIPTION FUNCTION STARTED ===');
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
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API Key present:', !!apiKey);
    console.log('API Key prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY not found in environment');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Server configuration error. OpenAI API key not configured.' 
        })
      };
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });

    // Parse the request body (base64 encoded audio)
    console.log('Parsing request body...');
    const { audioData, mimeType, language } = JSON.parse(event.body);
    console.log('MIME type:', mimeType);
    console.log('Language:', language || 'auto-detect');
    console.log('Data length:', audioData ? audioData.length : 0);

    if (!audioData) {
      console.log('ERROR: No audio data provided');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No audio data provided' })
      };
    }

    // Convert base64 to buffer
    console.log('Converting base64 to buffer...');
    const audioBuffer = Buffer.from(audioData, 'base64');
    const fileSizeMB = (audioBuffer.length / 1024 / 1024).toFixed(2);
    console.log('File size:', fileSizeMB, 'MB');

    // Check file size
    if (audioBuffer.length > MAX_FILE_SIZE) {
      console.log('ERROR: File too large');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `File size (${fileSizeMB}MB) exceeds maximum allowed size of 25MB.`
        })
      };
    }

    // Determine file extension based on MIME type
    let extension = 'wav';
    if (mimeType) {
      if (mimeType.includes('mp3')) extension = 'mp3';
      else if (mimeType.includes('webm')) extension = 'webm';
      else if (mimeType.includes('mp4')) extension = 'mp4';
      else if (mimeType.includes('mpeg')) extension = 'mpeg';
      else if (mimeType.includes('m4a')) extension = 'm4a';
      else if (mimeType.includes('ogg')) extension = 'ogg';
      else if (mimeType.includes('flac')) extension = 'flac';
    }
    const fileName = `audio.${extension}`;
    console.log('File name:', fileName);

    // Create a File object from the buffer
    const file = new File([audioBuffer], fileName, { type: mimeType || 'audio/wav' });

    // Transcribe using Whisper API
    console.log('Calling Whisper API...');
    const startTime = Date.now();
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: language || undefined, // undefined = auto-detect
      response_format: 'verbose_json', // Get detailed response with duration
    });

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('=== SUCCESS ===');
    console.log('Processing time:', processingTime, 'seconds');
    console.log('Transcription length:', transcription.text.length, 'characters');
    console.log('Duration:', transcription.duration, 'seconds');
    console.log('Language:', transcription.language);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: transcription.text,
        duration: transcription.duration,
        language: transcription.language,
        processingTime: parseFloat(processingTime),
        message: 'Audio transcribed successfully'
      })
    };

  } catch (error) {
    console.error('=== EXCEPTION CAUGHT ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Handle OpenAI-specific errors
    let statusCode = 500;
    let errorMessage = error.message || 'Internal server error';

    if (error.status) {
      statusCode = error.status;
    }

    // Provide user-friendly error messages
    if (error.message?.includes('Invalid file format')) {
      errorMessage = 'Audio format not supported. Please try a different recording format.';
    } else if (error.message?.includes('File size')) {
      errorMessage = 'Audio file is too large. Please record a shorter video.';
    } else if (error.message?.includes('rate limit')) {
      errorMessage = 'Service is temporarily busy. Please try again in a moment.';
    }

    return {
      statusCode: statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: errorMessage 
      })
    };
  }
};
