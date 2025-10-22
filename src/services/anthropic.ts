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
 *
 * @param transcript - Text transcript of the video pitch
 * @returns Promise<string> - The generated MVP document content
 */
export async function generateMVPDocument(transcript: string): Promise<string> {
  if (!transcript || transcript.trim().length === 0) {
    throw new AnthropicAPIError('Transcript is required and cannot be empty');
  }

  try {
    console.log('🤖 Generating MVP document...');
    console.log('Using text transcript, length:', transcript.length);

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
