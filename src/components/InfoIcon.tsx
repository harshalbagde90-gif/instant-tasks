import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoIconProps {
    className?: string;
    size?: number;
    onClick?: () => void;
}

export const InfoIcon: React.FC<InfoIconProps> = ({
    className,
    size = 20,
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "relative flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 group/info",
                "bg-gradient-to-br from-[#FACC15] to-[#D4AF37]",
                "border-2 border-white/20 hover:border-white/40",
                "shadow-[0_4px_12px_rgba(250,204,21,0.3)] hover:shadow-[0_6px_20px_rgba(250,204,21,0.5)]",
                "hover:scale-110 active:scale-95",
                className
            )}
            style={{ width: size, height: size }}
        >
            {/* Glossy effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-50" />

            {/* Icon */}
            <Info
                className="relative z-10 text-black drop-shadow-sm"
                size={size * 0.6}
                strokeWidth={3}
            />

            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-full bg-[#FACC15] opacity-0 group-hover/info:opacity-30 blur-md transition-opacity duration-300" />
        </div>
    );
};
