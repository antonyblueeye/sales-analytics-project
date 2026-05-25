'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { Eye, EyeOff, Lock, Users, Sparkles, BarChart3 } from 'lucide-react';

export default function LoginPage() {
    const { loginAsGuest, loginAsAdmin } = useAuth();
    const router = useRouter();

    const [showAdminForm, setShowAdminForm] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleGuest = () => {
        loginAsGuest();
        window.location.href = '/';
    };

    const handleAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        const ok = loginAsAdmin(password);
        if (ok) {
            window.location.href = '/';
        } else {
            setError('Incorrect password');
            setPassword('');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo / Title */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 mb-4">
                        <BarChart3 size={28} className="text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Sales Analytics</h1>
                    <p className="text-slate-500 text-sm mt-1">LinkedIn outreach intelligence platform</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-4">
                    {!showAdminForm ? (
                        <>
                            {/* Guest button */}
                            <button
                                onClick={handleGuest}
                                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all group text-left"
                            >
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                    <Users size={20} className="text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm">Guest Demo</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Explore with anonymized sample data</p>
                                </div>
                                <Sparkles size={14} className="text-slate-600 shrink-0 group-hover:text-indigo-400 transition-colors" />
                            </button>

                            {/* Admin button */}
                            <button
                                onClick={() => setShowAdminForm(true)}
                                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all group text-left"
                            >
                                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                                    <Lock size={20} className="text-indigo-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm">Admin Login</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Full access with real data</p>
                                </div>
                            </button>
                        </>
                    ) : (
                        <form onSubmit={handleAdmin} className="space-y-4">
                            <button
                                type="button"
                                onClick={() => { setShowAdminForm(false); setError(''); setPassword(''); }}
                                className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2 flex items-center gap-1"
                            >
                                ← Back
                            </button>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                    Admin Password
                                </label>
                                <div className="relative">
                                    <input
                                        autoFocus
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                        placeholder="Enter password"
                                        className={`w-full bg-slate-800 border rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${error ? 'border-rose-500/60 focus:ring-rose-500/30' : 'border-slate-700 focus:ring-indigo-500/40 focus:border-indigo-500/60'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-900/40"
                            >
                                Sign In
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    Guest mode shows anonymized data only
                </p>
            </div>
        </div>
    );
}
