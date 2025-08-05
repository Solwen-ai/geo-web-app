import { FaPlus, FaMinus } from 'react-icons/fa';

interface DynamicInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const DynamicInput = ({ 
  label, 
  values, 
  onChange, 
  placeholder = "請輸入...",
  className = "" 
}: DynamicInputProps) => {
  const addInput = () => {
    onChange([...values, '']);
  };

  const removeInput = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const updateValue = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {values.map((value, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="text"
            value={value}
            onChange={(e) => updateValue(index, e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => removeInput(index)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            title="移除"
          >
            <FaMinus className="w-4 h-4" />
          </button>
        </div>
      ))}
      
      <button
        type="button"
        onClick={addInput}
        className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
      >
        <FaPlus className="w-4 h-4" />
        <span>新增 {label}</span>
      </button>
    </div>
  );
}; 