import React, { useState, useEffect } from 'react';
import { getAttendanceLogs, getUsers, clearLogs } from '../services/storageService';
import { generateDailyReport } from '../services/geminiService';
import { AttendanceRecord, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Bot, Clock, Trash2, Users, FileText, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [report, setReport] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    setLogs(getAttendanceLogs());
    setUsers(getUsers());
  }, []);

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      clearLogs();
      setLogs([]);
      setReport('');
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await generateDailyReport(logs, users);
    setReport(result);
    setAnalyzing(false);
  };

  // Stats
  const today = new Date().toDateString();
  const todaysLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);
  const uniqueAttendees = new Set(todaysLogs.map(l => l.userId)).size;
  const totalUsers = users.length;
  const attendanceRate = totalUsers > 0 ? Math.round((uniqueAttendees / totalUsers) * 100) : 0;
  
  const lateCount = todaysLogs.filter(l => l.status === 'Late').length;
  const onTimeCount = todaysLogs.filter(l => l.status === 'On Time').length;

  const chartData = [
    { name: 'On Time', value: onTimeCount, color: '#22c55e' },
    { name: 'Late', value: lateCount, color: '#eab308' },
    { name: 'Absent', value: totalUsers - uniqueAttendees, color: '#ef4444' }
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Overview of attendance metrics and AI insights.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleClearLogs}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-400/50 transition-colors flex items-center text-sm"
            >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
            </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
            icon={<Users className="w-6 h-6 text-indigo-400" />} 
            label="Total Members" 
            value={totalUsers} 
        />
        <StatCard 
            icon={<Clock className="w-6 h-6 text-green-400" />} 
            label="Present Today" 
            value={uniqueAttendees} 
            subValue={`${attendanceRate}% Rate`}
        />
        <StatCard 
            icon={<Bot className="w-6 h-6 text-purple-400" />} 
            label="Total Logs" 
            value={logs.length} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6">Today's Attendance Status</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                        <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} 
                            itemStyle={{ color: '#f8fafc' }}
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* AI Insight Panel */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                    <Sparkles className="w-5 h-5 text-amber-400 mr-2" />
                    AI Insights
                </h3>
            </div>
            
            <div className="flex-1 overflow-auto max-h-[400px] mb-4 pr-2">
                {report ? (
                    <div className="prose prose-invert prose-sm">
                        <ReactMarkdown>{report}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                        <Bot className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">Generate an AI report to analyze patterns and get a summary of today's attendance.</p>
                    </div>
                )}
            </div>

            <button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {analyzing ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Analyzing...
                    </>
                ) : (
                    <>
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Daily Report
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Recent Logs Table */}
      <div className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-800/80 text-xs uppercase font-semibold text-slate-300">
                    <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Time</th>
                        <th className="px-6 py-4">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                    {logs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{log.userName}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${log.status === 'Late' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}
                                `}>
                                    {log.status}
                                </span>
                            </td>
                            <td className="px-6 py-4">{new Date(log.timestamp).toLocaleTimeString()}</td>
                            <td className="px-6 py-4">{new Date(log.timestamp).toLocaleDateString()}</td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                No attendance records found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number, subValue?: string }> = ({ icon, label, value, subValue }) => (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 flex items-start justify-between">
        <div>
            <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
            <h4 className="text-3xl font-bold text-white">{value}</h4>
            {subValue && <p className="text-indigo-400 text-sm mt-1">{subValue}</p>}
        </div>
        <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
            {icon}
        </div>
    </div>
);