import React from "react";

interface Props {
  onSelect: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  "⚡️ React 렌더링 최적화 팁 알려줘",
  "📝 FastAPI 비동기 처리 핵심 요약",
  "🔍 코드 복잡도 줄이는 리팩토링 방법",
  "💡 Git 좋은 커밋 메시지 작성법",
];

export const PromptChips: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg mx-auto">
      {STARTER_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="p-3 text-left text-xs font-medium rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 shadow-sm transition-all"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};
