// Netlify serverless function to transcribe audio using DeepGram Speech-to-Text API
// Uses DeepGram SDK for Node.js
// Supports audio files (WAV, MP3, WebM, etc.) up to 2GB

import { createClient } from '@deepgram/sdk';

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB (DeepGram limit)

export const handler = async (event, context) => {
  console.log('=== DEEPGRAM TRANSCRIPTION FUNCTION STARTED ===');
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
    const apiKey = process.env.DEEPGRAM_API_KEY;
    console.log('API Key present:', !!apiKey);
    console.log('API Key prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');
    
    if (!apiKey) {
      console.error('DEEPGRAM_API_KEY not found in environment');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Server configuration error. DeepGram API key not configured.' 
        })
      };
    }

    // Initialize DeepGram client
    const deepgram = createClient(apiKey);

    // Parse the request body (base64 encoded audio)
    console.log('Parsing request body...');
    const { audioData, mimeType, language, options = {} } = JSON.parse(event.body);
    console.log('MIME type:', mimeType);
    console.log('Language:', language || 'auto-detect');
    console.log('Data length:', audioData ? audioData.length : 0);
    console.log('Options:', JSON.stringify(options));

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
          error: `File size (${fileSizeMB}MB) exceeds maximum allowed size of 2GB.`
        })
      };
    }

    // Build DeepGram options
    const deepgramOptions = {
      model: options.model || 'nova-3',
      smart_format: options.smart_format !== false, // default true
      punctuate: options.punctuate !== false, // default true
      diarize: options.diarize || false,
      utterances: options.utterances || false,
      profanity_filter: options.profanity_filter || false,
      language: language || undefined, // undefined = auto-detect
    };

    // Add keywords if provided
    if (options.keywords && Array.isArray(options.keywords)) {
      deepgramOptions.keywords = options.keywords;
    }

    console.log('DeepGram options:', JSON.stringify(deepgramOptions));

    // Transcribe using DeepGram API
    console.log('Calling DeepGram API...');
    const startTime = Date.now();
    
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      deepgramOptions
    );

    if (error) {
      console.error('DeepGram API error:', error);
      throw error;
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('=== SUCCESS ===');
    console.log('Processing time:', processingTime, 'seconds');

    // Extract transcription data
    const channel = result.results.channels[0];
    const alternative = channel.alternatives[0];
    
    const transcriptionText = alternative.transcript;
    const confidence = alternative.confidence;
    const words = alternative.words || [];
    
    // Extract metadata
    const metadata = result.metadata;
    const duration = metadata.duration;
    const detectedLanguage = metadata.detected_language || language;

    console.log('Transcription length:', transcriptionText.length, 'characters');
    console.log('Duration:', duration, 'seconds');
    console.log('Language:', detectedLanguage);
    console.log('Confidence:', confidence);
    console.log('Words count:', words.length);

    // Build response
    const response = {
      text: transcriptionText,
      duration: duration,
      language: detectedLanguage,
      confidence: confidence,
      processingTime: parseFloat(processingTime),
      message: 'Audio transcribed successfully'
    };

    // Add words if available
    if (words.length > 0) {
      response.words = words;
    }

    // Add paragraphs if available
    if (alternative.paragraphs) {
      response.paragraphs = alternative.paragraphs.paragraphs;
    }

    // Add speaker information if diarization was enabled
    if (options.diarize && words.length > 0) {
      // Group words by speaker
      const speakers = [];
      let currentSpeaker = null;
      let currentText = '';
      
      words.forEach(word => {
        if (word.speaker !== currentSpeaker) {
          if (currentSpeaker !== null) {
            speakers.push({
              speaker: currentSpeaker,
              text: currentText.trim()
            });
          }
          currentSpeaker = word.speaker;
          currentText = word.punctuated_word || word.word;
        } else {
          currentText += ' ' + (word.punctuated_word || word.word);
        }
      });
      
      // Add last speaker
      if (currentSpeaker !== null) {
        speakers.push({
          speaker: currentSpeaker,
          text: currentText.trim()
        });
      }
      
      response.speakers = speakers;
      console.log('Speakers detected:', speakers.length);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('=== EXCEPTION CAUGHT ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Handle DeepGram-specific errors
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
    } else if (error.message?.includes('Invalid API key')) {
      errorMessage = 'Server configuration error. Please contact support.';
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
