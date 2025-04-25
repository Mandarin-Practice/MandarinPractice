import { X, CheckCircle, XCircle, Info, Star } from "lucide-react";
import { Link } from "wouter";

interface WordChipProps {
  word: {
    id: number;
    chinese: string;
    pinyin: string;
    english: string;
    active: string;
  };
  proficiency?: {
    proficiencyPercent: number;
    correctCount: string;
    attemptCount: string;
  } | null;
  onRemove: () => void;
  onToggleActive?: () => void;
}

export default function WordChip({ word, proficiency, onRemove, onToggleActive }: WordChipProps) {
  const isActive = word.active === "true";
  
  // Determine proficiency color
  const getProficiencyColor = (percent: number) => {
    if (percent >= 70) return "text-green-500 dark:text-green-400";
    if (percent >= 30) return "text-yellow-500 dark:text-yellow-400";
    return "text-red-500 dark:text-red-400";
  };
  
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full ${
      isActive 
        ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" 
        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
    }`}>
      <span className="font-['Noto_Sans_SC',sans-serif] mr-1">{word.chinese}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">({word.pinyin})</span>
      
      {/* Proficiency indicator */}
      {proficiency && Number(proficiency.attemptCount) > 0 && (
        <span 
          className={`ml-1.5 flex items-center ${getProficiencyColor(proficiency.proficiencyPercent)}`}
          title={`Proficiency: ${proficiency.proficiencyPercent}% (${proficiency.correctCount}/${proficiency.attemptCount})`}
        >
          <Star className="h-3 w-3 fill-current" />
        </span>
      )}
      
      <Link 
        to={`/word/${word.id}`} 
        className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
        title="View word details"
      >
        <Info className="h-3 w-3" />
      </Link>
      
      {onToggleActive && (
        <button
          onClick={onToggleActive}
          className={`ml-1.5 ${
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
        className="ml-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        aria-label="Remove word"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
