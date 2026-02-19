
import React, { useEffect, useRef } from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, language, placeholder }) => {
  const preRef = useRef<HTMLPreElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const start = e.currentTarget.selectionStart;
    const end = e.currentTarget.selectionEnd;

    if (e.key === 'Tab') {
      e.preventDefault();
      const newValue = value.substring(0, start) + "    " + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = start + 4;
        }
      }, 0);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const lines = value.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];
      const indentation = currentLine.match(/^\s*/)?.[0] || "";
      
      let extraIndentation = "";
      const lastChar = currentLine.trim().slice(-1);
      if (lastChar === '{' || lastChar === ':' || lastChar === '[') {
        extraIndentation = "    ";
      }

      const newValue = value.substring(0, start) + "\n" + indentation + extraIndentation + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = start + 1 + indentation.length + extraIndentation.length;
        }
      }, 0);
      return;
    }

    const pairs: Record<string, string> = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'" };
    
    // Auto-closing brackets
    if (pairs[e.key]) {
      if (start === end) {
        e.preventDefault();
        const newValue = value.substring(0, start) + e.key + pairs[e.key] + value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          if (textAreaRef.current) {
            textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = start + 1;
          }
        }, 0);
      }
      return;
    }

    // Overtyping closing brackets
    const closingBrackets = [')', '}', ']', '"', "'"];
    if (closingBrackets.includes(e.key) && start === end && value[start] === e.key) {
      e.preventDefault();
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = start + 1;
        }
      }, 0);
      return;
    }

    // Deleting pairs
    if (e.key === 'Backspace' && start === end && start > 0) {
      const charBefore = value[start - 1];
      const charAfter = value[start];
      if (pairs[charBefore] === charAfter) {
        e.preventDefault();
        const newValue = value.substring(0, start - 1) + value.substring(start + 1);
        onChange(newValue);
        setTimeout(() => {
          if (textAreaRef.current) {
            textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = start - 1;
          }
        }, 0);
      }
    }
  };

  const prismLangMap: Record<string, string> = {
    'python': 'python',
    'javascript': 'javascript',
    'c': 'c',
    'cpp': 'cpp',
    'java': 'java',
    'html': 'html',
    'css': 'css',
    'php': 'php',
    'nodejs': 'javascript',
    'express': 'javascript'
  };

  const sharedStyles: React.CSSProperties = {
    fontFamily: "'Fira Code', 'Courier New', monospace",
    lineHeight: '28px',
    fontSize: '15px',
    tabSize: 4,
    letterSpacing: 'normal',
    fontVariantLigatures: 'none',
    padding: '32px',
    margin: 0,
    border: 'none',
    boxSizing: 'border-box',
    width: '100%',
    height: '100%',
    whiteSpace: 'pre',
    wordWrap: 'normal',
    textAlign: 'left'
  };

  const isPlaceholder = !value && !!placeholder;
  const displayValue = isPlaceholder ? (placeholder || '') : value;
  const lineCount = Math.max(displayValue.split('\n').length, 1);
  const highlightedValue = displayValue + (displayValue.endsWith('\n') ? ' ' : '');

  const getHighlightedCode = () => {
    // @ts-ignore
    if (window.Prism && value) {
      const lang = prismLangMap[language] || 'javascript';
      // @ts-ignore
      const grammar = window.Prism.languages[lang] || window.Prism.languages.javascript;
      if (grammar) {
        // @ts-ignore
        return window.Prism.highlight(value, grammar, lang);
      }
    }
    // Fallback: Escape HTML and return raw text
    return highlightedValue
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
      {/* Editor Header */}
      <div className="bg-[#161b22] px-8 py-5 flex justify-between items-center border-b border-slate-800 z-30 shrink-0">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{language} Engine</span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Workspace.src</span>
        </div>
      </div>
      
      <div className="flex-grow flex relative bg-[#0d1117] min-h-0">
        {/* Line Numbers Column */}
        <div className="w-16 bg-[#0d1117] border-r border-slate-800/50 flex flex-col items-center pt-8 select-none text-slate-700 text-[12px] font-bold z-20 shrink-0 overflow-hidden">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="h-[28px] flex items-center justify-end w-full pr-5">{i + 1}</div>
          ))}
        </div>
        
        {/* Content Layers */}
        <div className="relative flex-grow h-full min-h-0 overflow-hidden">
          {/* Layer 1: The Syntax Highlighted Background */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className={`language-${prismLangMap[language] || 'javascript'} absolute inset-0 pointer-events-none z-0 overflow-hidden`}
            style={{ 
              ...sharedStyles,
              color: '#ffffff',
              background: 'transparent',
              opacity: isPlaceholder ? 0.3 : 1
            }}
          >
            <code 
              className={`language-${prismLangMap[language] || 'javascript'}`}
              dangerouslySetInnerHTML={{ __html: getHighlightedCode() }}
            />
          </pre>

          {/* Layer 2: The Direct User Input Area */}
          <textarea
            ref={textAreaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            spellCheck={false}
            autoFocus
            className="absolute inset-0 bg-transparent outline-none resize-none custom-scrollbar z-10"
            style={{ 
              ...sharedStyles,
              color: 'transparent',
              caretColor: '#6366f1',
              WebkitTextFillColor: 'transparent',
              overflow: 'auto'
            }}
          />
        </div>
      </div>
      
      {/* Footer Info Bar */}
      <div className="bg-[#161b22] px-8 py-3 flex justify-between items-center border-t border-slate-800 z-30 shrink-0">
        <div className="flex gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">LN</span>
            <span className="text-white">{value.split('\n', (textAreaRef.current?.selectionStart || 0) + 1).length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">COL</span>
            <span className="text-white">{(textAreaRef.current?.selectionStart || 0) - value.lastIndexOf('\n', (textAreaRef.current?.selectionStart || 0) - 1)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Active Learning Sync</span>
        </div>
      </div>

      <style>{`
        /* Sync Prism padding exactly with textarea padding */
        pre[class*="language-"] { 
          padding: 32px !important; 
          margin: 0 !important;
          background: transparent !important;
        }
        
        textarea::selection {
          background: rgba(99, 102, 241, 0.4);
          color: white;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0d1117;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #21262d;
          border-radius: 5px;
          border: 2px solid #0d1117;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #30363d;
        }
      `}</style>
    </div>
  );
};

export default Editor;
