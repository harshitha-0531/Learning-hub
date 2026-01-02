
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LearningPathItem, QuizQuestion, SkillGap, Course, MicroLesson } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Executes an API call with automatic retries for rate-limiting (429) errors.
 * Uses a simple delay before retrying.
 */
async function safeApiCall<T>(call: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await call();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.status === 429;
    
    if (isRateLimit && retries > 0) {
      // Wait for 3 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 3000));
      return safeApiCall(call, retries - 1);
    }
    
    if (isRateLimit) {
      throw new Error("The AI service is currently busy due to high demand (Quota Exceeded). Please wait 10-20 seconds and try your request again.");
    }
    
    // Log other errors for debugging
    console.error("Gemini API Error:", error);
    throw error;
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
        contents: `Analyze the career path for someone interested in: "${interestOrSkills}". Provide a realistic profile including salary and demand.`,
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
        contents: `Create a 5-minute micro-lesson about "${topic}". Provide a clear educational Concept, Short Notes (3 bullet points), and 2 quiz questions.`,
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
        config: { systemInstruction: 'You are EduAI assistant. Be concise.' }
      });
      const response = await chat.sendMessage({ message });
      return response.text || '';
    });
  },

  async getCourseErrorAnalysis(courseTitle: string, failures: any[]): Promise<string> {
    return safeApiCall(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following student failures in the course "${courseTitle}": ${JSON.stringify(failures)}. 
        Provide a detailed pedagogical summary identifying the most common conceptual misunderstandings 
        and specific suggestions for improving the curriculum to address these gaps.`,
      });
      return response.text || "No analysis available at this time.";
    });
  },

  async editImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    return safeApiCall(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });
      
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("The AI did not return an edited image.");
    });
  }
};
