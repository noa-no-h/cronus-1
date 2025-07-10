import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-lg max-w-none overflow-x-hidden ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-primary mt-8 mb-6">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-primary mt-6 mb-3">{children}</h3>
          ),
          p: ({ children }) => <p className="text-primary-80 leading-relaxed mb-4">{children}</p>,
          ul: ({ children }) => <ul className="text-primary-80 mb-4 pl-6">{children}</ul>,
          ol: ({ children }) => (
            <ol className="text-primary-80 mb-4 pl-6 list-decimal">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-2">{children}</li>,
          strong: ({ children }) => (
            <strong className="text-primary font-semibold">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#36168D] pl-4 italic text-primary-80 my-4">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-[#36168D] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => {
            if (!src || typeof src !== 'string') {
              return null;
            }

            const [urlSrc, hash] = src.split('#');
            const style: React.CSSProperties = {
              display: 'block',
              margin: 'auto',
              maxWidth: '100%',
              height: 'auto',
            };

            if (hash) {
              const widthMatch = /w=(\d+)/.exec(hash);
              if (widthMatch) {
                style.maxWidth = `${widthMatch[1]}px`;
              }
              const widthPercentMatch = /wp=(\d+)/.exec(hash);
              if (widthPercentMatch) {
                style.width = `${widthPercentMatch[1]}%`;
              }
            }

            return (
              <img src={urlSrc} alt={alt || ''} style={style} className="rounded-lg my-6 w-full" />
            );
          },
          code: ({ children }) => (
            <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm break-words">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
