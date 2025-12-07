import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord, User } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDailyReport = async (logs: AttendanceRecord[], users: User[]): Promise<string> => {
  try {
    const today = new Date().toDateString();
    const todaysLogs = logs.filter(log => new Date(log.timestamp).toDateString() === today);
    
    // Prepare data summary
    const summary = {
      totalUsers: users.length,
      presentCount: new Set(todaysLogs.map(l => l.userId)).size,
      records: todaysLogs.map(l => ({
        name: l.userName,
        time: new Date(l.timestamp).toLocaleTimeString(),
        status: l.status
      })),
      absentUsers: users.filter(u => !todaysLogs.find(l => l.userId === u.id)).map(u => u.name)
    };

    const prompt = `
      You are an attendance analyst system. Analyze the following attendance data for today (${today}).
      
      Data:
      ${JSON.stringify(summary, null, 2)}
      
      Please provide a concise but insightful report in Markdown format.
      Include:
      1. Overall attendance percentage.
      2. Who was on time vs late (assume 9:00 AM is the cutoff for "On Time" if status isn't explicit, but respect the 'status' field provided).
      3. A list of absent users.
      4. A brief "Mood of the Day" assessment based on punctuality (playful/professional).
      
      Keep it professional but engaging.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Unable to generate report.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating report. Please check your API key or network connection.";
  }
};