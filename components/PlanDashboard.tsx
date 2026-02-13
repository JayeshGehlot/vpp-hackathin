import React, { useState } from 'react';
import { StudyPlan, StudyDay, StudyTask } from '../types';
import { formatDate, cn } from '../utils';
import { CheckCircle2, Circle, Calendar as CalendarIcon, PieChart, ChevronRight, Clock, Trophy, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PlanDashboardProps {
  plan: StudyPlan;
  onUpdateTask: (dayIndex: number, taskId: string, completed: boolean) => void;
  onDeletePlan: () => void;
}

export const PlanDashboard: React.FC<PlanDashboardProps> = ({ plan, onUpdateTask, onDeletePlan }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'analytics'>('schedule');

  const progress = Math.round((plan.completedTasks / plan.totalTasks) * 100) || 0;

  // Analytics Data Preparation
  const chartData = plan.days.map(day => ({
    name: `Day ${day.dayNumber}`,
    total: day.tasks.length,
    completed: day.tasks.filter(t => t.completed).length
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-500 font-medium text-sm mb-1">Current Subject</h3>
            <h2 className="text-xl font-bold text-slate-800 line-clamp-1" title={plan.subject}>{plan.subject}</h2>
          </div>
          <div className="mt-4 flex items-center gap-2 text-indigo-600 text-sm font-medium">
            <Trophy className="w-4 h-4" />
            <span>{plan.days.length} Day Plan</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
               <h3 className="text-slate-500 font-medium text-sm mb-1">Progress</h3>
               <h2 className="text-3xl font-bold text-slate-800">{progress}%</h2>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center relative overflow-hidden">
                <div 
                    className="absolute bottom-0 left-0 right-0 bg-indigo-500 transition-all duration-500" 
                    style={{ height: `${progress}%`, opacity: 0.2 }} 
                />
                <PieChart className="w-6 h-6 text-indigo-600 relative z-10" />
            </div>
          </div>
           <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }} 
              />
            </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-indigo-100 font-medium text-sm mb-1">Target Goal</h3>
            <p className="text-lg font-semibold leading-tight line-clamp-3">{plan.goal}</p>
          </div>
           <button onClick={onDeletePlan} className="mt-4 self-start text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition flex items-center gap-1 z-10">
             <Trash2 className="w-3 h-3" /> Reset Plan
           </button>
           <div className="absolute -right-6 -bottom-6 opacity-10">
             <Trophy className="w-32 h-32" />
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('schedule')}
          className={cn(
            "pb-3 text-sm font-medium transition-colors relative",
            activeTab === 'schedule' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Daily Schedule
          {activeTab === 'schedule' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "pb-3 text-sm font-medium transition-colors relative",
            activeTab === 'analytics' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Analytics & Insights
          {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'schedule' ? (
        <div className="space-y-6">
          {plan.days.map((day, dayIndex) => (
            <div key={day.date} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md">Day {day.dayNumber}</span>
                     {day.theme}
                   </h3>
                   <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                     <CalendarIcon className="w-3 h-3" /> {formatDate(day.date)}
                   </p>
                </div>
                <div className="text-slate-400">
                  <span className="text-xs font-medium bg-white px-2 py-1 rounded-full border border-slate-200">
                     {day.tasks.filter(t => t.completed).length} / {day.tasks.length} Done
                  </span>
                </div>
              </div>
              
              <div className="divide-y divide-slate-100">
                {day.tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={cn(
                      "px-6 py-4 flex items-start gap-4 transition-colors",
                      task.completed ? "bg-slate-50/50" : "hover:bg-indigo-50/30"
                    )}
                  >
                    <button 
                      onClick={() => onUpdateTask(dayIndex, task.id, !task.completed)}
                      className={cn(
                        "mt-1 flex-shrink-0 transition-colors",
                        task.completed ? "text-indigo-600" : "text-slate-300 hover:text-indigo-500"
                      )}
                    >
                      {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div className="flex-1">
                       <h4 className={cn(
                         "text-sm font-semibold text-slate-800 transition-all",
                         task.completed && "text-slate-400 line-through"
                       )}>
                         {task.title}
                       </h4>
                       <p className={cn(
                         "text-sm text-slate-500 mt-1",
                         task.completed && "text-slate-400"
                       )}>
                         {task.description}
                       </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" />
                      {task.estimatedMinutes}m
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Task Completion History</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                    dataKey="name" 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="completed" fill="#4f46e5" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm text-slate-400 mt-4">
              Visualizing daily task load vs. completion. Consistency is key!
          </p>
        </div>
      )}
    </div>
  );
};
