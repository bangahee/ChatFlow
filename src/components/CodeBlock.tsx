import React, { useState } from "react";

interface Props {
  language: string;
  value: string;
}

export const CodeBlock: React.FC<Props> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 font-mono text-xs text-left">
      <div className="flex justify-between items-center px-3.5 py-1.5 bg-zinc-800 text-zinc-300">
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="text-xs px-2.5 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors"
        >
          {copied ? "✓ 복사됨" : "복사"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-zinc-100 text-xs leading-5">
        <code>{value}</code>
      </pre>
    </div>
  );
};
