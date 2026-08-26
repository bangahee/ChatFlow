import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

interface Props {
  content: string;
}

export const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  return (
    <div className="text-[15px] leading-7 text-slate-800 break-words space-y-2.5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full divide-y divide-slate-200 border border-slate-200 text-left text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-slate-100 px-3 py-2 font-semibold text-slate-900 border-b border-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-t border-slate-200 text-slate-700">
              {children}
            </td>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1.5 my-2 text-slate-800">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1.5 my-2 text-slate-800">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-6">{children}</li>,
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 text-slate-800">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900">{children}</strong>
          ),
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (!inline && match) {
              return <CodeBlock language={match[1]} value={codeString} />;
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-indigo-600 font-semibold"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
