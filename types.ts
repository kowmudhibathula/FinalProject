
export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum TopicCategory {
  PROGRAMMING = 'PROGRAMMING',
  WEB_TECH = 'WEB_TECH'
}

export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'c' | 'cpp' | 'php' | 'html' | 'css';

export interface Topic {
  id: string;
  name: string;
  category: TopicCategory;
  description: string;
  icon: string;
  supportedLanguages: SupportedLanguage[];
}

export interface ProblemStatement {
  id: string;
  title: string;
  scenario: string;
  requirements: string[];
  constraints: string[];
  expectedOutput: string;
  starterCode: string;
  language: SupportedLanguage;
  difficulty: Difficulty;
}

export interface EvaluationResult {
  passed: boolean;
  score: number;
  feedback: string;
  explanation: string;
  suggestedCode: string;
  extraHint?: string;
}

export interface BugHuntChallenge {
  id: string;
  title: string;
  buggyCode: string;
  context: string;
  language: SupportedLanguage;
  hint: string;
}

export interface CompletedChallenge {
  id: string;
  title: string;
  mode: 'project' | 'bughunt';
  language: SupportedLanguage;
  difficulty?: Difficulty;
  completedAt: string;
  score: number;
}

export interface Progress {
  completedTopics: string[];
  completedChallenges: CompletedChallenge[];
  points: number;
  skillLevels: Record<string, number>; // topicId -> level (0-100)
}
