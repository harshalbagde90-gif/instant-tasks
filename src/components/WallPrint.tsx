import React, { useState, useRef } from 'react';
import { ImagePlus, X, Upload, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export const WallPrint = () => {
    const [wallPrint, setWallPrint] = useLocalStorage<string | null>('user-wall-print', null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_SIZE_MB = 5;

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Only image files are allowed');
            return;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error(`Image size should be less than ${MAX_SIZE_MB}MB`);
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setWallPrint(reader.result as string);
            toast.success('Wall print updated! 🔥');
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const removePrint = (e: React.MouseEvent) => {
        e.stopPropagation();
        setWallPrint(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast.info('Default print restored');
    };

    return (
        <div className="flex flex-col items-end gap-2 max-w-[460px]">
            <div
                className={`relative group w-full aspect-video rounded-[2rem] overflow-hidden border transition-all duration-500 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl cursor-pointer
                    ${isDragging
                        ? 'border-primary/80 shadow-[0_0_60px_rgba(250,204,21,0.3)] scale-[1.01]'
                        : wallPrint
                            ? 'border-white/10 hover:border-primary/50 hover:shadow-[0_0_80px_rgba(250,204,21,0.15)]'
                            : 'border-white/10 hover:border-primary/40 bg-black/40'
                    }`}
                onClick={() => !wallPrint && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                {wallPrint ? (
                    <>
                        {/* Image */}
                        <img
                            src={wallPrint}
                            alt="Motivational Wall Print"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03] brightness-90 group-hover:brightness-100"
                        />

                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Hover Actions */}
                        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-400 scale-95 group-hover:scale-100">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white gap-2 h-10 px-4"
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            >
                                <ImagePlus className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Change</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-red-500/10 backdrop-blur-md border border-red-500/20 hover:bg-red-500/20 text-red-500 h-10 w-10"
                                onClick={removePrint}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Bottom label */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 translate-y-2 group-hover:translate-y-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Personal Vision</span>
                        </div>
                    </>
                ) : (
                    /* ─── Empty State — beautiful upload prompt ─── */
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 select-none">
                        {/* Animated upload icon */}
                        <div className={`relative w-16 h-16 rounded-2xl border-2 border-dashed flex items-center justify-center transition-all duration-300
                            ${isDragging ? 'border-primary bg-primary/10 scale-110' : 'border-white/20 group-hover:border-primary/60 group-hover:bg-primary/5'}`}>
                            <Upload className={`w-7 h-7 transition-all duration-300
                                ${isDragging ? 'text-primary scale-110' : 'text-white/30 group-hover:text-primary/70 group-hover:-translate-y-0.5'}`} />
                            {/* Corner sparks */}
                            <Zap className="absolute -top-2 -right-2 w-3.5 h-3.5 text-primary/0 group-hover:text-primary/60 transition-all duration-500 rotate-12" />
                        </div>

                        {/* Headline */}
                        <div className="flex flex-col items-center gap-1 text-center">
                            <span className="text-[13px] font-black uppercase tracking-widest text-white/70 group-hover:text-white/90 transition-colors duration-300">
                                Upload Your Motivation
                            </span>
                            <span className="text-[10px] font-medium text-white/30 group-hover:text-white/50 transition-colors duration-300 max-w-[260px] leading-relaxed">
                                Upload an image that motivates you — your goal, your dream, your vision. Drop it here or click to browse.
                            </span>
                        </div>

                        {/* CTA pill */}
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-300
                            ${isDragging
                                ? 'border-primary/60 bg-primary/10 text-primary'
                                : 'border-white/10 bg-white/5 text-white/40 group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-primary/80'}`}>
                            <ImagePlus className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                {isDragging ? 'Drop to Upload' : 'Click or Drag & Drop'}
                            </span>
                        </div>

                        {/* Size limit note */}
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest group-hover:text-white/30 transition-colors">
                            Max {MAX_SIZE_MB}MB · JPG, PNG, WEBP
                        </span>
                    </div>
                )}

                {/* Frame glow border */}
                <div className="absolute inset-0 pointer-events-none rounded-[2rem] border border-white/10 group-hover:border-primary/20 transition-colors duration-500" />

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                />
            </div>

            <p className="text-[13px] text-muted-foreground font-medium italic pr-4 text-right leading-relaxed tracking-tight">
                Upload images that motivate you to stay focused on your missions.
            </p>
        </div>
    );
};
