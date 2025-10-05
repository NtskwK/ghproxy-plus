import React from "react";
import MarkdownIt from "markdown-it";

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const md = new MarkdownIt({
    html: false,
    xhtmlOut: false,
    breaks: false,
    langPrefix: "language-",
    linkify: false,
    typographer: false,
  });
  const renderedMarkdown = md.render(content);

  return (
    <div className="text-left ">
      <div
        dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
        className="markdown-content"
      />
      <style>{`
        .markdown-content hr {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default MarkdownRenderer;
