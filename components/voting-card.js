"use client"

export default function VotingCard({ value, isSelected, onSelect, isRevealed, isDisabled }) {
  const getCardDisplay = (val) => {
    if (val === "?") return "?"
    if (val === "coffee") return "☕"
    return val
  }

  return (
    <button
      onClick={() => !isDisabled && onSelect(value)}
      disabled={isDisabled}
      className={`
        relative flex items-center justify-center
        w-20 h-28 rounded-lg border-2 transition-all
        font-bold text-2xl
        hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          isSelected
            ? "bg-primary border-primary text-primary-foreground shadow-lg scale-105"
            : "bg-card border-border text-foreground hover:border-primary/50 hover:bg-muted"
        }
      `}
    >
      {getCardDisplay(value)}
      {isSelected && !isRevealed && <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full" />}
    </button>
  )
}
