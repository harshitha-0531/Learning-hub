
import { GoogleGenAI, Type } from "@google/genai";
import { LearningPathItem, QuizQuestion, SkillGap, Course, MicroLesson } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Wraps API calls to catch 429 Quota Exhausted errors and other potential failures.
 * Returns a human-readable error message that the UI can display gracefully.
 */
async function safeApiCall<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error: any) {
    if (error?.message?.includes('429')) {
      throw new Error("EduAI is taking a quick break (Rate Limit reached). Please try again in 30 seconds!");
    }
    console.error("Gemini API Error:", error);
    throw new Error("Something went wrong with the AI service. Please try again later.");
  }
}

export const geminiService = {
  async generateLearningPath(goal: string, currentLevel: string): Promise<LearningPathItem[]> {
    return safeApiCall(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a 4-week structured learning roadmap for a ${currentLevel} learner aiming to become a ${goal}. Return exactly 4 items, one for each week.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                week: { type: Type.INTEGER },
                topic: { type: Type.STRING },
                description: { type: Type.STRING },
                estimatedHours: { type: Type.INTEGER }
              },
              required: ["week", "topic", "description", "estimatedHours"]
            }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    });
  },

  async exploreCareerPath(interestOrSkills: string): Promise<{
    title: string;
    description: string;
    salaryRange: string;
    demandLevel: string;
    requiredSkills: string[];
    potentialRoles: string[];
  }> {
    return safeApiCall(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the career path for: "${interestOrSkills}". Provide a realistic profile with current market trends including salary and demand.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              salaryRange: { type: Type.STRING },
              demandLevel: { type: Type.STRING },
              requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              potentialRoles: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "description", "salaryRange", "demandLevel", "requiredSkills", "potentialRoles"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  async generateMicroLesson(topic: string): Promise<MicroLesson> {
    return safeApiCall(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a 5-minute micro-lesson about "${topic}". Provide a clear educational Concept, Short Notes (key takeaways), and 2 quiz questions for assessment.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              content: { type: Type.STRING, description: 'The educational Concept text' },
              duration: { type: Type.STRING },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    skillTag: { type: Type.STRING }
                  },
                  required: ["id", "question", "options", "correctAnswer", "explanation", "skillTag"]
                }
              }
            },
            required: ["id", "title", "description", "content", "duration", "quiz"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  async getChatbotResponse(message: string): Promise<string> {
    return safeApiCall(async () => {
      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: { systemInstruction: 'You are EduAI assistant. Be helpful, concise, and professional.' }
      });
      const response = await chat.sendMessage({ message });
      return response.text || '';
    });
  },

  async getCourseErrorAnalysis(courseTitle: string, failures: any[]): Promise<string> {
    return safeApiCall(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze the following student quiz failures for the course "${courseTitle}": ${JSON.stringify(failures)}. Identify conceptual misunderstandings and suggest curriculum improvements.`,
        config: {
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });
      return response.text || "No analysis could be generated at this time.";
    });
  }
};
