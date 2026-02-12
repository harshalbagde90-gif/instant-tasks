import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import {
    X, Plus, Trash2, Check, Zap, Settings, HelpCircle,
    User, Briefcase, Target, GraduationCap, HeartPulse,
    ShoppingBag, Plane, Home, Rocket, Shield,
    Gamepad2, Music, Camera, Zap as ZapIcon, Star
} from 'lucide-react';
import { Category, TagType } from '@/types/task';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function CategoryIconSmall({ name, color }: { name: string, color: string }) {
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent className="w-4 h-4" style={{ color }} />;
}

const ICON_OPTIONS = [
    { name: 'User', icon: User },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Target', icon: Target },
    { name: 'GraduationCap', icon: GraduationCap },
    { name: 'HeartPulse', icon: HeartPulse },
    { name: 'ShoppingBag', icon: ShoppingBag },
    { name: 'Plane', icon: Plane },
    { name: 'Home', icon: Home },
    { name: 'Rocket', icon: Rocket },
    { name: 'Shield', icon: Shield },
    { name: 'Gamepad2', icon: Gamepad2 },
    { name: 'Music', icon: Music },
    { name: 'Camera', icon: Camera },
    { name: 'Zap', icon: ZapIcon },
    { name: 'Star', icon: Star }
];

const COLOR_OPTIONS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#71717a', '#000000'
];

interface Props {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'categories' | 'tags';
    categories: Category[];
    setCategories: (cats: Category[]) => void;
    tags: TagType[];
    setTags: (tags: TagType[]) => void;
    onRenameItem?: (oldName: string, newName: string) => void;
    onDeleteItem?: (name: string) => void;
}

export function CategoryManageModal({
    isOpen,
    onOpenChange,
    type,
    categories,
    setCategories,
    tags,
    setTags,
    onRenameItem,
    onDeleteItem
}: Props) {
    const [editId, setEditId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('Target');
    const [color, setColor] = useState('#3b82f6');

    const handleSave = () => {
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }

        if (type === 'categories') {
            if (editId) {
                const oldItem = categories.find(c => c.id === editId);
                if (oldItem && oldItem.name !== name) {
                    onRenameItem?.(oldItem.name, name);
                }
                setCategories(categories.map(c => c.id === editId ? { ...c, name, icon, color } : c));
            } else {
                setCategories([...categories, { id: `cat-${Date.now()}`, name, icon, color }]);
            }
        } else {
            if (editId) {
                const oldItem = tags.find(t => t.id === editId);
                if (oldItem && oldItem.name !== name) {
                    onRenameItem?.(oldItem.name, name);
                }
                setTags(tags.map(t => t.id === editId ? { ...t, name, color } : t));
            } else {
                setTags([...tags, { id: `tag-${Date.now()}`, name, color }]);
            }
        }

        resetForm();
    };

    const resetForm = () => {
        setEditId(null);
        setName('');
        setIcon('Target');
        setColor('#3b82f6');
    };

    const handleDelete = (id: string) => {
        if (type === 'categories') {
            const item = categories.find(c => c.id === id);
            if (item) onDeleteItem?.(item.name);
            setCategories(categories.filter(c => c.id !== id));
        } else {
            const item = tags.find(t => t.id === id);
            if (item) onDeleteItem?.(item.name);
            setTags(tags.filter(t => t.id !== id));
        }
        toast.error('Deleted successfully');
    };

    const startEdit = (item: any) => {
        setEditId(item.id);
        setName(item.name);
        if (type === 'categories') setIcon(item.icon);
        setColor(item.color);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 bg-card/95 backdrop-blur-2xl border-border/50 rounded-[2rem] overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-3 flex flex-row items-center justify-between border-b border-border/50">
                    <DialogTitle className="text-lg font-black uppercase tracking-widest text-foreground">
                        Manage {type === 'categories' ? 'Categories' : 'Tags'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] h-[480px]">
                    {/* Left: Input Section */}
                    <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar border-r border-border/50">
                        <div className="space-y-4 bg-muted/20 p-5 rounded-[1.5rem] border border-border/50 shadow-inner">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    {editId ? 'Edit' : 'Add New'} {type === 'categories' ? 'Category' : 'Tag'}
                                </label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter name..."
                                    className="w-full bg-background border-2 border-border/50 rounded-xl px-4 py-2 text-xs font-bold focus:border-primary/50 outline-none transition-all"
                                />
                            </div>

                            {type === 'categories' && (
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Icon</label>
                                    <div className="grid grid-cols-6 gap-1.5">
                                        {ICON_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.name}
                                                onClick={() => setIcon(opt.name)}
                                                className={cn(
                                                    "aspect-square flex items-center justify-center rounded-lg border-2 transition-all",
                                                    icon === opt.name
                                                        ? "bg-primary border-primary text-white shadow-md scale-105"
                                                        : "bg-background border-border hover:border-primary/40 text-muted-foreground/60"
                                                )}
                                            >
                                                <opt.icon className="w-3.5 h-3.5" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLOR_OPTIONS.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={cn(
                                                "w-6 h-6 rounded-full border-2 transition-all",
                                                color === c ? "scale-110 border-white shadow-sm" : "border-transparent"
                                            )}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2.5 pt-1">
                                <Button
                                    onClick={handleSave}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] rounded-xl h-10 shadow-lg shadow-primary/10"
                                >
                                    {editId ? 'Update' : 'Generate'}
                                </Button>
                                {editId && (
                                    <Button
                                        variant="ghost"
                                        onClick={resetForm}
                                        className="px-5 rounded-xl h-10 border border-border font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: List Section */}
                    <div className="p-6 bg-muted/10 overflow-hidden flex flex-col">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-3 block">Existing Items</label>
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                            {(type === 'categories' ? categories : tags).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 bg-muted/40 border border-border/50 rounded-xl group hover:border-primary/20 transition-all"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${item.color}15` }}
                                        >
                                            {type === 'categories' ? (
                                                <CategoryIconSmall name={(item as Category).icon} color={item.color} />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            )}
                                        </div>
                                        <span className="text-[11px] font-bold text-foreground truncate">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                                            onClick={() => startEdit(item)}
                                        >
                                            <LucideIcons.Zap className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-lg hover:bg-red-500/10 hover:text-red-500"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
