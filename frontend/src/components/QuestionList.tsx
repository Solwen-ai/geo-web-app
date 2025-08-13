import { useState } from 'react';
import type { Question } from '../types/api';

interface QuestionListProps {
  questions: Question[];
  className?: string;
  onQuestionsChange?: (questions: Question[]) => void;
}

export const QuestionList = ({ questions, className = '', onQuestionsChange }: QuestionListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (questions.length === 0) {
    return null;
  }

  const handleEdit = (question: Question) => {
    setEditingId(question.id);
    setEditValue(question.question);
  };

  const handleSave = () => {
    if (editingId && onQuestionsChange) {
      const updatedQuestions = questions.map(q => 
        q.id === editingId ? { ...q, question: editValue } : q
      );
      onQuestionsChange(updatedQuestions);
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800">生成的問題：</h3>
      <div className="space-y-3">
        {questions.map((question) => (
          <div
            key={question.id}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            {editingId === question.id ? (
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
                <p className="text-gray-800 leading-relaxed flex-1">{question.question}</p>
                <button
                  onClick={() => handleEdit(question)}
                  className="ml-4 px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  編輯
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 