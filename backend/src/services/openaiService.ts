import type { FormData } from '../types/index.js';

export const openaiService = {
  // Generate questions using OpenAI API
  async generateQuestions(promptData: FormData): Promise<{id: string, question: string}[]> {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY is not configured');
      }

      const prompt = `
# 角色
你是一位一般消費者，正尋找「${promptData.productsServices}」（例：離婚律師、植牙診所），目標地區「${promptData.targetRegions}」，準備在 Claude / ChatGPT（或其他 AI 對話工具）輸入問題。

# 變數
行業╱專業類型：${promptData.productsServices}
地點：${promptData.targetRegions}
官網：${promptData.brandWebsites}

# 關鍵要求
所有問題必須
1. 明確詢問品牌╱機構╱專業人員名稱，沒有出現具體品牌╱機構╱專業人員名稱，會有推薦、哪些等用字
2. 包含該領域消費者的常見痛點
3. 貼近真實決策情境，不重複
4. 符合一般民眾搜尋的提問方式，自然、口語化、符合台灣地區習慣
5. 邏輯順暢，前後無衝突

# 範例（勿複製）
台北哪幾位皮膚科醫師口碑最好又不用排隊排很久？

# 輸出格式（一次輸出 5 題，嚴格遵守下方格式，不得加入其他文字或空行）
問題
問題
      `;

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
        .slice(0, 100) // Ensure we get exactly 100 questions
        .map((question: string, index: number) => ({
          id: (index + 1).toString(),
          question: question
        }));

      console.log(`✅ Generated ${questions.length} questions using OpenAI`);
      return questions;
    } catch (error) {
      console.error('❌ Error generating questions with OpenAI:', error);
      throw error;
    }
  }
};
