// Anthropic API service for MVP document generation from video transcripts
// Now using secure Netlify serverless functions - API key never exposed to browser

export class AnthropicAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AnthropicAPIError';
  }
}

/**
 * Generate an MVP document from a video transcript using Claude via Netlify function
 * This keeps the API key secure on the server side
 */
export async function generateMVPDocument(transcript: string): Promise<string> {
  if (!transcript || transcript.trim().length === 0) {
    throw new AnthropicAPIError('Transcript cannot be empty');
  }

  try {
    // Call Netlify function instead of Anthropic directly
    const response = await fetch('/.netlify/functions/generate-mvp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
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
