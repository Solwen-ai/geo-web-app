import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoadingSpinner } from './components/LoadingSpinner';
import { QuestionList } from './components/QuestionList';
import { useQuestions } from './hooks/useQuestions';
import { useInitScraping } from './hooks/useInitScraping';
import type { FormData, Question } from './types/api';

const queryClient = new QueryClient();

const AppContent = () => {
  const [formData, setFormData] = useState<FormData>({
    brandNames: 'welly,偉利',
    brandWebsites: 'welly.tw',
    productsServices: 'seo',
    targetRegions: 'taiwan',
    competitorBrands: 'awoo,阿物,零一,ranking,mtmg',
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string>('');

  const questionsMutation = useQuestions();
  const initScrapingMutation = useInitScraping();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await questionsMutation.mutateAsync(formData);
      setQuestions(response.questions);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '提交失敗，請稍後再試';
      setError(errorMessage);
    }
  };

  const handleInitScraping = async () => {
    if (questions.length === 0) {
      setError('請先生成問題');
      return;
    }

    setError('');

    try {
      await initScrapingMutation.mutateAsync(questions);
      alert('問題已成功儲存到 questions.txt');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '儲存問題失敗，請稍後再試';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            品牌問題生成器
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 3 rows x 2 columns Grid layout - each input is one row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 grid-rows-3 gap-6">
              {/* Row 1 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  品牌名稱
                </label>
                <input
                  type="text"
                  value={formData.brandNames}
                  onChange={(e) => setFormData({ ...formData, brandNames: e.target.value })}
                  placeholder="請輸入品牌名稱，用逗號分隔多個品牌"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500">例如：Welly SEO, 偉利科技</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  品牌網站
                </label>
                <input
                  type="text"
                  value={formData.brandWebsites}
                  onChange={(e) => setFormData({ ...formData, brandWebsites: e.target.value })}
                  placeholder="請輸入品牌網站，用逗號分隔多個網站"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500">例如：https://welly.tw, https://example.com</p>
              </div>

              {/* Row 2 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  品牌要推的產品/服務
                </label>
                <input
                  type="text"
                  value={formData.productsServices}
                  onChange={(e) => setFormData({ ...formData, productsServices: e.target.value })}
                  placeholder="請輸入產品或服務"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  品牌要推的地區
                </label>
                <input
                  type="text"
                  value={formData.targetRegions}
                  onChange={(e) => setFormData({ ...formData, targetRegions: e.target.value })}
                  placeholder="請輸入目標地區"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Row 3 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  競爭對手品牌
                </label>
                <input
                  type="text"
                  value={formData.competitorBrands}
                  onChange={(e) => setFormData({ ...formData, competitorBrands: e.target.value })}
                  placeholder="請輸入競爭對手品牌，用逗號分隔多個品牌"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500">例如：零一行銷, Awoo 阿物科技, 集客數據行銷</p>
              </div>

              {/* Empty cell for Row 3, Column 2 */}
              <div></div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={questionsMutation.isPending}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {questionsMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>生成中...</span>
                  </>
                ) : (
                  <span>生成問題</span>
                )}
              </button>
            </div>
          </form>

          {/* Results */}
          {questions.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <QuestionList 
                questions={questions} 
                onQuestionsChange={setQuestions}
              />
              
              {/* Init Scraping Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleInitScraping}
                  disabled={initScrapingMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {initScrapingMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>儲存中...</span>
                    </>
                  ) : (
                    <span>開始產生 GEO 文件</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
