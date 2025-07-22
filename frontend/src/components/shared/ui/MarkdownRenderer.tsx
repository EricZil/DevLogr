'use client';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const markdownToHtml = (markdown: string): string => {
  let html = markdown;

  const codeBlocks: string[] = [];
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre class="bg-black/40 border border-white/10 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-green-400 text-sm font-mono whitespace-pre">${code.trim()}</code></pre>`);
    return `__CODE_BLOCK_${index}__`;
  });

  const inlineCodes: string[] = [];
  html = html.replace(/`([^`\n]+)`/g, (match, code) => {
    const index = inlineCodes.length;
    inlineCodes.push(`<code class="bg-black/40 text-green-400 px-2 py-1 rounded text-sm font-mono">${code}</code>`);
    return `__INLINE_CODE_${index}__`;
  });

  html = html.replace(/^###### (.*$)/gm, '<h6 class="text-xs font-semibold text-white mb-2 mt-4 uppercase tracking-wide">$1</h6>');
  html = html.replace(/^##### (.*$)/gm, '<h5 class="text-sm font-semibold text-white mb-2 mt-4">$1</h5>');
  html = html.replace(/^#### (.*$)/gm, '<h4 class="text-base font-semibold text-white mb-3 mt-4">$1</h4>');
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-white mb-3 mt-5">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-white mb-4 mt-6">$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mb-4 mt-6">$1</h1>');
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold"><em class="italic text-yellow-200">$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-zinc-300">$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<del class="line-through text-zinc-400 opacity-75">$1</del>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500/50 pl-4 py-2 my-4 bg-blue-500/10 text-zinc-300 italic">$1</blockquote>');
  html = html.replace(/^\* (.*$)/gm, '<li class="text-zinc-300 mb-1 ml-4">• $1</li>');
  html = html.replace(/^- (.*$)/gm, '<li class="text-zinc-300 mb-1 ml-4">• $1</li>');
  html = html.replace(/^\d+\. (.*$)/gm, '<li class="text-zinc-300 mb-1 ml-4 list-decimal">$1</li>');
  html = html.replace(/((<li class="[^"]*">• [^<]*<\/li>\s*)+)/g, '<ul class="list-none space-y-1 my-4">$1</ul>');
  html = html.replace(/((<li class="[^"]*list-decimal[^"]*">[^<]*<\/li>\s*)+)/g, '<ol class="list-decimal space-y-1 my-4 ml-4">$1</ol>');
  html = html.replace(/^---$/gm, '<hr class="border-t border-white/20 my-6" />');
  html = html.replace(/^\*\*\*$/gm, '<hr class="border-t border-white/20 my-6" />');
  html = html.replace(/\n\n/g, '</p><p class="text-zinc-300 leading-relaxed mb-4">');
  html = `<p class="text-zinc-300 leading-relaxed mb-4">${html}</p>`;
  html = html.replace(/\n/g, '<br />');

  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, block);
  });

  inlineCodes.forEach((code, index) => {
    html = html.replace(`__INLINE_CODE_${index}__`, code);
  });

  return html;
};

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const htmlContent = markdownToHtml(content);

  return (
    <div 
      className={`prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}