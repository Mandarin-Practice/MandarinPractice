import { X } from "lucide-react";

interface WordChipProps {
  word: {
    id: number;
    chinese: string;
    pinyin: string;
    english: string;
  };
  onRemove: () => void;
}

export default function WordChip({ word, onRemove }: WordChipProps) {
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
      <span className="font-['Noto_Sans_SC',sans-serif] mr-1">{word.chinese}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">({word.pinyin})</span>
      <button
        onClick={onRemove}
        className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100"
        aria-label="Remove word"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
