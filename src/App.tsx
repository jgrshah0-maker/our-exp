import { useState, useEffect } from "react";
import { StudentProfile, AcademicYear, CurrentSubject, PredictionResult, SavedSession } from "./types";
import { sampleProfiles } from "./sampleData";
import StudentForm from "./components/StudentForm";
import Dashboard from "./components/Dashboard";
import SavedSessions from "./components/SavedSessions";
import {
  Sparkles,
  GraduationCap,
  Moon,
  Sun,
  Award,
  AlertCircle,
  HelpCircle,
  BookOpen,
  TrendingUp,
  History,
  Compass
} from "lucide-react";

export default function App() {
  // Theme Management
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Initializing state with first sample student (Alex Rivera) for zero-friction UX
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    return JSON.parse(JSON.stringify(sampleProfiles[0].studentProfile));
  });

  const [pastYears, setPastYears] = useState<AcademicYear[]>(() => {
    return JSON.parse(JSON.stringify(sampleProfiles[0].pastYears));
  });

  const [currentYear, setCurrentYear] = useState<{
    yearName: string;
    subjects: CurrentSubject[];
  }>(() => {
    return JSON.parse(JSON.stringify(sampleProfiles[0].currentYear));
  });

  // Active prediction results
  const [activeResult, setActiveResult] = useState<PredictionResult | null>(null);

  // Saved Sessions
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => {
    const saved = localStorage.getItem("saved_grade_predictions");
    return saved ? JSON.parse(saved) : [];
  });

  // App UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Dynamic Loading Cycling Messages
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingTips = [
    "Gemini is analyzing multi-year score trajectories...",
    "Correlating weekly study allocations with historic trends...",
    "Evaluating attendance factor multipliers...",
    "Detecting key strength fields and improvement zones...",
    "Synthesizing customized action schedules..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingTips.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Submit Handler: Triggers the backend AI prediction
  const handlePredictSubmit = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep(0);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentProfile,
          pastYears,
          currentYear,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to retrieve grade prediction from Gemini.");
      }

      const resultData: PredictionResult = await response.json();
      setActiveResult(resultData);

      // Save session in local history automatically
      const newSession: SavedSession = {
        id: `sess_${Date.now()}`,
        date: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        studentProfile: JSON.parse(JSON.stringify(studentProfile)),
        pastYears: JSON.parse(JSON.stringify(pastYears)),
        currentYear: JSON.parse(JSON.stringify(currentYear)),
        result: resultData,
      };

      setSavedSessions((prev) => {
        const updated = [newSession, ...prev];
        localStorage.setItem("saved_grade_predictions", JSON.stringify(updated));
        return updated;
      });

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An unexpected error occurred while predicting.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load Saved Prediction Session
  const handleSelectSession = (sess: SavedSession) => {
    setStudentProfile(JSON.parse(JSON.stringify(sess.studentProfile)));
    setPastYears(JSON.parse(JSON.stringify(sess.pastYears)));
    setCurrentYear(JSON.parse(JSON.stringify(sess.currentYear)));
    setActiveResult(JSON.parse(JSON.stringify(sess.result)));
    setErrorMessage(null);
  };

  // Delete Saved Session
  const handleDeleteSession = (id: string) => {
    setSavedSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem("saved_grade_predictions", JSON.stringify(updated));
      return updated;
    });
  };

  // Clear All Sessions
  const handleClearAllSessions = () => {
    if (confirm("Are you sure you want to delete all saved predictions? This cannot be undone.")) {
      setSavedSessions([]);
      localStorage.removeItem("saved_grade_predictions");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-200">
      {/* Upper Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800 px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight flex items-center gap-1.5 text-gray-900 dark:text-white">
                Grade Predictor <span className="px-1.5 py-0.5 text-[9px] bg-teal-500 text-white font-bold rounded">AI</span>
              </h1>
              <p className="text-[10px] text-gray-400 font-mono">POWERED BY GEMINI 3.5 FLASH</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 cursor-pointer"
              title="Toggle Dark Mode"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Stage */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-bold">Prediction Failed</h5>
              <p className="text-xs mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          /* Premium Cycling Animated Loader */
          <div className="min-h-[50vh] flex flex-col items-center justify-center py-20 text-center">
            <div className="relative flex items-center justify-center mb-6">
              {/* Outer Pulsing circles */}
              <div className="absolute w-24 h-24 bg-teal-500/10 dark:bg-teal-500/5 rounded-full animate-ping"></div>
              <div className="absolute w-16 h-16 bg-teal-500/20 dark:bg-teal-500/10 rounded-full animate-pulse"></div>
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
                <GraduationCap className="w-6 h-6 animate-bounce" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-850 dark:text-gray-100">
              Generating Predictive Model
            </h3>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-mono h-5 mt-2 animate-pulse">
              {loadingTips[loadingStep]}
            </p>
            <p className="text-[11px] text-gray-400 mt-6 max-w-sm leading-relaxed">
              Gemini is assessing study thresholds, past variances, and attendance benchmarks to formulate an optimal score pathway.
            </p>
          </div>
        ) : activeResult ? (
          /* Dashboard Results Scene */
          <div className="animate-fade-in">
            <Dashboard
              result={activeResult}
              pastYears={pastYears}
              currentYear={currentYear}
              studentProfile={studentProfile}
              onReset={() => {
                setActiveResult(null);
                setErrorMessage(null);
              }}
            />
          </div>
        ) : (
          /* Form Entry Scene with Onboarding Sidebar */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Input Form Column */}
            <div className="xl:col-span-8">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Academic Grade & Path Analyzer
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Enter your historical credentials from the past 3+ years and current syllabus targets. Our predictive academic AI will calculate simulated grades, outline strengths, and plan study routines.
                </p>
              </div>

              <StudentForm
                studentProfile={studentProfile}
                setStudentProfile={setStudentProfile}
                pastYears={pastYears}
                setPastYears={setPastYears}
                currentYear={currentYear}
                setCurrentYear={setCurrentYear}
                onSubmit={handlePredictSubmit}
                isLoading={isLoading}
              />
            </div>

            {/* Sidebar Column: Onboarding instructions & saved records */}
            <div className="xl:col-span-4 space-y-6">
              {/* Feature info banner */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-gray-800 font-bold text-9xl leading-none select-none opacity-20 pointer-events-none font-mono">
                  AI
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-400" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-teal-400">
                      Smart Predictions
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm tracking-tight leading-snug">
                    Grade trajectory algorithms at your service.
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-300">
                    <li className="flex gap-2 items-start">
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full shrink-0 mt-1.5"></span>
                      <span>Analyzes continuous progress over 3+ years to project realistic final outcomes.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full shrink-0 mt-1.5"></span>
                      <span>Includes a real-time &apos;What-If&apos; simulator to test target variations instantly.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full shrink-0 mt-1.5"></span>
                      <span>Provides customized study routines, specific weak point actions, and time guidance.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Saved Projections History List */}
              <SavedSessions
                sessions={savedSessions}
                onSelect={handleSelectSession}
                onDelete={handleDeleteSession}
                onClearAll={handleClearAllSessions}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-900 py-8 px-6 mt-20 text-center text-xs text-gray-400 print:hidden">
        <p className="max-w-md mx-auto leading-relaxed">
          AI Grade Predictor is a professional advisory utility. All generated outcomes are simulations intended to aid learning strategy planning.
        </p>
        <p className="mt-4 text-[10px] text-gray-500 font-mono">
          © {new Date().getFullYear()} AI Grade Predictor • Google AI Studio Build
        </p>
      </footer>
    </div>
  );
}
