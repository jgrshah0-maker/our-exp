import React from "react";
import { SavedSession } from "../types";
import { History, BookOpen, Trash2, Calendar, FileText, ChevronRight } from "lucide-react";

interface SavedSessionsProps {
  sessions: SavedSession[];
  onSelect: (session: SavedSession) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function SavedSessions({
  sessions,
  onSelect,
  onDelete,
  onClearAll,
}: SavedSessionsProps) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400">
          <History className="w-5 h-5" />
        </div>
        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          No previous predictions saved yet. Run a prediction above to save and compare reports over time.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-teal-500" />
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">
            Saved Projections ({sessions.length})
          </h4>
        </div>
        <button
          onClick={onClearAll}
          className="text-[11px] text-gray-400 hover:text-red-500 transition-colors font-medium cursor-pointer"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {sessions.map((sess) => (
          <div
            key={sess.id}
            onClick={() => onSelect(sess)}
            className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-950/10 hover:border-teal-200 dark:hover:border-teal-950/40 hover:bg-teal-500/5 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Badge representing grade */}
              <div className="flex items-center justify-center w-10 h-10 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-black rounded-lg text-sm shrink-0">
                {sess.result.predictedLetterGrade}
              </div>
              <div className="min-w-0">
                <h5 className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate select-all">
                  {sess.studentProfile.name}
                </h5>
                <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                  <span className="truncate max-w-[100px]">{sess.studentProfile.gradeLevel}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 shrink-0">
                    <Calendar className="w-2.5 h-2.5" />
                    {sess.date}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <div className="text-right mr-1.5 hidden sm:block">
                <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300">
                  {sess.result.predictedOverallPercentage}%
                </span>
                <p className="text-[9px] text-gray-400">
                  Conf: {sess.result.confidenceScore}%
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(sess.id);
                }}
                className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Delete Session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-teal-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
