import 'dotenv/config';
import { logger } from '../utils/logger.js';

interface OpenAIOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Query OpenAI API with a given prompt
 * @param query - The user query/prompt
 * @param options - Optional configuration for the API call
 * @returns Promise<string> - The response from OpenAI
 */
export async function queryOpenAI(
  query: string, 
  options: OpenAIOptions = {}
): Promise<string> {
  const {
    model = 'gpt-4',
    maxTokens = 4000,
    temperature = 0.7,
    systemPrompt
  } = options;

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured in environment variables');
  }

  try {
    logger.info('queryOpenAI', '🤖 Querying OpenAI API...', { 
      query, 
      model, 
      temperature 
    });

    const messages: Array<{ role: string; content: string }> = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: query });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data: OpenAIResponse = await response.json();
    const result = data.choices[0]?.message?.content || '';

    logger.info('queryOpenAI', '✅ OpenAI API response received', { 
      responseLength: result.length 
    });
    
    return result;
  } catch (error) {
    logger.error('queryOpenAI', '❌ Error querying OpenAI API', { error });
    throw error;
  }
}

/**
 * Main function to run the script directly
 * Usage: npx tsx src/playwright/openaiQuery.ts "Your query here"
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Keep console.log for CLI usage instructions (user-facing)
    console.log('Usage: npx tsx src/playwright/openaiQuery.ts "Your query here"');
    console.log('Example: npx tsx src/playwright/openaiQuery.ts "What are the best practices for web scraping?"');
    process.exit(1);
  }

  const query = args.join(' ');
  
  try {
    const response = await queryOpenAI(query);
    // Keep console.log for CLI output (user-facing)
    console.log('\n🎯 OpenAI Response:');
    console.log('=' .repeat(50));
    console.log(response);
    console.log('=' .repeat(50));
  } catch (error) {
    console.error('Failed to query OpenAI:', error);
    process.exit(1);
  }
}

// Run main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
