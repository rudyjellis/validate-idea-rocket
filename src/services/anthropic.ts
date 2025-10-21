// Anthropic API service for MVP document generation from video transcripts
// Now using secure Netlify serverless functions - API key never exposed to browser

export class AnthropicAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AnthropicAPIError';
  }
}

/**
 * Upload audio file to Claude via Netlify function
 * Returns the file ID that can be used in subsequent API calls
 *
 * @param audioBlob - The audio blob to upload (typically WAV format)
 * @returns Promise<string> - The file ID from Claude's Files API
 */
export async function uploadAudioToClaude(audioBlob: Blob): Promise<string> {
  console.log('📤 Uploading audio to Claude...');
  console.log('Audio size:', (audioBlob.size / 1024).toFixed(2), 'KB');
  console.log('Audio type:', audioBlob.type);

  if (!audioBlob || audioBlob.size === 0) {
    throw new AnthropicAPIError('Audio blob cannot be empty');
  }

  try {
    // Convert blob to base64
    const reader = new FileReader();
    const base64Audio = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
        const base64Data = base64.split(',')[1] || base64;
        resolve(base64Data);
      };
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsDataURL(audioBlob);
    });

    console.log('Base64 encoding complete, uploading...');

    // Upload to Netlify function
    const response = await fetch('/.netlify/functions/upload-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoData: base64Audio,
        mimeType: audioBlob.type || 'audio/wav'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new AnthropicAPIError(
        errorData.error || `Audio upload failed with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    console.log('✅ Audio uploaded successfully, file ID:', data.fileId);
    return data.fileId;
  } catch (error) {
    console.error('❌ Audio upload failed:', error);
    if (error instanceof AnthropicAPIError) {
      throw error;
    }
    throw new AnthropicAPIError(
      error instanceof Error ? error.message : 'Failed to upload audio'
    );
  }
}

/**
 * Generate an MVP document from a video transcript using Claude via Netlify function
 * This keeps the API key secure on the server side
 *
 * @param transcript - Optional text transcript (for fallback)
 * @param fileId - Optional Claude file ID (preferred method for audio processing)
 * @returns Promise<string> - The generated MVP document content
 */
export async function generateMVPDocument(
  transcript?: string,
  fileId?: string
): Promise<string> {
  if (!transcript && !fileId) {
    throw new AnthropicAPIError('Either transcript or fileId must be provided');
  }

  try {
    console.log('🤖 Generating MVP document...');
    if (fileId) {
      console.log('Using audio file ID:', fileId);
    } else {
      console.log('Using text transcript, length:', transcript?.length);
    }

    // Call Netlify function instead of Anthropic directly
    const response = await fetch('/.netlify/functions/generate-mvp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript, fileId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new AnthropicAPIError(
        errorData.error || `MVP generation failed with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    console.log('✅ MVP document generated successfully');
    return data.content;
  } catch (error) {
    console.error('❌ MVP generation failed:', error);
    if (error instanceof AnthropicAPIError) {
      throw error;
    }
    throw new AnthropicAPIError(
      error instanceof Error ? error.message : 'Failed to generate MVP document'
    );
  }
}
