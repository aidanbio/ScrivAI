export interface GeminiConfig {
  apiKey: string;
}

export interface GeneratedItem {
  title: string;
  synopsis: string;
  body: string;
}

export const generateItemFromContext = async (
  apiKey: string,
  contextItems: { title: string; synopsis: string; body?: string }[],
  instructions?: string
): Promise<GeneratedItem> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const contextPrompt = contextItems.map(item => 
    `Title: ${item.title}\nSynopsis: ${item.synopsis}\nBody: ${item.body || '(No content)'}`
  ).join('\n\n---\n\n');

  const prompt = `You are a creative writing assistant. 
Based on the following list of existing story items (scenes/chapters), generate a NEW item that logically follows or fits into the story.
Return the result in JSON format with the following keys: "title", "synopsis", "body".
The "body" should be a substantial draft of the scene content (HTML format is okay but keep it simple).

EXISTING ITEMS:
${contextPrompt}

USER INSTRUCTIONS:
${instructions || 'Create a new interesting scene that continues the story.'}

RESPONSE FORMAT:
{
  "title": "...",
  "synopsis": "...",
  "body": "..."
}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate content');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No content generated');
    }

    // Attempt to parse JSON from the response. 
    // Gemini often wraps JSON in markdown blocks like \`\`\`json ... \`\`\`
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as GeneratedItem;
    } else {
        throw new Error('Failed to parse JSON from response');
    }

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};
