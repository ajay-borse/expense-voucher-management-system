import { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertCircle, Loader2, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function Home() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/health');
      setHealthStatus(response.data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Health check failed:', err);
      setError(err.response?.data?.message || err.message || 'Unable to reach backend server');
      setHealthStatus(null);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-2 shadow-inner">
            <Server className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Expense Voucher Management System
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto">
            Full-stack project foundation initialized with Express backend and Vite React frontend.
          </p>
        </div>

        {/* Backend Connectivity Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Backend API Connectivity</h2>
                <p className="text-xs text-slate-500">Checking GET /api/health</p>
              </div>
            </div>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Status Display */}
          <div className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center gap-3 py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="text-sm font-medium">Connecting to backend...</span>
              </div>
            )}

            {!loading && healthStatus && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Backend Connected</span>
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                      Status: 200 OK
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Response: <code className="bg-emerald-100/70 px-1 py-0.5 rounded font-mono">{JSON.stringify(healthStatus)}</code>
                  </p>
                  {lastChecked && (
                    <p className="text-[11px] text-emerald-600">Last checked at {lastChecked}</p>
                  )}
                </div>
              </div>
            )}

            {!loading && error && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Backend Unreachable</span>
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-800 rounded-full">
                      Offline
                    </span>
                  </div>
                  <p className="text-xs text-rose-700">{error}</p>
                  {lastChecked && (
                    <p className="text-[11px] text-rose-600">Last checked at {lastChecked}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Configuration Summary */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Environment & Target Services
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Frontend Server</span>
                <span className="font-mono font-medium text-slate-800">http://localhost:5173</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Backend API Base</span>
                <span className="font-mono font-medium text-slate-800">http://localhost:5000/api</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Database Target</span>
                <span className="font-mono font-medium text-slate-800">localhost:5234/expense_voucher_db</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">Security Headers</span>
                  <span className="font-medium text-slate-800">Helmet + CORS</span>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          Expense Voucher Management System &bull; Project Scaffold
        </p>
      </div>
    </div>
  );
}
