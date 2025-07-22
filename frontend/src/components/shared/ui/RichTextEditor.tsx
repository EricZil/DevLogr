'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  showPreview?: boolean;
  label?: string;
}

interface ToolbarButton {
  icon: string;
  label: string;
  action: () => void;
  isActive?: boolean;
  shortcut?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className = "",
  minHeight = "300px",
  showPreview = true,
  label
}: RichTextEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);



  // Insert text at cursor position
  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = start + before.length + textToInsert.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Insert text at current position
  const insertAtCursor = (text: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newText = value.substring(0, start) + text + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      if (textarea) {
        const newCursorPos = start + text.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Enhanced markdown to HTML conversion with proper line break preservation
  const markdownToHtml = (markdown: string): string => {
    let html = markdown;

    // First, handle code blocks to prevent interference with other replacements
    const codeBlocks: string[] = [];
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      const index = codeBlocks.length;
      codeBlocks.push(`<pre class="bg-black/40 border border-white/10 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-green-400 text-sm font-mono whitespace-pre">${code.trim()}</code></pre>`);
      return `__CODE_BLOCK_${index}__`;
    });

    // Handle inline code before other formatting
    const inlineCodes: string[] = [];
    html = html.replace(/`([^`\n]+)`/g, (match, code) => {
      const index = inlineCodes.length;
      inlineCodes.push(`<code class="bg-black/40 text-green-400 px-2 py-1 rounded text-sm font-mono">${code}</code>`);
      return `__INLINE_CODE_${index}__`;
    });

    // Headers (H1-H6) - Process in reverse order to avoid conflicts
    html = html.replace(/^###### (.*$)/gm, '<h6 class="text-xs font-semibold text-white mb-2 mt-4 uppercase tracking-wide">$1</h6>');
    html = html.replace(/^##### (.*$)/gm, '<h5 class="text-sm font-semibold text-white mb-2 mt-4">$1</h5>');
    html = html.replace(/^#### (.*$)/gm, '<h4 class="text-base font-semibold text-white mb-3 mt-4">$1</h4>');
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-white mb-3 mt-5">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-white mb-4 mt-6">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mb-4 mt-6">$1</h1>');

    // Bold, Italic, and combinations
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold"><em class="italic text-yellow-200">$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-zinc-300">$1</em>');

    // Strikethrough
    html = html.replace(/~~(.*?)~~/g, '<del class="line-through text-zinc-400 opacity-75">$1</del>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">$1</a>');

    // Enhanced blockquotes with multi-line support
    html = html.replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500/50 pl-4 py-2 my-3 bg-blue-500/10 text-zinc-300 italic rounded-r-lg">$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr class="border-white/20 my-6 border-t-2">');
    html = html.replace(/^\*\*\*$/gm, '<hr class="border-white/20 my-6 border-t-2">');

    // Enhanced lists with better spacing
    // Unordered lists
    html = html.replace(/^[\*\-\+] (.*$)/gm, '<li class="text-zinc-300 mb-1 pl-2">$1</li>');
    
    // Ordered lists
    html = html.replace(/^(\d+)\. (.*$)/gm, '<li class="text-zinc-300 mb-1 pl-2" value="$1">$2</li>');

    // Wrap consecutive list items with proper nesting
    html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (match) => {
      if (match.includes('value=')) {
        return `<ol class="my-3 ml-6 space-y-1 list-decimal list-outside">${match}</ol>`;
      } else {
        return `<ul class="my-3 ml-6 space-y-1 list-disc list-outside">${match}</ul>`;
      }
    });

    // Enhanced line break preservation
    // Convert double line breaks to paragraph breaks
    html = html.replace(/\n\n+/g, '</p><p class="mb-4">');
    
    // Convert single line breaks to <br> tags, but not within lists or other block elements
    html = html.replace(/(?<!<\/(?:li|h[1-6]|blockquote|pre)>)\n(?!<(?:li|h[1-6]|blockquote|pre|ol|ul|p))/g, '<br>');
    
    // Wrap content in paragraphs if not already wrapped
    if (!html.startsWith('<') && html.trim()) {
      html = `<p class="mb-4">${html}</p>`;
    }

    // Restore code blocks and inline code
    codeBlocks.forEach((block, index) => {
      html = html.replace(`__CODE_BLOCK_${index}__`, block);
    });
    inlineCodes.forEach((code, index) => {
      html = html.replace(`__INLINE_CODE_${index}__`, code);
    });

    // Clean up empty paragraphs and extra breaks
    html = html.replace(/<p class="mb-4">\s*<\/p>/g, '');
    html = html.replace(/<br>\s*<\/p>/g, '</p>');
    html = html.replace(/<p class="mb-4">\s*<br>/g, '<p class="mb-4">');

    return html;
  };

  // Enhanced toolbar buttons configuration with comprehensive formatting options
  const toolbarButtons: ToolbarButton[] = [
    // Text formatting group
    {
      icon: '𝐁',
      label: 'Bold',
      action: () => insertText('**', '**', 'bold text'),
      shortcut: 'Ctrl+B'
    },
    {
      icon: '𝐼',
      label: 'Italic',
      action: () => insertText('*', '*', 'italic text'),
      shortcut: 'Ctrl+I'
    },
    {
      icon: '𝐒̶',
      label: 'Strikethrough',
      action: () => insertText('~~', '~~', 'strikethrough text'),
      shortcut: 'Ctrl+Shift+X'
    },
    // Headers group
    {
      icon: 'H1',
      label: 'Header 1',
      action: () => insertAtCursor('# '),
      shortcut: 'Ctrl+1'
    },
    {
      icon: 'H2',
      label: 'Header 2',
      action: () => insertAtCursor('## '),
      shortcut: 'Ctrl+2'
    },
    {
      icon: 'H3',
      label: 'Header 3',
      action: () => insertAtCursor('### '),
      shortcut: 'Ctrl+3'
    },
    {
      icon: 'H4',
      label: 'Header 4',
      action: () => insertAtCursor('#### '),
      shortcut: 'Ctrl+4'
    },
    {
      icon: 'H5',
      label: 'Header 5',
      action: () => insertAtCursor('##### '),
      shortcut: 'Ctrl+5'
    },
    {
      icon: 'H6',
      label: 'Header 6',
      action: () => insertAtCursor('###### '),
      shortcut: 'Ctrl+6'
    },
    // Lists group
    {
      icon: '•',
      label: 'Bullet List',
      action: () => insertAtCursor('- '),
      shortcut: 'Ctrl+Shift+8'
    },
    {
      icon: '1.',
      label: 'Numbered List',
      action: () => insertAtCursor('1. '),
      shortcut: 'Ctrl+Shift+7'
    },
    // Special formatting group
    {
      icon: '❝',
      label: 'Blockquote',
      action: () => insertAtCursor('> '),
      shortcut: 'Ctrl+Shift+.'
    },
    {
      icon: '{ }',
      label: 'Code Block',
      action: () => insertText('```\n', '\n```', 'code here'),
      shortcut: 'Ctrl+Shift+C'
    },
    {
      icon: '`',
      label: 'Inline Code',
      action: () => insertText('`', '`', 'code'),
      shortcut: 'Ctrl+E'
    },
    {
      icon: '🔗',
      label: 'Link',
      action: () => insertText('[', '](url)', 'link text'),
      shortcut: 'Ctrl+K'
    },
    {
      icon: '—',
      label: 'Horizontal Rule',
      action: () => insertAtCursor('\n---\n'),
      shortcut: 'Ctrl+Shift+-'
    }
  ];

  // Enhanced keyboard shortcuts handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;

    if (isCtrl) {
      switch (e.key) {
        // Basic formatting
        case 'b':
          e.preventDefault();
          insertText('**', '**', 'bold text');
          break;
        case 'i':
          e.preventDefault();
          insertText('*', '*', 'italic text');
          break;
        case 'k':
          e.preventDefault();
          insertText('[', '](url)', 'link text');
          break;
        case 'e':
          e.preventDefault();
          insertText('`', '`', 'code');
          break;
        
        // Headers (Ctrl+1-6)
        case '1':
          e.preventDefault();
          insertAtCursor('# ');
          break;
        case '2':
          e.preventDefault();
          insertAtCursor('## ');
          break;
        case '3':
          e.preventDefault();
          insertAtCursor('### ');
          break;
        case '4':
          e.preventDefault();
          insertAtCursor('#### ');
          break;
        case '5':
          e.preventDefault();
          insertAtCursor('##### ');
          break;
        case '6':
          e.preventDefault();
          insertAtCursor('###### ');
          break;
      }
    }

    // Shift+Ctrl combinations
    if (isCtrl && isShift) {
      switch (e.key) {
        case 'X':
          e.preventDefault();
          insertText('~~', '~~', 'strikethrough text');
          break;
        case 'C':
          e.preventDefault();
          insertText('```\n', '\n```', 'code here');
          break;
        case '8':
          e.preventDefault();
          insertAtCursor('- ');
          break;
        case '7':
          e.preventDefault();
          insertAtCursor('1. ');
          break;
        case '.':
          e.preventDefault();
          insertAtCursor('> ');
          break;
        case '-':
        case '_':
          e.preventDefault();
          insertAtCursor('\n---\n');
          break;
      }
    }

    // Handle Enter key for automatic line break preservation
    if (e.key === 'Enter' && !isCtrl && !isShift) {
      // Let the default behavior handle the line break
      // The markdown parser will convert it properly in preview
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-zinc-300">
          {label}
        </label>
      )}
      
      {/* Enhanced Toolbar with grouped buttons */}
      <div className="flex flex-wrap items-center gap-1 p-3 bg-black/30 border border-white/10 rounded-lg">
        {/* Text formatting group */}
        <div className="flex items-center gap-1">
          {toolbarButtons.slice(0, 3).map((button, index) => (
            <button
              key={index}
              onClick={button.action}
              className="p-2 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white text-sm font-medium min-w-[32px] h-8 flex items-center justify-center"
              title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
            >
              {button.icon}
            </button>
          ))}
        </div>
        
        <div className="w-px h-6 bg-white/20 mx-1" />
        
        {/* Headers group */}
        <div className="flex items-center gap-1">
          {toolbarButtons.slice(3, 9).map((button, index) => (
            <button
              key={index + 3}
              onClick={button.action}
              className="p-2 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white text-xs font-medium min-w-[28px] h-8 flex items-center justify-center"
              title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
            >
              {button.icon}
            </button>
          ))}
        </div>
        
        <div className="w-px h-6 bg-white/20 mx-1" />
        
        {/* Lists group */}
        <div className="flex items-center gap-1">
          {toolbarButtons.slice(9, 11).map((button, index) => (
            <button
              key={index + 9}
              onClick={button.action}
              className="p-2 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white text-sm font-medium min-w-[32px] h-8 flex items-center justify-center"
              title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
            >
              {button.icon}
            </button>
          ))}
        </div>
        
        <div className="w-px h-6 bg-white/20 mx-1" />
        
        {/* Special formatting group */}
        <div className="flex items-center gap-1">
          {toolbarButtons.slice(11).map((button, index) => (
            <button
              key={index + 11}
              onClick={button.action}
              className="p-2 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white text-sm font-medium min-w-[32px] h-8 flex items-center justify-center"
              title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
            >
              {button.icon}
            </button>
          ))}
        </div>
        
        {showPreview && (
          <>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                isPreviewMode
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              <span>{isPreviewMode ? '📝' : '👁'}</span>
              <span className="hidden sm:inline">{isPreviewMode ? 'Edit' : 'Preview'}</span>
            </button>
          </>
        )}
      </div>

      {/* Editor/Preview Area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {isPreviewMode ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full p-4 bg-black/30 border border-white/10 rounded-xl text-zinc-300 overflow-y-auto"
              style={{ minHeight }}
            >
              {value ? (
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }}
                />
              ) : (
                <div className="text-zinc-500 italic">
                  {placeholder}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.textarea
              key="editor"
              ref={textareaRef}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none font-mono text-sm leading-relaxed"
              placeholder={placeholder}
              style={{ minHeight }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Markdown Help */}
      <div className="text-xs text-zinc-500 space-y-2 bg-black/20 border border-white/5 rounded-lg p-3">
        <div className="text-zinc-400 font-medium mb-2 flex items-center gap-2">
          <span>📖</span>
          <span>Markdown Quick Reference</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Text Formatting */}
          <div className="space-y-1">
            <div className="text-zinc-400 font-medium text-xs mb-1">Text Formatting</div>
            <div><code className="text-zinc-400">**bold**</code> → <strong className="text-white">bold</strong></div>
            <div><code className="text-zinc-400">*italic*</code> → <em className="text-zinc-300">italic</em></div>
            <div><code className="text-zinc-400">~~strike~~</code> → <del className="text-zinc-400">strikethrough</del></div>
            <div><code className="text-zinc-400">`code`</code> → <code className="bg-black/40 text-green-400 px-1 rounded">inline code</code></div>
          </div>
          
          {/* Headers */}
          <div className="space-y-1">
            <div className="text-zinc-400 font-medium text-xs mb-1">Headers</div>
            <div><code className="text-zinc-400"># H1</code> → Large header</div>
            <div><code className="text-zinc-400">## H2</code> → Medium header</div>
            <div><code className="text-zinc-400">### H3</code> → Small header</div>
            <div><code className="text-zinc-400">#### H4-H6</code> → Smaller headers</div>
          </div>
          
          {/* Lists & More */}
          <div className="space-y-1">
            <div className="text-zinc-400 font-medium text-xs mb-1">Lists & More</div>
            <div><code className="text-zinc-400">- item</code> → Bullet list</div>
            <div><code className="text-zinc-400">1. item</code> → Numbered list</div>
            <div><code className="text-zinc-400">&gt; quote</code> → Blockquote</div>
            <div><code className="text-zinc-400">[text](url)</code> → Link</div>
            <div><code className="text-zinc-400">---</code> → Horizontal rule</div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-2 mt-3">
          <div className="text-zinc-400 font-medium text-xs mb-1">💡 Pro Tips</div>
          <div className="text-zinc-500 text-xs space-y-1">
            <div>• Press <kbd className="bg-black/40 px-1 rounded text-zinc-400">Enter</kbd> twice for paragraph breaks</div>
            <div>• Use keyboard shortcuts for faster formatting</div>
            <div>• Toggle preview to see your formatted content</div>
            <div>• Code blocks: wrap with <code className="text-zinc-400">```</code> on separate lines</div>
          </div>
        </div>
      </div>
    </div>
  );
}