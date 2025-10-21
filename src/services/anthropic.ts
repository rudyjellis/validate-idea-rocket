// Anthropic API service for video upload and MVP document generation
// Now using secure Netlify serverless functions - API key never exposed to browser

export interface AnthropicFileResponse {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface AnthropicMessageResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AnthropicErrorResponse {
  type: string;
  error: {
    type: string;
    message: string;
  };
}

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

export class AnthropicAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AnthropicAPIError';
  }
}

/**
 * Convert Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:video/mp4;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload a video file via Netlify serverless function
 * This keeps the API key secure on the server side
 */
export async function uploadVideoFile(videoBlob: Blob): Promise<string> {
  if (videoBlob.size > MAX_FILE_SIZE) {
    throw new AnthropicAPIError(`File size (${(videoBlob.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size of 30MB.`);
  }

  try {
    // Convert blob to base64 for transmission
    const videoData = await blobToBase64(videoBlob);
    
    // Call Netlify function instead of Anthropic directly
    const response = await fetch('/.netlify/functions/upload-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoData,
        mimeType: videoBlob.type
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new AnthropicAPIError(
        errorData.error || `Upload failed with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    return data.fileId;
  } catch (error) {
    if (error instanceof AnthropicAPIError) {
      throw error;
    }
    throw new AnthropicAPIError(
      error instanceof Error ? error.message : 'Failed to upload video file'
    );
  }
}

/**
 * Generate an MVP document from a video using Claude via Netlify function
 * This keeps the API key secure on the server side
 */
export async function generateMVPDocument(fileId: string): Promise<string> {
  try {
    // Call Netlify function instead of Anthropic directly
    const response = await fetch('/.netlify/functions/generate-mvp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new AnthropicAPIError(
        errorData.error || `MVP generation failed with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    if (error instanceof AnthropicAPIError) {
      throw error;
    }
    throw new AnthropicAPIError(
      error instanceof Error ? error.message : 'Failed to generate MVP document'
    );
  }
}
