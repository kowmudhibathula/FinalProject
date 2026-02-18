
import React, { useState, useEffect, useRef } from 'react';
import { Topic, ProblemStatement, EvaluationResult, BugHuntChallenge, Progress, Difficulty, SupportedLanguage, CompletedChallenge } from './types';
import { TOPICS, APP_NAME } from './constants';
import SkillMap from './components/SkillMap';
import Editor from './components/Editor';
import { generateProblem, evaluateCode, generateBugHunt } from './services/geminiService';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'difficulty' | 'language' | 'problem' | 'bughunt' | 'history'>('dashboard');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [activeMode, setActiveMode] = useState<'project' | 'bughunt'>('project');
  
  const [problem, setProblem] = useState<ProblemStatement | null>(null);
  const [bugHunt, setBugHunt] = useState<BugHuntChallenge | null>(null);
  const [userCode, setUserCode] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [progress, setProgress] = useState<Progress>({
    completedTopics: [],
    completedChallenges: [],
    points: 0,
    skillLevels: {}
  });

  const challengeContextRef = useRef<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('fm_progress');
    const auth = localStorage.getItem('fm_auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.completedChallenges) parsed.completedChallenges = [];
      setProgress(parsed);
    }
    if (auth) {
      setIsLoggedIn(true);
      setUserEmail(auth);
    }
  }, []);

  useEffect(() => {
    if (challengeContextRef.current && userCode) {
      localStorage.setItem(`fm_autosave_${challengeContextRef.current}`, userCode);
    }
  }, [userCode]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail.trim()) {
      setIsLoggedIn(true);
      localStorage.setItem('fm_auth', userEmail);
    }
  };

  const startFlow = (topic: Topic, mode: 'project' | 'bughunt') => {
    setSelectedTopic(topic);
    setActiveMode(mode);
    if (mode === 'project') {
      setCurrentView('difficulty');
    } else {
      setCurrentView('language');
    }
  };

  const handleDifficultySelection = (diff: Difficulty) => {
    setSelectedDifficulty(diff);
    setCurrentView('language');
  };

  const handleStartChallenge = async (lang: SupportedLanguage) => {
    setIsLoading(true);
    const challengeKey = `${selectedTopic?.id}_${activeMode}_${selectedDifficulty}_${lang}`;
    challengeContextRef.current = challengeKey;

    try {
      if (activeMode === 'project') {
        const newProblem = await generateProblem(selectedTopic!.name, selectedDifficulty, lang);
        setProblem(newProblem);
        const savedCode = localStorage.getItem(`fm_autosave_${challengeKey}`);
        setUserCode(savedCode || newProblem.starterCode);
        setCurrentView('problem');
      } else {
        const newBugHunt = await generateBugHunt(selectedTopic!.name, lang);
        setBugHunt(newBugHunt);
        const savedCode = localStorage.getItem(`fm_autosave_${challengeKey}`);
        setUserCode(savedCode || newBugHunt.buggyCode);
        setCurrentView('bughunt');
      }
      setEvaluation(null);
      setAttempts(0);
    } catch (err: any) {
      alert(`AI System Failure: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCode = () => {
    if (confirm("Reset current buffer and discard changes?")) {
      const originalCode = activeMode === 'project' ? problem?.starterCode : bugHunt?.buggyCode;
      if (originalCode) setUserCode(originalCode);
    }
  };

  const handleSubmitCode = async () => {
    if (!problem && !bugHunt) return;
    setIsLoading(true);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    try {
      const targetChallenge = activeMode === 'project' ? problem! : bugHunt!;
      const result = await evaluateCode(targetChallenge as any, userCode, newAttempts);
      setEvaluation(result);
      
      if (result.passed) {
        if (challengeContextRef.current) localStorage.removeItem(`fm_autosave_${challengeContextRef.current}`);
        
        const bonus = activeMode === 'bughunt' ? 40 : (selectedDifficulty === Difficulty.HARD ? 100 : 50);
        
        const newEntry: CompletedChallenge = {
          id: targetChallenge.id,
          title: targetChallenge.title,
          mode: activeMode,
          language: targetChallenge.language,
          difficulty: activeMode === 'project' ? (targetChallenge as ProblemStatement).difficulty : undefined,
          completedAt: new Date().toISOString(),
          score: result.score
        };

        const updatedProgress = {
          ...progress,
          points: progress.points + bonus,
          completedTopics: Array.from(new Set([...progress.completedTopics, selectedTopic!.id])),
          completedChallenges: [newEntry, ...progress.completedChallenges],
          skillLevels: {
            ...progress.skillLevels,
            [selectedTopic!.id]: Math.min(100, (progress.skillLevels[selectedTopic!.id] || 0) + 15)
          }
        };
        setProgress(updatedProgress);
        localStorage.setItem('fm_progress', JSON.stringify(updatedProgress));
      }
    } catch (err: any) {
      alert(`Evaluation failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    const wantsToProceed = confirm("Your Mastery Report is ready. In the next window, please select 'Save as PDF' from the destination menu to download your certificate.");
    if (wantsToProceed) {
      window.print();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-6 relative overflow-hidden">
        <div className="max-w-md w-full bg-[#161b22]/80 backdrop-blur-xl p-14 rounded-[3.5rem] shadow-2xl border border-white/5 relative z-10">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black mx-auto mb-8 shadow-2xl shadow-indigo-600/20">FM</div>
            <h1 className="text-3xl font-black text-white tracking-tighter mb-2">{APP_NAME}</h1>
            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Mastery Learning Platform</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="email" required value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full bg-[#0d1117] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium placeholder-slate-700"
              placeholder="Enter your email"
            />
            <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 text-lg uppercase tracking-tight">Start Learning</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
      {/* PROFESSIONAL CERTIFICATE & REPORT VIEW (VISIBLE ONLY DURING PRINT) */}
      <div className="hidden print:block bg-white p-12 min-h-screen border-[16px] border-indigo-50">
        <div className="border-2 border-indigo-200 p-12 h-full relative">
           <div className="absolute top-8 right-8 w-32 h-32 border-4 border-indigo-600 rounded-full flex items-center justify-center rotate-12 opacity-20">
              <span className="text-indigo-800 font-black text-center text-xs uppercase tracking-tighter">Verified<br/>Mastery</span>
           </div>
           <header className="mb-12 border-b-2 border-slate-100 pb-8">
              <div className="flex justify-between items-end">
                 <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-1 uppercase">{APP_NAME}</h1>
                    <p className="text-indigo-600 font-black text-sm uppercase tracking-[0.3em]">Official Mastery Certificate</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Issue Date</p>
                    <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
                 </div>
              </div>
           </header>
           <div className="mb-16">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Authenticated Learner</p>
              <h2 className="text-3xl font-black text-slate-900">{userEmail}</h2>
           </div>
           <div className="grid grid-cols-3 gap-8 mb-16">
              <div className="bg-slate-50 p-6 rounded-2xl">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total XP Earned</p>
                 <p className="text-3xl font-black text-indigo-600">{progress.points}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Modules Completed</p>
                 <p className="text-3xl font-black text-emerald-600">{progress.completedChallenges.length}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Topics Mastered</p>
                 <p className="text-3xl font-black text-slate-900">{progress.completedTopics.length}</p>
              </div>
           </div>
           <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6 border-b border-slate-100 pb-2">Mastery Log</h3>
           <table className="w-full text-left">
              <thead>
                 <tr className="text-[10px] font-black text-slate-400 uppercase">
                    <th className="py-3">Challenge Name</th>
                    <th className="py-3">Language</th>
                    <th className="py-3">Difficulty</th>
                    <th className="py-3 text-right">Mastery Score</th>
                 </tr>
              </thead>
              <tbody>
                 {progress.completedChallenges.map((c, i) => (
                    <tr key={i} className="border-b border-slate-50 text-xs font-bold text-slate-700">
                       <td className="py-4">{c.title}</td>
                       <td className="py-4 uppercase text-[10px]">{c.language}</td>
                       <td className="py-4 uppercase text-[10px]">{c.difficulty || 'Bug Hunt'}</td>
                       <td className="py-4 text-right font-black text-slate-900">{c.score}%</td>
                    </tr>
                 ))}
              </tbody>
           </table>
           <footer className="mt-20 pt-8 border-t-2 border-slate-100 flex justify-between items-center opacity-50">
              <div className="text-[9px] font-black text-slate-400 uppercase leading-tight">
                 Generated by Foundational Mastery AI Platform<br/>
                 Security Hash: {Math.random().toString(36).substring(2, 15).toUpperCase()}
              </div>
           </footer>
        </div>
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden shrink-0 h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black group-hover:scale-110 transition-transform">FM</div>
            <h1 className="text-lg font-black text-slate-900 tracking-tighter hidden sm:block">{APP_NAME}</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <button onClick={() => setCurrentView('history')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>📜 Mastery History</button>
             <div className="bg-slate-900 px-3 py-1.5 rounded-xl text-indigo-400 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/10">⚡ {progress.points} XP</div>
             <button onClick={() => setIsLoggedIn(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 transition-colors">🚪</button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-8 print:hidden overflow-hidden flex flex-col">
        {isLoading && (
          <div className="fixed inset-0 bg-[#0d1117]/60 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl text-center">
               <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Processing Node</p>
            </div>
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 animate-in fade-in duration-500 overflow-hidden">
            <div className="lg:col-span-2 space-y-12 overflow-y-auto pr-2 pb-24 custom-scrollbar">
              <div className="flex justify-between items-center sticky top-0 bg-[#f8fafc] z-10 py-2">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Choose Your Path</h2>
                <button onClick={downloadReport} className="text-[9px] font-black uppercase text-indigo-600 border-2 border-indigo-100 px-4 py-2 rounded-xl hover:bg-white transition-all shadow-sm">📥 Detailed Report</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {TOPICS.map(topic => (
                  <div key={topic.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                    <div className="text-3xl mb-6 flex items-center justify-center w-14 h-14 bg-slate-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">{topic.icon}</div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">{topic.name}</h3>
                    <p className="text-slate-400 text-[11px] font-medium leading-relaxed mb-8 flex-grow">{topic.description}</p>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => startFlow(topic, 'project')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-indigo-600 transition-colors shadow-lg">🚀 Project Challenge</button>
                      <button onClick={() => startFlow(topic, 'bughunt')} className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:border-rose-500 hover:text-rose-500 transition-colors">🔎 Bug Hunt</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-1 hidden lg:block overflow-y-auto custom-scrollbar">
              <div className="sticky top-0">
                <SkillMap progress={progress} />
              </div>
            </div>
          </div>
        )}

        {currentView === 'difficulty' && (
          <div className="max-w-xl mx-auto py-20 w-full animate-in zoom-in-95 duration-300 flex flex-col h-full overflow-y-auto custom-scrollbar">
             <div className="grid gap-6 pb-20">
                {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map(level => (
                  <button key={level} onClick={() => handleDifficultySelection(level)} className="p-10 bg-white border border-slate-200 rounded-[2.5rem] hover:shadow-2xl hover:border-indigo-400 transition-all text-left flex items-center justify-between group">
                    <div className="flex items-center gap-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg ${level === Difficulty.EASY ? 'bg-emerald-500' : level === Difficulty.MEDIUM ? 'bg-amber-500' : 'bg-rose-500'}`}>{level[0]}</div>
                      <div>
                        <span className="text-3xl font-black text-slate-900 block">{level}</span>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mastery Level</span>
                      </div>
                    </div>
                  </button>
                ))}
                <button onClick={() => setCurrentView('dashboard')} className="mt-12 text-center text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors">← Back to Dashboard</button>
             </div>
          </div>
        )}

        {currentView === 'language' && (
          <div className="max-w-2xl mx-auto py-20 w-full text-center animate-in zoom-in-95 duration-300 flex flex-col h-full overflow-y-auto custom-scrollbar">
            <h2 className="text-4xl font-black text-slate-900 mb-12 tracking-tighter leading-none">Choose the Language</h2>
            <div className="grid grid-cols-2 gap-6 pb-20">
              {selectedTopic?.supportedLanguages.map(lang => (
                <button key={lang} onClick={() => handleStartChallenge(lang)} className="p-12 bg-slate-900 text-white rounded-[2.5rem] hover:bg-indigo-600 hover:scale-[1.05] transition-all text-2xl font-black capitalize shadow-2xl relative overflow-hidden group">
                  <span className="relative z-10">{lang === 'cpp' ? 'C++' : lang}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentView('dashboard')} className="mt-8 text-center text-slate-400 font-black uppercase tracking-widest text-[9px] hover:text-slate-900 transition-colors">Reset Selection</button>
          </div>
        )}

        {(currentView === 'problem' || currentView === 'bughunt') && (
          <div className="h-full flex flex-col gap-8 animate-in slide-in-from-bottom-8 duration-700 overflow-y-auto custom-scrollbar pb-24">
             <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm shrink-0">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-10">
                  <div className={`w-20 h-20 shrink-0 flex items-center justify-center rounded-3xl text-4xl text-white shadow-2xl ${activeMode === 'project' ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-rose-600 shadow-rose-600/20'}`}>
                    {activeMode === 'project' ? '🚀' : '🔎'}
                  </div>
                  <div className="flex-grow">
                    <div className="flex flex-wrap gap-3 mb-3">
                      <span className="px-4 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600">{activeMode === 'project' ? problem?.language : bugHunt?.language}</span>
                      <span className={`px-4 py-1.5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest ${activeMode === 'project' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
                        {activeMode === 'project' ? problem?.difficulty : 'DEBUGGING'}
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{activeMode === 'project' ? problem?.title : bugHunt?.title}</h2>
                  </div>
                  {evaluation && (
                    <div className={`px-10 py-5 rounded-[2rem] font-black text-3xl shadow-2xl animate-bounce text-white ${evaluation.passed ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                      {evaluation.score}%
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <section>
                         <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] mb-4">The Scenario</h4>
                         <p className="text-slate-600 text-xl font-semibold leading-relaxed tracking-tight">{activeMode === 'project' ? problem?.scenario : bugHunt?.context}</p>
                      </section>
                      {activeMode === 'project' && problem?.constraints && problem.constraints.length > 0 && (
                        <section className="pt-6 border-t border-slate-100">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Technical Constraints</h4>
                          <ul className="space-y-3">
                            {problem.constraints.map((con, i) => (
                              <li key={i} className="flex gap-4 items-start">
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 bg-rose-400 shrink-0"></span>
                                <span className="text-slate-500 font-bold text-xs leading-snug">{con}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                   </div>
                   <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-10">
                      <section>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">Mission Requirements</h4>
                        <ul className="space-y-4">
                          {(activeMode === 'project' ? problem?.requirements : ["Fix logical flaws", "Ensure code execution"])?.map((req, i) => (
                            <li key={i} className="flex gap-4 items-start">
                              <span className="w-2 h-2 rounded-full mt-2 bg-indigo-600 shrink-0"></span>
                              <span className="text-slate-700 font-bold text-sm leading-snug">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                      {activeMode === 'project' && problem?.expectedOutput && (
                        <section className="pt-6 border-t border-slate-200/60">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Expected Results</h4>
                          <div className="bg-slate-900 p-4 rounded-2xl font-mono text-[11px] text-emerald-400 whitespace-pre-wrap break-words shadow-inner">
                            {problem.expectedOutput}
                          </div>
                        </section>
                      )}
                   </div>
                </div>
             </div>
             <div className="flex flex-col gap-6">
                <div className="h-[700px] shadow-2xl relative">
                  <Editor value={userCode} onChange={setUserCode} language={activeMode === 'project' ? (problem?.language as string) : (bugHunt?.language as string)} />
                </div>
                <div className="flex justify-between items-center pt-2 pb-12">
                  <button onClick={() => setCurrentView('dashboard')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-8 py-3 hover:text-slate-900 transition-colors">Terminate</button>
                  <button onClick={handleSubmitCode} className={`px-10 py-3.5 text-white font-black rounded-xl shadow-xl uppercase tracking-tight transition-all active:scale-95 ${activeMode === 'project' ? 'bg-indigo-600' : 'bg-rose-600'}`}>Run Code ⚡</button>
                </div>
             </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="h-full flex flex-col max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-500 overflow-hidden">
             <div className="border-b border-slate-100 pb-8 flex justify-between items-center shrink-0">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Mastery Record</h2>
                <button onClick={downloadReport} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Download Report</button>
             </div>
             <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-12">
              {progress.completedChallenges.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">No mastery records indexed yet.</div>
              ) : (
                progress.completedChallenges.map((c, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black ${c.mode === 'project' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
                        {c.mode === 'project' ? '🚀' : '🔎'}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900">{c.title}</h4>
                        <p className="text-[9px] font-black uppercase text-indigo-400">{c.language} • {new Date(c.completedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400">Score</p>
                      <p className="text-2xl font-black text-slate-900">{c.score}%</p>
                    </div>
                  </div>
                ))
              )}
             </div>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
