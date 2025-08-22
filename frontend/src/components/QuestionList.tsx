import { useState } from 'react';

interface QuestionListProps {
  questions: string[];
  className?: string;
  onQuestionsChange?: (questions: string[]) => void;
}

export const QuestionList = ({ questions, className = '', onQuestionsChange }: QuestionListProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (questions.length === 0) {
    return null;
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(questions[index]);
  };

  const handleSave = () => {
    if (editingIndex !== null && onQuestionsChange) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = editValue;
      onQuestionsChange(updatedQuestions);
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDelete = (index: number) => {
    if (onQuestionsChange) {
      const updatedQuestions = questions.filter((_, i) => i !== index);
      onQuestionsChange(updatedQuestions);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800">生成的問題：</h3>
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={index}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            {editingIndex === index ? (
              <div className="space-y-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    儲存
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{question}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(index)}
                    className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    刪除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 