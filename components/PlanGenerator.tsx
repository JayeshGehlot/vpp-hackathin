import React, { useState } from 'react';
import { PlanGenerationParams } from '../types';
import { Loader2, Sparkles, Calendar, Clock, BookOpen, Target } from 'lucide-react';
import { cn } from '../utils';

interface PlanGeneratorProps {
  onGenerate: (params: PlanGenerationParams) => Promise<void>;
  isLoading: boolean;
}

export const PlanGenerator: React.FC<PlanGeneratorProps> = ({ onGenerate, isLoading }) => {
  const [params, setParams] = useState<PlanGenerationParams>({
    subject: '',
    goal: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dailyMinutes: 60,
    difficulty: 'Intermediate'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(params);
  };

  const handleChange = (field: keyof PlanGenerationParams, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Build Your Curriculum</h1>
          <p className="text-indigo-100">Let AI architect the perfect study path for your goals.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" /> Subject / Topic
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Python for Data Science, Renaissance Art History..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                value={params.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" /> Specific Goal
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. To pass the certification exam with 90%+ score..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                value={params.goal}
                onChange={(e) => handleChange('goal', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Start Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  value={params.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" /> End Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  value={params.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" /> Daily Availability
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white"
                  value={params.dailyMinutes}
                  onChange={(e) => handleChange('dailyMinutes', Number(e.target.value))}
                >
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={90}>1.5 Hours</option>
                  <option value={120}>2 Hours</option>
                  <option value={180}>3 Hours</option>
                  <option value={240}>4+ Hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty Level</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleChange('difficulty', level)}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                        params.difficulty === level 
                          ? "bg-white text-indigo-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Generating Plan...
              </>
            ) : (
              <>
                Generate Plan <Sparkles className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
      
      <p className="text-center text-slate-400 text-sm mt-6">
        Powered by Gemini 3 Flash • Customizable & Exportable
      </p>
    </div>
  );
};
