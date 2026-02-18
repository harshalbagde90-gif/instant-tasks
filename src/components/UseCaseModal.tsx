import React from 'react';
import { modeUseCases, ModeType } from '@/data/modeUseCases';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { X } from 'lucide-react';

interface UseCaseModalProps {
    mode: ModeType;
    isOpen: boolean;
    onClose: () => void;
}

export const UseCaseModal: React.FC<UseCaseModalProps> = ({ mode, isOpen, onClose }) => {
    const data = modeUseCases[mode];
    const IconComponent = (LucideIcons as any)[data.icon];

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={cn(
                    "fixed inset-x-4 top-1/2 -translate-y-1/2 z-[201] md:hidden",
                    "bg-[#0a0a0a]/98 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl",
                    "max-h-[85vh] overflow-hidden flex flex-col",
                    "animate-in slide-in-from-bottom-8 zoom-in-95 duration-300"
                )}
            >
                {/* Header */}
                <div
                    className="px-6 py-5 border-b border-white/10 flex-shrink-0"
                    style={{
                        background: `linear-gradient(135deg, ${data.color}15, transparent)`,
                        borderBottomColor: `${data.color}30`
                    }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{
                                    background: `${data.color}20`,
                                    border: `2px solid ${data.color}40`
                                }}
                            >
                                {IconComponent && (
                                    <IconComponent
                                        className="w-6 h-6"
                                        style={{ color: data.color }}
                                    />
                                )}
                            </div>
                            <div>
                                <h2
                                    className="text-lg font-black uppercase tracking-wider"
                                    style={{ color: data.color }}
                                >
                                    {data.title}
                                </h2>
                                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                                    {data.subtitle}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
                        >
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>
                </div>

                {/* Use Cases List - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
                    <div className="space-y-3">
                        {data.useCases.map((useCase, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all duration-200"
                            >
                                <span className="text-2xl flex-shrink-0 mt-1">
                                    {useCase.emoji}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-white/90 leading-tight mb-1.5">
                                        {useCase.title}
                                    </h3>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        {useCase.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-600 font-medium">
                            {data.useCases.length} Use Cases
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl bg-primary text-black text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-colors"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
