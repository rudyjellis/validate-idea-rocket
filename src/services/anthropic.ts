// Anthropic API service for video upload and MVP document generation

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

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

export class AnthropicAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AnthropicAPIError';
  }
}

/**
 * Upload a video file to Anthropic's Files API
 */
export async function uploadVideoFile(videoBlob: Blob): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new AnthropicAPIError('Anthropic API key not found. Please check your environment configuration.');
  }

  if (videoBlob.size > MAX_FILE_SIZE) {
    throw new AnthropicAPIError(`File size (${(videoBlob.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size of 30MB.`);
  }

  const formData = new FormData();
  formData.append('file', videoBlob);

  try {
    const response = await fetch(`${ANTHROPIC_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData: AnthropicErrorResponse = await response.json();
      throw new AnthropicAPIError(
        errorData.error?.message || `Upload failed with status ${response.status}`,
        response.status
      );
    }

    const data: AnthropicFileResponse = await response.json();
    return data.id;
  } catch (error) {
    if (error instanceof AnthropicAPIError) {
      throw error;
    }
    throw new AnthropicAPIError(`Network error during upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate an MVP document from a video using Claude
 */
export async function generateMVPDocument(fileId: string): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new AnthropicAPIError('Anthropic API key not found. Please check your environment configuration.');
  }

  const prompt = `Analyze this video and create a one-page MVP document for the startup idea presented. Include the following sections:

1. **Executive Summary** - A brief overview of the idea
2. **Problem Statement** - What problem does this solve?
3. **Solution** - How does the proposed solution address the problem?
4. **Target Audience** - Who are the primary users/customers?
5. **Key Features** - What are the main features of the MVP?
6. **Unique Value Proposition** - What makes this different from existing solutions?
7. **Next Steps** - What are the immediate action items to build this?

Format the response as a well-structured markdown document. If the video is unclear or doesn't contain a clear startup idea, please note this and provide guidance on what information would be helpful to include.`;

  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'document',
            source: {
              type: 'file',
              file_id: fileId
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14',
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData: AnthropicErrorResponse = await response.json();
      throw new AnthropicAPIError(
        errorData.error?.message || `MVP generation failed with status ${response.status}`,
        response.status
      );
    }

    const data: AnthropicMessageResponse = await response.json();
    
    if (data.content && data.content.length > 0 && data.content[0].type === 'text') {
      return data.content[0].text;
    } else {
      throw new AnthropicAPIError('Unexpected response format from Claude');
    }
  } catch (error) {
    if (error instanceof AnthropicAPIError) {
      throw error;
    }
    throw new AnthropicAPIError(`Network error during MVP generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
