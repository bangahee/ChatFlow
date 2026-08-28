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
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table
                className="min-w-full divide-y divide-slate-200 border border-slate-200 text-left text-xs"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th
              className="bg-slate-100 px-3 py-2 font-semibold text-slate-900 border-b border-slate-200"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className="px-3 py-2 border-t border-slate-200 text-slate-700"
              {...props}
            >
              {children}
            </td>
          ),
          ul: ({ children, ...props }) => (
            <ul
              className="list-disc pl-5 space-y-1.5 my-2 text-slate-800"
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ children, start, ...props }) => (
            <ol
              start={start}
              className="list-decimal pl-5 space-y-1.5 my-2 text-slate-800"
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-6" {...props}>
              {children}
            </li>
          ),
          p: ({ children, ...props }) => (
            <p className="mb-2 last:mb-0 text-slate-800" {...props}>
              {children}
            </p>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-slate-900" {...props}>
              {children}
            </strong>
          ),
          h1: ({ children, ...props }) => (
            <h1 className="text-xl font-bold text-slate-900 mt-4 mb-2" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="text-lg font-bold text-slate-900 mt-3.5 mb-1.5"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="text-base font-bold text-slate-900 mt-3 mb-1"
              {...props}
            >
              {children}
            </h3>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-slate-300 pl-4 py-1 italic text-slate-600 my-2"
              {...props}
            >
              {children}
            </blockquote>
          ),
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
              {...props}
            >
              {children}
            </a>
          ),
          code({
            inline,
            className,
            children,
            ...props
          }: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) {
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
