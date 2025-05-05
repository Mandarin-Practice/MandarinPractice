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
    if (percent >= 70) return "text-green-600 dark:text-green-500";
    if (percent >= 30) return "text-amber-600 dark:text-amber-500";
    return "text-primary dark:text-primary/90";
  };
  
  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-md border-2 shadow-sm ${
      isActive 
        ? "bg-accent/40 border-primary/40 text-foreground" 
        : "bg-accent/10 border-border text-foreground"
    }`}>
      <span className="chinese-text mr-1.5 font-bold text-primary">{word.chinese}</span>
      <span className="text-xs text-foreground/70 italic font-medium">({word.pinyin})</span>
      <span className="mx-1.5 font-semibold text-foreground">{word.english}</span>
      
      {/* Proficiency indicator */}
      {proficiency && Number(proficiency.attemptCount) > 0 && (
        <span 
          className={`ml-2 flex items-center ${getProficiencyColor(proficiency.proficiencyPercent)}`}
          title={`Proficiency: ${proficiency.proficiencyPercent}% (${proficiency.correctCount}/${proficiency.attemptCount})`}
        >
          <Star className="h-3.5 w-3.5 fill-current" />
        </span>
      )}
      
      <Link 
        to={`/word/${word.id}`} 
        className="ml-2 text-primary hover:text-primary/80 cursor-pointer"
        title="View word details"
      >
        <Info className="h-3.5 w-3.5" />
      </Link>
      
      {onToggleActive && (
        <button
          onClick={onToggleActive}
          className={`ml-2 ${
            isActive 
              ? "text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-600" 
              : "text-foreground/40 hover:text-foreground/60"
          }`}
          aria-label={isActive ? "Deactivate word" : "Activate word"}
          title={isActive ? "Active" : "Inactive"}
        >
          {isActive ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        </button>
      )}
      
      <button
        onClick={onRemove}
        className="ml-2 text-primary hover:text-primary/80"
        aria-label="Remove word"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
