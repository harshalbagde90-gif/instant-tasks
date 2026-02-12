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
} from "@/components/ui/dialog";
import { Shield, Mail, Lock, Sparkles, Chrome, Github, Loader2, User, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

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
            <DialogContent className="sm:max-w-[700px] bg-zinc-950 border-white/5 text-white overflow-hidden p-0 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] group/modal [&>button]:hidden">
                {/* Golden Glowing Border Effect */}
                <div className="absolute inset-0 rounded-[2.5rem] p-[1.5px] bg-gradient-to-br from-primary/60 via-white/10 to-primary/60 pointer-events-none z-0 opacity-40 group-hover/modal:opacity-100 transition-opacity duration-700" />

                <div className="relative bg-zinc-950 rounded-[2.45rem] overflow-hidden z-10 grid sm:grid-cols-[1.2fr,1.8fr] min-h-[480px]">
                    {/* Visual Background Elements */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary/20 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-[120px]" />

                    {/* Left Column: Branding & Info */}
                    <div className="p-10 bg-white/[0.02] border-r border-white/5 flex flex-col justify-between relative z-10">
                        <div>
                            <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mb-8 border border-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.2)] group-hover/modal:scale-110 transition-transform duration-700 ease-out">
                                <Shield className="w-8 h-8 text-primary" />
                            </div>
                            <DialogTitle className="text-4xl font-black tracking-tight uppercase leading-[1.1] mb-6 whitespace-pre-line text-white/90">
                                {mode === 'signin' ? 'Login to\nTask Maker' : 'Join the\nElite Unit'}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400 font-medium text-base leading-relaxed max-w-[220px]">
                                Your personal command center for hyper-efficient missions and daily tasks.
                            </DialogDescription>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 block">Quick Access</span>
                                <Button
                                    variant="outline"
                                    onClick={() => handleOAuthLogin('google')}
                                    className="w-full bg-white/[0.03] border-white/10 hover:bg-white/10 hover:text-white rounded-2xl h-14 font-black gap-3 text-xs uppercase tracking-widest transition-all duration-500 hover:border-primary/40 group/google"
                                >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform duration-500 group-hover/google:scale-110">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Sign in with Google
                                </Button>
                            </div>

                            <button
                                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                                className="text-[11px] font-black text-primary uppercase tracking-[0.1em] hover:text-white transition-all hover:translate-x-1 duration-300"
                            >
                                {mode === 'signin' ? "Is it your first time? So please sign up first" : "Already registered? Return to Login"}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div className="p-10 flex flex-col justify-center bg-zinc-950/80 relative z-10">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] hover:border-primary/40 transition-all duration-300 z-50 group/close"
                        >
                            <X className="w-6 h-6 group-hover/close:rotate-90 transition-transform duration-500" />
                        </button>

                        <form onSubmit={handleAuth} className="space-y-6">
                            {mode === 'signup' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-3 duration-500">
                                    <Label className="text-xs font-black uppercase tracking-widest text-primary/70 ml-1">Mission Handle</Label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-primary transition-colors duration-300" />
                                        <Input
                                            type="text"
                                            placeholder="Your Full Name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="pl-12 bg-white/[0.04] border-white/10 focus-visible:ring-primary h-14 rounded-2xl text-base transition-all focus:bg-white/[0.08]"
                                            required={mode === 'signup'}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-primary/70 ml-1">Access Email</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors duration-300" />
                                    <Input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-12 bg-white/[0.04] border-white/10 focus-visible:ring-primary h-14 rounded-2xl text-base transition-all focus:bg-white/[0.08]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-primary/70 ml-1">Your Password</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors duration-300" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-12 pr-12 bg-white/[0.04] border-white/10 focus-visible:ring-primary h-14 rounded-2xl text-base transition-all focus:bg-white/[0.08]"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-primary transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {mode === 'signup' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-3 duration-500">
                                    <Label className="text-xs font-black uppercase tracking-widest text-primary/70 ml-1">Confirm Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors duration-300" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-12 bg-white/[0.04] border-white/10 focus-visible:ring-primary h-14 rounded-2xl text-base transition-all focus:bg-white/[0.08]"
                                            required={mode === 'signup'}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-6">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-16 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-[0.25em] rounded-2xl transition-all shadow-[0_0_30px_hsl(var(--primary)/0.3)] active:scale-95 text-sm group/btn relative overflow-hidden"
                                >
                                    {/* Scanning light effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />

                                    {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto relative z-10" /> : (
                                        <div className="flex items-center justify-center gap-2 relative z-10 transition-transform group-hover/btn:scale-110 duration-500">
                                            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500" />
                                            {mode === 'signin' ? 'Initiate Access' : 'Create Access Unit'}
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
