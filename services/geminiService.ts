
import { GoogleGenAI, Type } from "@google/genai";
import { ProblemStatement, Difficulty, EvaluationResult, BugHuntChallenge, SupportedLanguage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProblem = async (topic: string, difficulty: Difficulty, language: SupportedLanguage): Promise<ProblemStatement> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a real-world mini project for the topic "${topic}" at the "${difficulty}" difficulty level using "${language}".
    
    CRITICAL FORMATTING RULES:
    1. The 'starterCode' MUST be syntactically correct and perfectly indented line-by-line.
    2. 'expectedOutput' must represent exactly what the user should see in a console if their solution is correct.
    3. Ensure the project is realistically scoped for the difficulty level.
    
    Difficulty Scoping:
    - EASY: Single function or simple logic.
    - MEDIUM: Multi-step logic with data processing.
    - HARD: Complex data structures, optimizations, or mini-engines.

    Requirements:
    - title: Unique name for the challenge.
    - scenario: Why is the learner building this?
    - requirements: Bullet points of features to implement.
    - constraints: Technical rules to follow.
    - starterCode: The base code provided to the user.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          scenario: { type: Type.STRING },
          requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
          constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
          expectedOutput: { type: Type.STRING },
          starterCode: { type: Type.STRING },
          language: { type: Type.STRING },
          difficulty: { type: Type.STRING }
        },
        required: ["id", "title", "scenario", "requirements", "constraints", "expectedOutput", "starterCode", "language", "difficulty"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const evaluateCode = async (problem: ProblemStatement | BugHuntChallenge, userCode: string, attempts: number): Promise<EvaluationResult> => {
  const isBugHunt = 'buggyCode' in problem;
  
  // Logic for progressive hints based on attempts
  let hintInstructions = "";
  if (attempts === 1) {
    hintInstructions = "Be encouraging. Provide high-level conceptual feedback only.";
  } else if (attempts === 2) {
    hintInstructions = "Identify the specific line or logic block that is failing, but don't give the answer.";
  } else if (attempts === 3) {
    hintInstructions = "Provide a very strong hint about the syntax or logic needed to fix the issue.";
  } else {
    hintInstructions = "The user is struggling. Provide a small code snippet in the 'extraHint' field that shows exactly how to solve the most difficult part of the problem.";
  }

  const prompt = isBugHunt 
    ? `System: Expert Code Reviewer. 
       Challenge: ${problem.title}. 
       Topic: Fix the buggy ${problem.language} code. 
       Attempt Number: ${attempts}.
       Feedback Strategy: ${hintInstructions}
       User Code: \n${userCode}\n
       Task: Check if the user successfully fixed the bugs mentioned in the context: ${problem.context}. 
       Return deep logical feedback.
       CRITICAL: The 'explanation' field must provide a clear, concise, and beginner-friendly breakdown of why the code failed or what bugs remain. Use simple analogies and avoid overly dense jargon.`
    : `System: Expert Code Reviewer. 
       Challenge: ${problem.title}. 
       Language: ${problem.language}.
       Attempt Number: ${attempts}.
       Feedback Strategy: ${hintInstructions}
       User Code: \n${userCode}\n
       Constraints: ${(problem as ProblemStatement).constraints.join(", ")}.
       Expected Result: ${(problem as ProblemStatement).expectedOutput}.
       Task: Evaluate the code against the requirements and scenario. Be encouraging but rigorous.
        CRITICAL: The 'explanation' field must provide a clear, concise, and beginner-friendly breakdown of any issues found. Explain the "why" behind the logic in simple terms.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          passed: { type: Type.BOOLEAN },
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          explanation: { type: Type.STRING },
          suggestedCode: { type: Type.STRING },
          extraHint: { type: Type.STRING }
        },
        required: ["passed", "score", "feedback", "explanation", "suggestedCode"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateBugHunt = async (topic: string, language: SupportedLanguage): Promise<BugHuntChallenge> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a 'Bug Hunt' challenge for "${topic}" in "${language}".
    
    The 'buggyCode' should contain 1-3 subtle logical or syntax errors.
    The 'context' should explain what the code is *supposed* to do.
    The 'hint' should give a cryptic but helpful clue about where the bug lies.
    
    Ensure 'buggyCode' is properly indented line-by-line.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          buggyCode: { type: Type.STRING },
          context: { type: Type.STRING },
          language: { type: Type.STRING },
          hint: { type: Type.STRING }
        },
        required: ["id", "title", "buggyCode", "context", "language", "hint"]
      }
    }
  });

  return JSON.parse(response.text);
};
