import React from 'react';
import { modeUseCases, ModeType } from '@/data/modeUseCases';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface UseCaseCardProps {
    mode: ModeType;
    className?: string;
}

export const UseCaseCard: React.FC<UseCaseCardProps> = ({ mode, className }) => {
    const data = modeUseCases[mode];
    const IconComponent = (LucideIcons as any)[data.icon];

    return (
        <div
            className={cn(
                "w-[320px] bg-[#0a0a0a]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden",
                "animate-in fade-in zoom-in duration-200",
                className
            )}
        >
            {/* Header */}
            <div
                className="px-5 py-4 border-b border-white/10"
                style={{
                    background: `linear-gradient(135deg, ${data.color}15, transparent)`,
                    borderBottomColor: `${data.color}30`
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                            background: `${data.color}20`,
                            border: `1px solid ${data.color}40`
                        }}
                    >
                        {IconComponent && (
                            <IconComponent
                                className="w-5 h-5"
                                style={{ color: data.color }}
                            />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3
                            className="text-sm font-black uppercase tracking-wider"
                            style={{ color: data.color }}
                        >
                            {data.title}
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                            {data.subtitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Use Cases List */}
            <div className="px-4 py-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="space-y-2.5">
                    {data.useCases.map((useCase, index) => (
                        <div
                            key={index}
                            className="group/item flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all duration-200"
                        >
                            <span className="text-xl flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                                {useCase.emoji}
                            </span>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-white/90 leading-tight mb-0.5">
                                    {useCase.title}
                                </h4>
                                <p className="text-[10px] text-zinc-500 leading-relaxed">
                                    {useCase.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02]">
                <p className="text-[9px] text-zinc-600 text-center font-medium uppercase tracking-wider">
                    {data.useCases.length} Use Cases Available
                </p>
            </div>
        </div>
    );
};
