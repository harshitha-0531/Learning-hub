
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LearningPathItem, QuizQuestion, SkillGap, Course, MicroLesson, QuizBank } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function safeApiCall<T>(call: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await call();
  } catch (error: any) {
    const errText = error?.message || '';
    const isRateLimit = errText.includes('429') || errText.includes('RESOURCE_EXHAUSTED') || error?.status === 429;
    
    if (isRateLimit && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return safeApiCall(call, retries - 1);
    }
    
    if (isRateLimit) {
      throw new Error("The AI service is currently busy. Please wait a few seconds.");
    }
    
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export const geminiService = {
  async generateLearningPath(goal: string, currentLevel: string): Promise<LearningPathItem[]> {
    return safeApiCall(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a 4-week structured learning roadmap for a ${currentLevel} learner aiming to become a ${goal}.`,
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

  async generateQuizModule(courseTitle: string, moduleTitle: string, difficulty: string): Promise<QuizBank> {
    return safeApiCall(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a 5-question quiz module titled "${moduleTitle}" for the course "${courseTitle}". Difficulty: ${difficulty}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              questions: {
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
            required: ["id", "title", "description", "difficulty", "questions"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  async getChatbotResponse(message: string, history: any[] = [], context: string = ''): Promise<string> {
    return safeApiCall(async () => {
      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: { 
          systemInstruction: `You are EduAI assistant. ${context}. Maintain helpful tone.`,
        },
        history: history
      });
      const response = await chat.sendMessage({ message });
      return response.text || '';
    });
  },

  async generateMicroLesson(topic: string): Promise<MicroLesson> {
    return safeApiCall(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a micro-lesson about "${topic}".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              content: { type: Type.STRING },
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
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  async exploreCareerPath(interestOrSkills: string): Promise<any> {
    return safeApiCall(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze career for: "${interestOrSkills}".`,
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
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });
  },

  async editImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    return safeApiCall(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ inlineData: { data: base64Data, mimeType: mimeType } }, { text: prompt }],
        },
      });
      const part = response.candidates[0].content.parts.find(p => p.inlineData);
      return part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
    });
  }
};
