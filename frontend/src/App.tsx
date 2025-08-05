import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DynamicInput } from './components/DynamicInput';
import { LoadingSpinner } from './components/LoadingSpinner';
import { QuestionList } from './components/QuestionList';
import { useQuestions } from './hooks/useQuestions';
import type { FormData, Question } from './types/api';

const queryClient = new QueryClient();

const AppContent = () => {
  const [formData, setFormData] = useState<FormData>({
    brandNames: [''],
    brandWebsites: [''],
    productsServices: '',
    targetRegions: '',
    competitorBrands: [''],
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string>('');

  const questionsMutation = useQuestions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Filter out empty values
    const filteredData: FormData = {
      brandNames: formData.brandNames.filter(name => name.trim() !== ''),
      brandWebsites: formData.brandWebsites.filter(website => website.trim() !== ''),
      productsServices: formData.productsServices,
      targetRegions: formData.targetRegions,
      competitorBrands: formData.competitorBrands.filter(competitor => competitor.trim() !== ''),
    };

    try {
      const response = await questionsMutation.mutateAsync(filteredData);
      setQuestions(response.questions);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '提交失敗，請稍後再試';
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
            {/* Multi-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <DynamicInput
                  label="品牌名稱"
                  values={formData.brandNames}
                  onChange={(values) => setFormData({ ...formData, brandNames: values })}
                  placeholder="請輸入品牌名稱"
                />

                <DynamicInput
                  label="品牌網站"
                  values={formData.brandWebsites}
                  onChange={(values) => setFormData({ ...formData, brandWebsites: values })}
                  placeholder="請輸入品牌網站"
                />

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
              </div>

              {/* Right Column */}
              <div className="space-y-6">
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

                <DynamicInput
                  label="競爭對手品牌"
                  values={formData.competitorBrands}
                  onChange={(values) => setFormData({ ...formData, competitorBrands: values })}
                  placeholder="請輸入競爭對手品牌"
                />
              </div>
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
              <QuestionList questions={questions} />
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
