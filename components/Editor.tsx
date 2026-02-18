
import React, { useEffect, useRef } from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, language }) => {
  const preRef = useRef<HTMLPreElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize highlighting whenever value or language changes
  useEffect(() => {
    if (preRef.current) {
      // @ts-ignore
      if (window.Prism) {
        // @ts-ignore
        window.Prism.highlightElement(preRef.current);
      }
    }
  }, [value, language]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + "    " + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
    
    // Auto-bracket closing helper
    const pairs: Record<string, string> = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'" };
    if (pairs[e.key]) {
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
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
    'php': 'php'
  };

  const lineCount = value.split('\n').length;

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

  // We ensure a space at the end to help with scrollbar and cursor positioning
  const highlightedValue = value + (value.endsWith('\n') ? ' ' : '');

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
          {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
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
              opacity: 0.8 // Lowered slightly so the direct typing is very clear
            }}
          >
            <code className={`language-${prismLangMap[language] || 'javascript'}`}>{highlightedValue}</code>
          </pre>

          {/* Layer 2: The Direct User Input Area */}
          <textarea
            ref={textAreaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoFocus
            className="absolute inset-0 bg-transparent outline-none resize-none custom-scrollbar z-10"
            style={{ 
              ...sharedStyles,
              color: '#ffffff', // VISIBLE WHITE TEXT
              caretColor: '#6366f1',
              WebkitTextFillColor: '#ffffff', // Ensures visibility in Safari/Chrome
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
