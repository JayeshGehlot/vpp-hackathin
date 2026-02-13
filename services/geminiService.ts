import { GoogleGenAI, Type } from "@google/genai";
import { PlanGenerationParams, StudyPlan, StudyDay, StudyTask } from "../types";
import { generateId } from "../utils";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateStudyPlan(params: PlanGenerationParams): Promise<StudyPlan> {
  const { subject, goal, startDate, endDate, dailyMinutes, difficulty } = params;

  // Calculate duration in days to give context
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const prompt = `
    Create a detailed study plan for: ${subject}.
    Goal: ${goal}.
    Difficulty Level: ${difficulty}.
    Duration: ${diffDays} days (from ${startDate} to ${endDate}).
    Daily availability: ${dailyMinutes} minutes.

    Return a structured JSON response with a day-by-day breakdown.
    Each day should have a specific theme and a list of actionable tasks.
    The tasks should sum up approximately to the daily availability minutes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING, description: "A brief encouraging overview of the plan." },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayOffset: { type: Type.INTEGER, description: "0 for start date, 1 for next day, etc." },
                  theme: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        minutes: { type: Type.INTEGER },
                      },
                      required: ["title", "description", "minutes"]
                    }
                  }
                },
                required: ["dayOffset", "theme", "tasks"]
              }
            }
          },
          required: ["overview", "schedule"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);

    // Transform AI response into our App's internal state format
    const planDays: StudyDay[] = data.schedule.map((day: any) => {
      const currentParamsDate = new Date(startDate);
      currentParamsDate.setDate(currentParamsDate.getDate() + day.dayOffset);
      
      return {
        dayNumber: day.dayOffset + 1,
        date: currentParamsDate.toISOString(),
        theme: day.theme,
        tasks: day.tasks.map((t: any) => ({
          id: generateId(),
          title: t.title,
          description: t.description,
          estimatedMinutes: t.minutes,
          completed: false
        }))
      };
    });

    const totalTasks = planDays.reduce((acc, day) => acc + day.tasks.length, 0);

    return {
      id: generateId(),
      subject,
      goal,
      startDate,
      endDate,
      dailyMinutes,
      createdAt: new Date().toISOString(),
      days: planDays,
      totalTasks,
      completedTasks: 0
    };

  } catch (error) {
    console.error("Failed to generate plan:", error);
    throw error;
  }
}
