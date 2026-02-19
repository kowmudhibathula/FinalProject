
import { Topic, TopicCategory } from './types';

const PROGRAMMING_CORE = ['c', 'cpp', 'java', 'python'] as any[];

export const TOPICS: Topic[] = [
  // CORE BASICS
  { id: 'datatypes', name: 'Data Types', category: TopicCategory.PROGRAMMING, description: 'Variables, memory types, and basic values.', icon: '📦', supportedLanguages: PROGRAMMING_CORE },
  { id: 'controlflow', name: 'Control Flow', category: TopicCategory.PROGRAMMING, description: 'If-else logic, switch cases, and conditions.', icon: '🚦', supportedLanguages: PROGRAMMING_CORE },
  { id: 'loops', name: 'Loops', category: TopicCategory.PROGRAMMING, description: 'Iterative logic with for, while, and do-while.', icon: '🔄', supportedLanguages: PROGRAMMING_CORE },
  
  // INTERMEDIATE
  { id: 'functions', name: 'Functions', category: TopicCategory.PROGRAMMING, description: 'Reusable blocks, parameters, and returns.', icon: '🛠️', supportedLanguages: PROGRAMMING_CORE },
  { id: 'arrays', name: 'Arrays', category: TopicCategory.PROGRAMMING, description: 'Storing collections of data in indexed lists.', icon: '📊', supportedLanguages: PROGRAMMING_CORE },
  { id: 'strings', name: 'Strings', category: TopicCategory.PROGRAMMING, description: 'Text manipulation, searching, and formatting.', icon: '🔤', supportedLanguages: PROGRAMMING_CORE },
  
  // ADVANCED
  { id: 'pointers', name: 'Pointers', category: TopicCategory.PROGRAMMING, description: 'Memory addresses and direct memory access.', icon: '📍', supportedLanguages: ['c', 'cpp'] },
  { id: 'structures', name: 'OOP & Structs', category: TopicCategory.PROGRAMMING, description: 'Objects, classes, and custom data structures.', icon: '🏗️', supportedLanguages: PROGRAMMING_CORE },
  { id: 'filehandling', name: 'File Handling', category: TopicCategory.PROGRAMMING, description: 'Reading from and writing to disk storage.', icon: '💾', supportedLanguages: PROGRAMMING_CORE },
  { id: 'concurrency', name: 'Concurrency', category: TopicCategory.PROGRAMMING, description: 'Multi-threading and async operations.', icon: '🧵', supportedLanguages: ['java', 'python', 'cpp'] },

  // WEB
  { id: 'html', name: 'HTML', category: TopicCategory.WEB_TECH, description: 'Building the structure of the web.', icon: '🌐', supportedLanguages: ['html'] },
  { id: 'css', name: 'CSS', category: TopicCategory.WEB_TECH, description: 'Styling and layout for user interfaces.', icon: '🎨', supportedLanguages: ['css'] },
  { id: 'javascript', name: 'JavaScript', category: TopicCategory.WEB_TECH, description: 'Adding interactivity and logic to pages.', icon: '⚡', supportedLanguages: ['javascript'] },
 // BACKEND
  { id: 'nodejs', name: 'Node.js', category: TopicCategory.BACKEND, description: 'Server-side JavaScript runtime environment.', icon: '🟢', supportedLanguages: ['nodejs'] },
  { id: 'express', name: 'Express.js', category: TopicCategory.BACKEND, description: 'Fast, unopinionated, minimalist web framework.', icon: '🚂', supportedLanguages: ['express'] },
  { id: 'php_backend', name: 'PHP Backend', category: TopicCategory.BACKEND, description: 'Server-side scripting for dynamic web pages.', icon: '🐘', supportedLanguages: ['php'] },
];

export const APP_NAME = "Foundational Mastery";
