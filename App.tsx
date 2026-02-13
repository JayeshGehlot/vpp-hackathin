import React, { useState, useEffect } from 'react';
import { PlanGenerator } from './components/PlanGenerator';
import { PlanDashboard } from './components/PlanDashboard';
import { generateStudyPlan } from './services/geminiService';
import { StudyPlan, PlanGenerationParams } from './types';
import { BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedPlan = localStorage.getItem('mindArchitect_plan');
    if (savedPlan) {
      try {
        setPlan(JSON.parse(savedPlan));
      } catch (e) {
        console.error("Failed to parse saved plan", e);
        localStorage.removeItem('mindArchitect_plan');
      }
    }
  }, []);

  const savePlan = (newPlan: StudyPlan | null) => {
    setPlan(newPlan);
    if (newPlan) {
      localStorage.setItem('mindArchitect_plan', JSON.stringify(newPlan));
    } else {
      localStorage.removeItem('mindArchitect_plan');
    }
  };

  const handleGenerate = async (params: PlanGenerationParams) => {
    setLoading(true);
    setError(null);
    try {
      const newPlan = await generateStudyPlan(params);
      savePlan(newPlan);
    } catch (err) {
      setError("Failed to generate plan. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = (dayIndex: number, taskId: string, completed: boolean) => {
    if (!plan) return;

    const newDays = [...plan.days];
    const day = newDays[dayIndex];
    const taskIndex = day.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return;

    day.tasks[taskIndex].completed = completed;
    
    // Recalculate stats
    const totalCompleted = newDays.reduce((acc, d) => acc + d.tasks.filter(t => t.completed).length, 0);

    const updatedPlan = {
      ...plan,
      days: newDays,
      completedTasks: totalCompleted
    };

    savePlan(updatedPlan);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500">
              MindArchitect
            </span>
          </div>
          <div className="flex items-center gap-4">
             {plan && (
                 <span className="text-xs font-medium text-slate-500 hidden sm:block">
                     Current Plan: {plan.subject}
                 </span>
             )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center justify-center">
                {error}
            </div>
        )}

        {!plan ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PlanGenerator onGenerate={handleGenerate} isLoading={loading} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PlanDashboard 
                plan={plan} 
                onUpdateTask={handleUpdateTask} 
                onDeletePlan={() => {
                    if(window.confirm("Are you sure you want to delete this study plan? This cannot be undone.")) {
                        savePlan(null);
                    }
                }}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
