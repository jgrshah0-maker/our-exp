import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily to prevent crashing on boot if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Prediction Endpoint
app.post("/api/predict", async (req, res) => {
  try {
    const { studentProfile, pastYears, currentYear } = req.body;

    if (!studentProfile || !pastYears || !currentYear) {
      return res.status(400).json({
        error: "Missing required parameters: studentProfile, pastYears, or currentYear are required.",
      });
    }

    const ai = getAiClient();

    // Build the prompt content
    const prompt = `
You are an expert academic advisor and predictive AI specialized in student performance analysis.
Analyze the following student details, past academic performance (past 3+ years), and current subjects to predict final grades and provide a highly personalized, actionable study plan.

STUDENT PROFILE:
- Name: ${studentProfile.name || "Student"}
- Level/Grade: ${studentProfile.gradeLevel || "Standard"}
- Study Hours Per Week: ${studentProfile.studyHours || "Not specified"}
- Attendance Rate: ${studentProfile.attendanceRate || "Not specified"}%
- Academic Profile/Extracurriculars: ${studentProfile.academicProfile || "None mentioned"}

PAST ACADEMIC PERFORMANCE (LAST 3+ YEARS):
${pastYears
  .map(
    (year: any, idx: number) => `
Year/Grade ${idx + 1} (${year.yearName}):
- Overall Score: ${year.overallPercentage}%
- Subjects Taken:
${
  year.subjects && year.subjects.length > 0
    ? year.subjects
        .map((s: any) => `  * ${s.name}: ${s.marks}/${s.maxMarks} (${Math.round((s.marks / s.maxMarks) * 100)}%)`)
        .join("\n")
    : "  No specific subject details provided."
}`
  )
  .join("\n")}

CURRENT YEAR ENROLLMENT & STANDING (${currentYear.yearName || "Target Year"}):
- Subjects & Current Performance:
${currentYear.subjects
  .map(
    (s: any) => `
  * ${s.name}:
    - Current Grade/Midterm: ${s.currentMarks}/${s.maxMarks} (${Math.round((s.currentMarks / s.maxMarks) * 100)}%)
    - Study Time: ${s.studyHoursPerWeek || 0} hours/week
    - Target Grade: ${s.targetMarks}%
`
  )
  .join("\n")}

Based on this historical and contextual data, generate a rigorous academic analysis and final grade prediction.
Account for student trajectory (e.g. are they improving, declining, or stable?), study hours, attendance, and gap between current grades and their targets.
`;

    // Define response schema to get stable JSON outputs
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        predictedOverallPercentage: {
          type: Type.NUMBER,
          description: "Overall predicted percentage for the target year (0 to 100)."
        },
        predictedLetterGrade: {
          type: Type.STRING,
          description: "Predicted overall letter grade (e.g. A+, A, B, C, etc.)."
        },
        confidenceScore: {
          type: Type.NUMBER,
          description: "Confidence level of prediction as a percentage (0 to 100)."
        },
        trendAnalysis: {
          type: Type.OBJECT,
          properties: {
            trajectory: {
              type: Type.STRING,
              description: "Trajectory of the student: 'improving', 'declining', 'stable', or 'fluctuating'."
            },
            description: {
              type: Type.STRING,
              description: "A detailed 2-3 sentence analysis of academic trajectory over the past years."
            }
          },
          required: ["trajectory", "description"]
        },
        subjectPredictions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subjectName: { type: Type.STRING },
              predictedPercentage: { type: Type.NUMBER },
              currentStanding: { type: Type.STRING, description: "E.g., High, Moderate, At-Risk" },
              aiInsight: { type: Type.STRING, description: "Specific subject analysis and prediction rationale." },
              suggestedWeeklyHours: { type: Type.NUMBER, description: "Recommended weekly study hours to achieve or exceed target." }
            },
            required: ["subjectName", "predictedPercentage", "currentStanding", "aiInsight", "suggestedWeeklyHours"]
          }
        },
        strengths: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["subject", "reason"]
          }
        },
        weaknesses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              reason: { type: Type.STRING },
              actionPlan: { type: Type.STRING, description: "Clear, concrete study step to improve." }
            },
            required: ["subject", "reason", "actionPlan"]
          }
        },
        strategicPlan: {
          type: Type.OBJECT,
          properties: {
            dailyRoutine: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A 4-5 step daily or weekly customized routine for maximum success."
            },
            keyFocusAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Top 3 priorities or strategies the student should adopt."
            },
            examPrepStrategy: {
              type: Type.STRING,
              description: "Specific exam preparation advice tailored to their study style."
            }
          },
          required: ["dailyRoutine", "keyFocusAreas", "examPrepStrategy"]
        }
      },
      required: [
        "predictedOverallPercentage",
        "predictedLetterGrade",
        "confidenceScore",
        "trendAnalysis",
        "subjectPredictions",
        "strengths",
        "weaknesses",
        "strategicPlan"
      ]
    };

    // Robust model fallback and retry handler to survive 503 or high demand events
    const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
    let predictionText = "";
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Querying AI model: ${modelName} (Attempt ${attempt}/2)`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: "You are a warm, supportive, and precise academic predictive AI. Your predictions should be realistic but encouraging, offering constructive study tactics based on historical performance.",
              responseMimeType: "application/json",
              responseSchema: responseSchema,
            },
          });
          if (response.text) {
            predictionText = response.text;
            console.log(`Successfully received prediction from ${modelName}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${modelName} failed on attempt ${attempt}: ${err.message || err}`);
          if (modelName !== modelsToTry[modelsToTry.length - 1] || attempt < 2) {
            // Cool down briefly before retry
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        }
      }
      if (predictionText) break;
    }

    if (!predictionText) {
      throw lastError || new Error("All predictive AI models are currently experiencing high demand. Please try again in a few moments.");
    }

    const predictionData = JSON.parse(predictionText);
    res.json(predictionData);

  } catch (error: any) {
    console.error("Prediction Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred during grade prediction.",
    });
  }
});

// Serve frontend static assets and setup Vite development server
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite development server integration
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    // Production serving of built assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static serving configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Grade Predictor Server running on http://0.0.0.0:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Failed to start server:", err);
});
