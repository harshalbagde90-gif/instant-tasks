import React, { useState, useRef } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export const WallPrint = () => {
    const [wallPrint, setWallPrint] = useLocalStorage<string | null>('user-wall-print', null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size should be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setWallPrint(reader.result as string);
                toast.success('Wall print updated!');
            };
            reader.readAsDataURL(file);
        }
    };

    const removePrint = (e: React.MouseEvent) => {
        e.stopPropagation();
        setWallPrint(null);
        toast.info('Default print restored');
    };

    return (
        <div className="flex flex-col items-end gap-2 max-w-[460px]">
            <div
                className="relative group w-full aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] bg-black/40 backdrop-blur-2xl transition-all duration-700 hover:border-primary/50 hover:shadow-[0_0_80px_rgba(var(--primary),0.2)]"
            >
                {/* Image Display */}
                <img
                    src={wallPrint || '/Images/wall-print-default.png'}
                    alt="Motivational Wall Print"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03] image-render-auto brightness-90 group-hover:brightness-100"
                    style={{ imageRendering: 'auto' }}
                />

                {/* Premium Overlay Filter */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Hover Actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-95 group-hover:scale-100">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white gap-2 h-10 px-4"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImagePlus className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Change Print</span>
                    </Button>

                    {wallPrint && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-red-500/10 backdrop-blur-md border border-red-500/20 hover:bg-red-500/20 text-red-500 h-10 w-10"
                            onClick={removePrint}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Frame Edge Lighting */}
                <div className="absolute inset-0 pointer-events-none rounded-[2rem] border border-white/10 group-hover:border-primary/30 transition-colors duration-500" />

                {/* Secret Label */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 translate-y-2 group-hover:translate-y-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Personal Vision</span>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
            </div>
            <p className="text-[14px] text-muted-foreground font-medium italic pr-4 text-right leading-relaxed tracking-tight">
                Upload images that motivate you to stay focused on your missions.
            </p>
        </div>
    );
};
