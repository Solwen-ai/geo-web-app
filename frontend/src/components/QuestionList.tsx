import type { Question } from '../types/api';

interface QuestionListProps {
  questions: Question[];
  className?: string;
}

export const QuestionList = ({ questions, className = '' }: QuestionListProps) => {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800">生成的問題：</h3>
      <div className="space-y-3">
        {questions.map((question) => (
          <div
            key={question.id}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <p className="text-gray-800 leading-relaxed">{question.question}</p>
          </div>
        ))}
      </div>
    </div>
  );
}; 