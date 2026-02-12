import React from 'react';
import { Languages } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SUPPORTED_LANGUAGES = [
    { name: 'English', native: 'English' },
    { name: 'Hinglish', native: 'Hinglish' },
    { name: 'French', native: 'Français' },
    { name: 'Russian', native: 'Русский' },
];

interface LanguageSelectorProps {
    selectedLanguage: string;
    onLanguageChange: (lang: string) => void;
    isNavbar?: boolean;
}

export function LanguageSelector({ selectedLanguage, onLanguageChange, isNavbar }: LanguageSelectorProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "h-9 px-3 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 rounded-full transition-all duration-300 group",
                        isNavbar && "border-none hover:bg-white/10"
                    )}
                >
                    <Languages className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {isNavbar ? selectedLanguage : "Task Language"}
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900/95 border-white/10 backdrop-blur-xl sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center mb-4">
                        Select Task Language <br />
                        <span className="text-sm font-normal text-gray-400">For better AI experience</span>
                    </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 p-2">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <Button
                            key={lang.name}
                            variant="ghost"
                            onClick={() => onLanguageChange(lang.name)}
                            className={cn(
                                "h-14 flex flex-col items-center justify-center gap-1 border-2 transition-all duration-300",
                                selectedLanguage === lang.name
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-white/5 hover:border-white/20 hover:bg-white/5 text-gray-400 hover:text-white"
                            )}
                        >
                            <span className="font-bold">{lang.name}</span>
                            <span className="text-[10px] opacity-60">{lang.native}</span>
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
