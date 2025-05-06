import React from "react";

interface SimpleWordChipProps {
  chinese: string;
}

export default function SimpleWordChip({ chinese }: SimpleWordChipProps) {
  return (
    <div className="inline-flex items-center px-2 py-1 rounded-md border bg-accent/10 border-border text-foreground">
      <span className="chinese-text font-bold text-primary">{chinese}</span>
    </div>
  );
}