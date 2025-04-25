import { X, CheckCircle, XCircle } from "lucide-react";

interface WordChipProps {
  word: {
    id: number;
    chinese: string;
    pinyin: string;
    english: string;
    active: string;
  };
  onRemove: () => void;
  onToggleActive?: () => void;
}

export default function WordChip({ word, onRemove, onToggleActive }: WordChipProps) {
  const isActive = word.active === "true";
  
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full ${
      isActive 
        ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" 
        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
    }`}>
      <span className="font-['Noto_Sans_SC',sans-serif] mr-1">{word.chinese}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">({word.pinyin})</span>
      
      {onToggleActive && (
        <button
          onClick={onToggleActive}
          className={`ml-2 ${
            isActive 
              ? "text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300" 
              : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
          }`}
          aria-label={isActive ? "Deactivate word" : "Activate word"}
          title={isActive ? "Active" : "Inactive"}
        >
          {isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        </button>
      )}
      
      <button
        onClick={onRemove}
        className="ml-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        aria-label="Remove word"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
