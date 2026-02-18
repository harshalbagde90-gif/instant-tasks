import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogOverlay,
} from "@/components/ui/dialog";
import { Shield, Mail, Lock, Sparkles, Chrome, Github, Loader2, User, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'signup' && password !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        setLoading(true);

        try {
            const { error } = mode === 'signup'
                ? await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                })
                : await supabase.auth.signInWithPassword({ email, password });

            if (error) throw error;

            if (mode === 'signup') {
                toast.success('Registration successful! Check your email for verification.');
            } else {
                toast.success('Welcome back, Mission Controller.');
                onClose();
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[9999] max-w-[95vw] sm:max-w-[850px] bg-white border-none text-zinc-900 overflow-hidden p-0 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.4)] group/modal [&>button]:hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
                <div className="relative bg-white rounded-3xl overflow-hidden z-10 grid grid-cols-1 sm:grid-cols-[1fr,1.8fr] min-h-[480px] sm:min-h-[520px]">

                    {/* Left Column: Branding & Info (Dark) - Hidden on Mobile */}
                    <div className="hidden sm:flex p-8 bg-[#09090B] flex-col justify-between relative z-10 text-white">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative flex-shrink-0">
                                    <div className="w-9 h-9 bg-[#FACC15] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.4)] animate-pulse">
                                        <Shield className="w-5 h-5 text-black" />
                                    </div>
                                    {/* Animated glow ring */}
                                    <div className="absolute inset-0 rounded-2xl bg-[#FACC15]/20 animate-ping" style={{ animationDuration: '3s' }} />
                                </div>

                                <div className="space-y-0.5">
                                    <h2 className="text-3xl font-black tracking-tight leading-none uppercase">
                                        {mode === 'signin' ? 'Login To' : 'Sign Up'}
                                    </h2>
                                    <h2 className="text-3xl font-black tracking-tight leading-none uppercase text-[#FACC15]">
                                        Tangy Task
                                    </h2>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-zinc-500 font-bold text-xs leading-relaxed">
                                    {mode === 'signin' ? 'Welcome back! Your access includes:' : 'Join the elite task force and unlock:'}
                                </p>
                                {mode === 'signin' ? (
                                    <ul className="space-y-2.5">
                                        <li className="flex items-start gap-2.5 text-zinc-400 text-xs">
                                            <span className="text-[#FACC15] font-black text-sm mt-0.5">✓</span>
                                            <span className="font-medium">Access to Advanced & Big Data operational modes</span>
                                        </li>
                                        <li className="flex items-start gap-2.5 text-zinc-400 text-xs">
                                            <span className="text-[#FACC15] font-black text-sm mt-0.5">✓</span>
                                            <span className="font-medium">Set daily, weekly, or monthly task schedules</span>
                                        </li>
                                        <li className="flex items-start gap-2.5 text-zinc-400 text-xs">
                                            <span className="text-[#FACC15] font-black text-sm mt-0.5">✓</span>
                                            <span className="font-medium">Add smart reminders & deadline notifications</span>
                                        </li>
                                        <li className="flex items-start gap-2.5 text-zinc-400 text-xs">
                                            <span className="text-[#FACC15] font-black text-sm mt-0.5">✓</span>
                                            <span className="font-medium">Tag marking & categorization for clarity</span>
                                        </li>
                                        <li className="flex items-start gap-2.5 text-zinc-400 text-xs">
                                            <span className="text-[#FACC15] font-black text-sm mt-0.5">✓</span>
                                            <span className="font-medium">And many more powerful features...</span>
                                        </li>
                                    </ul>
                                ) : (
                                    <ul className="space-y-2.5">
                                        <li className="flex items-start gap-2.5 text-zinc-400 text-xs">
                                            <span className="text-[#FACC15] font-black text-sm mt-0.5">✓</span>
                                            <span className="font-medium">AI-powered task assistance & optimization</span>
                                        </li>
                                        <li className="flex items-start gap-2.5 text-zinc-400 text-xs">
                                            <span className="text-[#FACC15] font-black text-sm mt-0.5">✓</span>
                                            <span className="font-medium">Advanced & Big Data operational modes</span>
                                        </li>
                                        <li className="flex items-start gap-2.5 text-zinc-400 text-xs">
                                            <span className="text-[#FACC15] font-black text-sm mt-0.5">✓</span>
                                            <span className="font-medium">Smart reminders & deadline tracking</span>
                                        </li>
                                        <li className="flex items-start gap-2.5 text-zinc-400 text-xs">
                                            <span className="text-[#FACC15] font-black text-sm mt-0.5">✓</span>
                                            <span className="font-medium">Cloud sync across all your devices</span>
                                        </li>
                                        <li className="flex items-start gap-2.5 text-zinc-400 text-xs">
                                            <span className="text-[#FACC15] font-black text-sm mt-0.5">✓</span>
                                            <span className="font-medium">Boost your productivity and improve efficiency</span>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 block">Quick Access</span>
                                <Button
                                    variant="outline"
                                    onClick={() => handleOAuthLogin('google')}
                                    className="w-full bg-[#1A1C1E] border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl h-12 font-black gap-3 text-xs uppercase tracking-widest transition-all duration-300"
                                >
                                    <div className="p-1.5 bg-white rounded-sm">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </div>
                                    Sign in with Google
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-[#FACC15] uppercase tracking-widest block">Is it your first time?</span>
                                <button
                                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                                    className="text-[12px] font-black text-white uppercase tracking-widest border-b-2 border-white pb-0.5 hover:text-[#FACC15] hover:border-[#FACC15] transition-all"
                                >
                                    {mode === 'signin' ? "Please Sign Up First" : "Return to Login"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Form - Dark on Mobile, White on Desktop */}
                    <div className="px-6 py-5 sm:px-12 sm:py-10 flex flex-col justify-center bg-black sm:bg-white relative z-10">
                        {/* Mobile Only: Icon + Heading */}
                        <div className={cn("sm:hidden flex flex-col items-center mb-3", mode === 'signup' ? 'gap-2' : 'gap-3 mb-4')}>
                            <div className={cn("bg-zinc-900 rounded-2xl flex items-center justify-center border border-[#FACC15]/30 shadow-[0_0_20px_rgba(250,204,21,0.2)] relative", mode === 'signup' ? 'w-14 h-14' : 'w-16 h-16')}>
                                <div className={cn("bg-[#FACC15] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.4)]", mode === 'signup' ? 'w-9 h-9' : 'w-10 h-10')}>
                                    <Shield className={cn("text-black", mode === 'signup' ? 'w-5 h-5' : 'w-6 h-6')} />
                                </div>
                            </div>

                            <div className="text-center space-y-0.5">
                                <h2 className={cn("font-black tracking-tight leading-none uppercase text-white", mode === 'signup' ? 'text-2xl' : 'text-3xl')}>
                                    {mode === 'signin' ? 'Login To' : 'Sign Up'}
                                </h2>
                                <h2 className={cn("font-black tracking-tight leading-none uppercase text-[#FACC15]", mode === 'signup' ? 'text-2xl' : 'text-3xl')}>
                                    Tangy Task
                                </h2>
                                {mode === 'signin' && (
                                    <p className="text-zinc-500 font-medium text-xs mt-2 max-w-[260px] mx-auto leading-tight">
                                        Your personal command center for hyper-efficient missions and daily tasks.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-zinc-400 sm:text-zinc-400 hover:text-white sm:hover:text-zinc-900 transition-colors z-50"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <form onSubmit={handleAuth} className={cn(mode === 'signup' ? 'space-y-3 sm:space-y-6' : 'space-y-4 sm:space-y-6')}>
                            {/* Google Sign In - Mobile Only at Top */}
                            <div className="sm:hidden">
                                <Button
                                    type="button"
                                    onClick={() => handleOAuthLogin('google')}
                                    className={cn("w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white rounded-xl font-bold gap-2.5 transition-all duration-300", mode === 'signup' ? 'h-10 text-[11px]' : 'h-11 text-xs')}
                                >
                                    <div className="p-1 bg-white rounded-sm">
                                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    </div>
                                    Sign in with Google
                                </Button>

                                <div className={cn("flex items-center gap-3", mode === 'signup' ? 'py-2' : 'py-3')}>
                                    <div className="h-[1px] flex-1 bg-zinc-800" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Quick Access</span>
                                    <div className="h-[1px] flex-1 bg-zinc-800" />
                                </div>
                            </div>


                            {mode === 'signup' && (
                                <div className="space-y-1.5 sm:space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FACC15] sm:text-[#2e1915]">Mission Handle</Label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 sm:text-zinc-400" />
                                        <Input
                                            type="text"
                                            placeholder="Your Full Name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="pl-12 bg-zinc-900 sm:bg-[#F8F9FA] border-zinc-800 sm:border-none focus-visible:ring-1 focus-visible:ring-[#FACC15] sm:focus-visible:ring-zinc-200 h-11 sm:h-12 rounded-xl text-sm sm:text-base font-medium placeholder:text-zinc-600 sm:placeholder:text-zinc-300 text-white sm:text-black"
                                            required={mode === 'signup'}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5 sm:space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FACC15] sm:text-[#2e1915]">Access Email</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 sm:text-zinc-400" />
                                    <Input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-12 bg-zinc-900 sm:bg-[#F8F9FA] border-zinc-800 sm:border-none focus-visible:ring-1 focus-visible:ring-[#FACC15] sm:focus-visible:ring-zinc-200 h-11 sm:h-12 rounded-xl text-sm sm:text-base font-medium placeholder:text-zinc-600 sm:placeholder:text-zinc-300 text-white sm:text-black"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FACC15] sm:text-[#2e1915]">Your Password</Label>
                                    <button type="button" className="text-[9px] font-bold text-zinc-600 sm:text-zinc-400 hover:text-[#FACC15] sm:hover:text-zinc-900">Forgot Password?</button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 sm:text-zinc-400" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-12 pr-12 bg-zinc-900 sm:bg-[#F8F9FA] border-zinc-800 sm:border-none focus-visible:ring-1 focus-visible:ring-[#FACC15] sm:focus-visible:ring-zinc-200 h-11 sm:h-12 rounded-xl text-sm sm:text-base font-medium placeholder:text-zinc-600 sm:placeholder:text-zinc-300 text-white sm:text-black"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 sm:text-zinc-400 hover:text-[#FACC15] sm:hover:text-zinc-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>


                            {mode === 'signup' && (
                                <div className="space-y-1.5 sm:space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FACC15] sm:text-[#2e1915]">Confirm Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 sm:text-zinc-400" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-12 bg-zinc-900 sm:bg-[#F8F9FA] border-zinc-800 sm:border-none focus-visible:ring-1 focus-visible:ring-[#FACC15] sm:focus-visible:ring-zinc-200 h-11 sm:h-12 rounded-xl text-sm sm:text-base font-medium placeholder:text-zinc-600 sm:placeholder:text-zinc-300 text-white sm:text-black"
                                            required={mode === 'signup'}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-1 sm:pt-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 sm:h-14 bg-[#FACC15] hover:bg-[#EAB308] text-black font-black uppercase tracking-[0.1em] rounded-xl transition-all active:scale-[0.98] text-xs sm:text-sm shadow-[0_0_40px_rgba(250,204,21,0.3)] hover:shadow-[0_0_60px_rgba(250,204,21,0.5)]"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : (
                                        <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                                            {mode === 'signin' ? 'Initiate Access' : 'Create Access Unit'}
                                        </div>
                                    )}
                                </Button>
                            </div>

                            {/* Desktop Only: Secure Login Separator */}
                            <div className="hidden sm:flex items-center gap-4 py-2">
                                <div className="h-[1px] flex-1 bg-zinc-100" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Secure Login</span>
                                <div className="h-[1px] flex-1 bg-zinc-100" />
                            </div>

                            {/* Sign Up / Sign In Switcher */}
                            <div className="text-center pt-2 sm:pt-4">
                                <p className="text-[10px] sm:text-xs text-zinc-600 sm:text-zinc-400">
                                    {mode === 'signin' ? (
                                        <>
                                            <span className="sm:hidden">IS IT YOUR FIRST TIME? </span>
                                            <span className="hidden sm:inline">Don't have an account? </span>
                                            <button
                                                type="button"
                                                onClick={() => setMode('signup')}
                                                className="font-black text-[#FACC15] hover:underline uppercase sm:normal-case"
                                            >
                                                {mode === 'signin' ? 'SIGN UP FIRST' : 'Sign up'}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="sm:hidden">ALREADY HAVE AN ACCOUNT? </span>
                                            <span className="hidden sm:inline">Already have an account? </span>
                                            <button
                                                type="button"
                                                onClick={() => setMode('signin')}
                                                className="font-black text-[#FACC15] hover:underline uppercase sm:normal-case"
                                            >
                                                {mode === 'signup' ? 'RETURN TO LOGIN' : 'Sign in'}
                                            </button>
                                        </>
                                    )}
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
