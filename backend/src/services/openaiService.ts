import type { FormData } from '../types/index.js';

export const openaiService = {
  // Generate questions using OpenAI API
  async generateQuestions(promptData: FormData): Promise<string[]> {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY is not configured');
      }

      // Replace variables in the system prompt
      let prompt = promptData.systemPrompt;
      prompt = prompt.replace(/{brandNames}/g, promptData.brandNames);
      prompt = prompt.replace(/{brandWebsites}/g, promptData.brandWebsites);
      prompt = prompt.replace(/{productsServices}/g, promptData.productsServices);
      prompt = prompt.replace(/{targetRegions}/g, promptData.targetRegions);
      prompt = prompt.replace(/{competitorBrands}/g, promptData.competitorBrands);
      prompt = prompt.replace(/{questionsCount}/g, promptData.questionsCount.toString());
      console.log('🚀 prompt', prompt);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const questionsText = data.choices[0]?.message?.content || '';
      
      // Split the response into individual questions and clean them
      const questions = questionsText
        .split('\n')
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0 && !q.match(/^\d+\./)) // Remove numbering

      console.log('🚀 questions', questions);
      console.log(`✅ Generated ${questions.length} questions using OpenAI`);
      return questions;
    } catch (error) {
      console.error('❌ Error generating questions with OpenAI:', error);
      throw error;
    }
  }
};
