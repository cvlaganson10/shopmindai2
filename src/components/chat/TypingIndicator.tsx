import { useRef, useEffect } from "react";

interface TypingIndicatorProps {
    className?: string;
}

const TypingIndicator = ({ className = "" }: TypingIndicatorProps) => (
    <div className={`flex items-center gap-1 px-3 py-2 ${className}`}>
        <span className="text-xs text-muted-foreground mr-1">AI is thinking</span>
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
    </div>
);

export default TypingIndicator;
