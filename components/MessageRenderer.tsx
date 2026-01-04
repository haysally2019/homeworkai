'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MessageRendererProps {
  content: string;
  role?: 'user' | 'assistant'; // Add role prop to determine styling
}

export function MessageRenderer({ content, role = 'assistant' }: MessageRendererProps) {
  // If it's the user (blue bubble), we want inverted (white) text.
  // If it's the assistant (white bubble), we want standard (dark) text.
  const proseClass = role === 'user' ? 'prose-invert' : 'prose-neutral';

  return (
    <div className={`prose ${proseClass} max-w-none leading-relaxed`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          // Custom code block styling
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <div className="bg-slate-900 text-slate-50 rounded-lg p-3 my-2 overflow-x-auto text-sm">
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            ) : (
              <code className={`${role === 'user' ? 'bg-blue-700/50' : 'bg-slate-100 text-slate-800'} px-1.5 py-0.5 rounded text-sm font-medium`} {...props}>
                {children}
              </code>
            );
          },
          // Headings
          h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
          // Links
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-blue-500 hover:underline font-medium" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-slate-300 pl-4 my-2 italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}