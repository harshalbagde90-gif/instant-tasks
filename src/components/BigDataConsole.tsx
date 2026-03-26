import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, Sparkles, History, Maximize2, Minimize2, Split, FileText, Highlighter, Palette, Type, Bold, Italic, Link, RotateCcw, ClipboardPaste } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface Sheet {
    id: string;
    name: string;
    content: string;
    metadata?: {
        styles: {
            bold: [number, number][];
            italic: [number, number][];
            colors: { range: [number, number], color: string }[];
            bg: { range: [number, number], color: string }[];
        }
    };
}

const BigDataConsole = ({
    handleAIAction,
    activeMode,
    setActiveMode,
    aiLimit,
}: {
    handleAIAction: any,
    activeMode: string,
    setActiveMode: (m: any) => void,
    aiLimit: number | null,
}) => {
    // Independent Workspaces: Store sheets by mode
    // Independent Workspaces: Store sheets by mode
    const [sheetsByMode, setSheetsByMode] = useState<Record<string, Sheet[]>>(() => {
        const saved = localStorage.getItem('big-data-workspaces');
        let workspaces: Record<string, Sheet[]> = {};

        if (saved) {
            workspaces = JSON.parse(saved);
            // Migration: Data -> Prompts
            if (workspaces['Data'] && !workspaces['Prompts']) {
                workspaces['Prompts'] = workspaces['Data'];
                delete workspaces['Data'];
            }
        }

        const legacySheets = localStorage.getItem('big-data-sheets');
        const defaultGeneral = legacySheets ? JSON.parse(legacySheets) : [{
            id: '1',
            name: 'Sheet 1',
            content: '',
            metadata: { styles: { bold: [], italic: [], colors: [], bg: [] } }
        }];

        return {
            'General': workspaces['General'] || defaultGeneral,
            'Script': workspaces['Script'] || [{ id: 's1', name: 'Script 1', content: '', metadata: { styles: { bold: [], italic: [], colors: [], bg: [] } } }],
            'Code': workspaces['Code'] || [{ id: 'c1', name: 'Code 1', content: '', metadata: { styles: { bold: [], italic: [], colors: [], bg: [] } } }],
            'Prompts': workspaces['Prompts'] || [{ id: 'p1', name: 'Prompts 1', content: '', metadata: { styles: { bold: [], italic: [], colors: [], bg: [] } } }]
        };
    });

    const [activeSheetIdByMode, setActiveSheetIdByMode] = useState<Record<string, string>>(() => {
        const savedIds = localStorage.getItem('big-data-active-ids');
        const workspacesIds = savedIds ? JSON.parse(savedIds) : {};

        const ids: Record<string, string> = {};
        Object.keys(sheetsByMode).forEach(mode => {
            if (workspacesIds[mode]) {
                ids[mode] = workspacesIds[mode];
            } else if (sheetsByMode[mode] && sheetsByMode[mode].length > 0) {
                ids[mode] = sheetsByMode[mode][0].id;
            }
        });
        return ids;
    });

    // Neural Sync: Listen for remote sheet jumps from Sidebar
    useEffect(() => {
        const handleRemoteJump = (e?: any) => {
            if (e?.detail) {
                const { mode, sheetId } = e.detail;
                setActiveSheetIdByMode(prev => ({
                    ...prev,
                    [mode]: sheetId
                }));
                return;
            }

            const savedIds = localStorage.getItem('big-data-active-ids');
            if (savedIds) {
                setActiveSheetIdByMode(JSON.parse(savedIds));
            }
        };

        window.addEventListener('storage', handleRemoteJump);
        window.addEventListener('big-data-jump' as any, handleRemoteJump);

        // Handle paste from mobile button
        const handlePasteEvent = (e: any) => {
            if (e?.detail?.content) {
                const currentActiveSheetId = activeSheetIdByMode[activeMode];
                const currentSheets = sheets[activeMode];
                const activeSheet = currentSheets.find(s => s.id === currentActiveSheetId);

                if (activeSheet) {
                    // Append to existing content with a newline
                    const newContent = activeSheet.content
                        ? `${activeSheet.content}\n${e.detail.content}`
                        : e.detail.content;

                    // Update the sheet content
                    setSheetsByMode(prev => ({
                        ...prev,
                        [activeMode]: prev[activeMode].map(s =>
                            s.id === currentActiveSheetId
                                ? { ...s, content: newContent }
                                : s
                        )
                    }));
                }
            }
        };
        window.addEventListener('paste-to-sheet' as any, handlePasteEvent);

        return () => {
            window.removeEventListener('storage', handleRemoteJump);
            window.removeEventListener('big-data-jump' as any, handleRemoteJump);
            window.removeEventListener('paste-to-sheet' as any, handlePasteEvent);
        };
    }, []);

    const sheets = sheetsByMode[activeMode] || [];
    const activeSheetId = activeSheetIdByMode[activeMode] || (sheets.length > 0 ? sheets[0].id : '');

    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [selection, setSelection] = useState<{ start: number, end: number, top: number, left: number, text: string } | null>(null);

    // History for Undo/Redo (Keep simple for now, per mode could be better but might be overkill)
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [aiUsageCount, setAiUsageCount] = useState(() => {
        const saved = localStorage.getItem('big-data-ai-usage');
        return saved ? parseInt(saved) : 0;
    });
    const AI_LIMIT = aiLimit ?? Number.POSITIVE_INFINITY;

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);

    const rowHeight = 26; // Compact height

    const templates = [
        { label: 'Bug Report', content: '# BUG REPORT\n\n**Description:** \n**Steps to Reproduce:** \n1. \n2. \n**Expected:** \n**Actual:** ' },
        { label: 'AI Prompt', content: 'Act as a [ROLE]. Your task is to [TASK].\n\nCONTEXT:\n- \n\nCONSTRAINTS:\n- \n\nOUTPUT FORMAT:\n- ' },
        { label: 'Code Snippet', content: '```javascript\n// Your code here\nfunction example() {\n  console.log("Hello World");\n}\n```' },
    ];

    useEffect(() => {
        localStorage.setItem('big-data-workspaces', JSON.stringify(sheetsByMode));
    }, [sheetsByMode]);

    useEffect(() => {
        localStorage.setItem('big-data-ai-usage', aiUsageCount.toString());
    }, [aiUsageCount]);

    const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0] || { id: 'temp', name: 'Temp', content: '', metadata: { styles: { bold: [], italic: [], colors: [], bg: [] } } };

    // Sanitize legacy tag-based content to Metadata system
    useEffect(() => {
        let changed = false;
        const newModeSheets = sheets.map(sheet => {
            if (sheet.content.includes('[') && sheet.content.includes(']')) {
                const cleanContent = sheet.content.replace(/\[[\s\S]*?\]/g, '');
                changed = true;
                return {
                    ...sheet,
                    content: cleanContent,
                    metadata: sheet.metadata || { styles: { bold: [], italic: [], colors: [], bg: [] } }
                };
            }
            if (!sheet.metadata) {
                changed = true;
                return { ...sheet, metadata: { styles: { bold: [], italic: [], colors: [], bg: [] } } };
            }
            return sheet;
        });
        if (changed) {
            setSheetsByMode(prev => ({ ...prev, [activeMode]: newModeSheets }));
        }
    }, [activeSheetId, activeMode]);

    const handleContentChange = (content: string, skipHistory = false) => {
        const oldContent = activeSheet.content;
        const diff = content.length - oldContent.length;
        const cursor = textareaRef.current?.selectionStart || 0;

        // Robust Metadata Range Shifting
        const updateMetadata = (meta: any, start: number, diff: number) => {
            if (!meta?.styles) return meta;
            const updated = { ...meta.styles };

            const updateRange = (range: [number, number]): [number, number] | null => {
                let [s, e] = range;
                if (start <= s) { // Insert/Delete before range
                    s = Math.max(start, s + diff);
                    e = Math.max(start, e + diff);
                } else if (start < e) { // Insert/Delete inside range
                    e = Math.max(start, e + diff);
                }
                return s < e ? [s, e] : null;
            };

            updated.bold = updated.bold.map(updateRange).filter(Boolean);
            updated.italic = updated.italic.map(updateRange).filter(Boolean);
            updated.colors = updated.colors.map((c: any) => {
                const r = updateRange(c.range);
                return r ? { ...c, range: r } : null;
            }).filter(Boolean);
            updated.bg = updated.bg.map((b: any) => {
                const r = updateRange(b.range);
                return r ? { ...b, range: r } : null;
            }).filter(Boolean);

            return { styles: updated };
        };

        const newMetadata = updateMetadata(activeSheet.metadata, cursor - diff, diff);

        setSheetsByMode(prev => ({
            ...prev,
            [activeMode]: prev[activeMode].map(s => s.id === activeSheetId ? { ...s, content, metadata: newMetadata } : s)
        }));

        if (!skipHistory) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(content);
            if (newHistory.length > 50) newHistory.shift();
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }

        // Handle slash command
        const lastChar = content[cursor - 1];
        if (lastChar === '/') {
            const rect = textareaRef.current?.getBoundingClientRect();
            if (rect) {
                setMenuPos({ top: 80, left: 100 });
                setShowSlashMenu(true);
            }
        } else {
            setShowSlashMenu(false);
        }
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;

        if (start !== end) {
            const text = target.value.substring(start, end);
            // Rough estimation of position
            setSelection({ start, end, top: 40, left: 200, text });
        } else {
            setSelection(null);
        }
    };

    const applyFormatting = (tag: string, color?: string) => {
        if (!selection || !textareaRef.current) return;
        const { start, end } = selection;
        const newMetadata = { ...activeSheet.metadata } as any;
        if (!newMetadata.styles) newMetadata.styles = { bold: [], italic: [], colors: [], bg: [] };

        const range: [number, number] = [start, end];

        if (tag === 'bold') newMetadata.styles.bold.push(range);
        else if (tag === 'italic') newMetadata.styles.italic.push(range);
        else if (tag === 'color' && color) {
            newMetadata.styles.colors = newMetadata.styles.colors.filter((c: any) => !(c.range[0] >= start && c.range[1] <= end));
            newMetadata.styles.colors.push({ range, color });
        }
        else if (tag === 'bg' && color) {
            newMetadata.styles.bg = newMetadata.styles.bg.filter((b: any) => !(b.range[0] >= start && b.range[1] <= end));
            newMetadata.styles.bg.push({ range, color });
        }

        setSheetsByMode(prev => ({
            ...prev,
            [activeMode]: prev[activeMode].map(s => s.id === activeSheetId ? { ...s, metadata: newMetadata } : s)
        }));
        setSelection(null);
        toast.success(`Format Applied: ${tag}`);
    };

    const insertTemplate = (templateContent: string) => {
        if (!textareaRef.current) return;
        const cursor = textareaRef.current.selectionStart || 0;
        const newContent = activeSheet.content.slice(0, cursor - 1) + templateContent + activeSheet.content.slice(cursor);
        handleContentChange(newContent);
        setShowSlashMenu(false);
        toast.success("Template Inserted");
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            handleContentChange(history[newIndex], true);
            toast.info("Action Reverted");
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            handleContentChange(history[newIndex], true);
            toast.info("Action Redone");
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) handleRedo();
                else handleUndo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, historyIndex]);



    const handleAIEdit = async (instruction: string) => {
        if (!selection || !textareaRef.current) return;
        if (Number.isFinite(AI_LIMIT) && aiUsageCount >= AI_LIMIT) {
            toast.error(`AI Monthly Limit Reached (${aiUsageCount}/${AI_LIMIT})`);
            return;
        }

        const { start, end, text } = selection;
        toast.loading("AI is working its magic...");

        try {
            const result = await handleAIAction('selection-ai', 'improve', {
                text,
                instruction,
                mode: activeMode,
                context: activeSheet.content
            });

            if (result && result !== "__NO_CHANGE__") {
                const newContent = activeSheet.content.slice(0, start) + result + activeSheet.content.slice(end);
                handleContentChange(newContent);
                setAiUsageCount(prev => prev + 1);
                setSelection(null);
                toast.dismiss();
                toast.success(`AI Edit Applied (${aiUsageCount + 1}/${Number.isFinite(AI_LIMIT) ? AI_LIMIT : 'Unlimited'})`);
            }
        } catch (e) {
            toast.dismiss();
            toast.error("AI Magic failed this time.");
        }
    };

    const addSheet = () => {
        const newId = Math.random().toString(36).substring(7);
        const newSheet = { id: newId, name: `${activeMode} ${sheets.length + 1}`, content: '' };
        setSheetsByMode(prev => ({
            ...prev,
            [activeMode]: [...prev[activeMode], newSheet]
        }));
        setActiveSheetIdByMode(prev => ({ ...prev, [activeMode]: newId }));
        toast.success(`${activeMode} Sheet Added`);
    };

    const deleteSheet = (id: string) => {
        if (sheets.length === 1) {
            toast.error("At least one sheet must exist");
            return;
        }
        const newSheets = sheets.filter(s => s.id !== id);
        setSheetsByMode(prev => ({ ...prev, [activeMode]: newSheets }));
        if (activeSheetId === id) {
            setActiveSheetIdByMode(prev => ({ ...prev, [activeMode]: newSheets[0].id }));
        }
        toast.error("Sheet Terminated");
    };

    const renameSheet = (id: string, newName: string) => {
        setSheetsByMode(prev => ({
            ...prev,
            [activeMode]: prev[activeMode].map(s => s.id === id ? { ...s, name: newName } : s)
        }));
    };

    const clearContent = () => {
        if (confirm("Bhai, pura data saaf kar du? (Undo possible hi)")) {
            handleContentChange("");
            toast.success("Sheet Cleared");
        }
    };

    const handlePasteContent = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                const cursor = textareaRef.current?.selectionStart || activeSheet.content.length;
                const newContent = activeSheet.content.slice(0, cursor) + text + activeSheet.content.slice(cursor);
                handleContentChange(newContent);
                toast.success("Content Pasted from Clipboard");
            } else {
                toast.error("Clipboard is empty");
            }
        } catch (err) {
            toast.error("Need Permission to Paste");
        }
    };

    const lines = activeSheet.content.split('\n');
    const lineCount = lines.length;

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
        if (mirrorRef.current) mirrorRef.current.scrollTop = e.currentTarget.scrollTop;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top + e.currentTarget.scrollTop;
        const row = Math.floor(y / rowHeight);
        setHoveredRow(row < lineCount ? row : null);
    };

    const jumpToLine = (lineIndex: number) => {
        if (!textareaRef.current) return;

        const lines = activeSheet.content.split('\n');
        let newContent = activeSheet.content;

        // If clicking beyond current lines, add empty lines
        if (lineIndex >= lines.length) {
            const linesToAdd = lineIndex - lines.length + 1;
            newContent += '\n'.repeat(linesToAdd);
            handleContentChange(newContent);
        }

        // Calculate position
        const updatedLines = newContent.split('\n');
        let pos = 0;
        for (let i = 0; i < lineIndex; i++) {
            pos += (updatedLines[i]?.length || 0) + 1;
        }

        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
        setSelection(null);
    };

    const renderMirrorText = (text: string) => {
        if (!text) return null;
        const styles = activeSheet.metadata?.styles;
        if (!styles) return <span>{text}</span>;

        const getVibrantColor = (c: string) => {
            const colors: any = { gold: "#D4AF37", red: "#FF4D4D", green: "#2ECC71", blue: "#3498DB", purple: "#9B59B6", cyan: "#00E5FF" };
            return colors[c] || "inherit";
        };

        const chunks: { text: string, style: any }[] = [];
        let currentText = "";
        let currentStyleStr = "";

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const style: any = { color: 'inherit' }; // Inherit from parent (text-foreground in light, white in dark)

            const bgObj = styles.bg.find(b => i >= b.range[0] && i < b.range[1]);
            if (bgObj) {
                // Gold Glow Effect
                style.backgroundColor = "rgba(212, 175, 55, 0.45)"; // Stronger gold
                style.color = "#000000"; // Dark text on gold for premium look
                style.boxShadow = "0 0 15px rgba(212, 175, 55, 0.3)";
                style.borderRadius = "4px";
                style.fontWeight = "900";
            }

            const styleStr = JSON.stringify(style);
            if (styleStr !== currentStyleStr && currentText) {
                chunks.push({ text: currentText, style: JSON.parse(currentStyleStr) });
                currentText = char;
                currentStyleStr = styleStr;
            } else {
                currentText += char;
                currentStyleStr = styleStr;
            }
        }
        if (currentText) chunks.push({ text: currentText, style: JSON.parse(currentStyleStr) });

        return chunks.map((chunk, i) => (
            <span key={i} style={chunk.style}>{chunk.text}</span>
        ));
    };

    const [isDiffMode, setIsDiffMode] = useState(false);
    const [snapshot, setSnapshot] = useState<string | null>(null);

    const takeSnapshot = () => {
        setSnapshot(activeSheet.content);
        toast.info("Snapshot Captured for Comparison");
    };

    const toggleDiff = () => {
        if (!snapshot) {
            toast.error("Take a snapshot first!");
            return;
        }
        setIsDiffMode(!isDiffMode);
    };

    return (
        <div className={cn(
            "relative w-full transition-all duration-700 ease-in-out",
            isFocusMode ? "fixed inset-0 z-[100] bg-black/90 p-10 flex flex-col" : "min-h-[600px] flex flex-col"
        )}>
            {/* Selection Floating Toolbar */}
            {selection && (
                <div
                    className="absolute z-[120] top-1/2 left-1/2 -translate-x-1/2 -translate-y-[150px] bg-[#0a0a0a]/95 backdrop-blur-2xl border border-primary/30 rounded-full shadow-[0_0_50px_rgba(212,175,55,0.3)] p-1 flex items-center animate-in slide-in-from-bottom-4 duration-300"
                >
                    <button
                        onClick={() => applyFormatting('bg', 'gold')}
                        className="px-6 py-2.5 hover:bg-primary/10 rounded-full transition-all flex items-center gap-3 group"
                    >
                        <Highlighter className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-xs font-black uppercase text-primary tracking-widest">Highlight</span>
                    </button>
                    <div className="w-[1px] h-6 bg-white/10 mx-1" />
                    <button
                        onClick={() => setSelection(null)}
                        className="px-4 py-2 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Slash Menu */}
            {showSlashMenu && (
                <div
                    className="absolute z-[110] bg-card border border-border rounded-2xl shadow-2xl p-2 w-48 animate-in fade-in zoom-in duration-200"
                    style={{ top: menuPos.top, left: menuPos.left }}
                >
                    <div className="text-[9px] font-black text-muted-foreground uppercase px-3 py-1 tracking-widest">Global Templates</div>
                    {templates.map(t => (
                        <button
                            key={t.label}
                            onClick={() => insertTemplate(t.content)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-muted text-xs font-bold text-foreground transition-colors flex items-center gap-2"
                        >
                            <FileText className="w-3 h-3 text-primary" />
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Dynamic Glow Background */}
            <div className="absolute inset-0 bg-[#D4AF37]/5 blur-[120px] pointer-events-none animate-pulse" />

            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 md:mt-6 mb-2 md:mb-4 px-2 gap-2 md:gap-2">
                <div className="flex flex-col gap-2 w-full md:flex-1 overflow-hidden">
                    <div className="flex items-center justify-between md:hidden px-1">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Active Sheets</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-2 w-full">
                        {sheets.map(sheet => (
                            <div
                                key={sheet.id}
                                className={cn(
                                    "group flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl border transition-all cursor-pointer whitespace-nowrap",
                                    activeSheetId === sheet.id
                                        ? "bg-primary/20 border-primary text-primary shadow-[0_4px_15px_rgba(212,175,55,0.15)]"
                                        : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/20"
                                )}
                                onClick={() => setActiveSheetIdByMode(prev => ({ ...prev, [activeMode]: sheet.id }))}
                            >
                                {activeSheetId === sheet.id ? (
                                    <input
                                        autoFocus
                                        className="bg-transparent border-none outline-none text-[10px] md:text-xs font-black uppercase tracking-widest w-20 md:w-24 placeholder:text-primary/40"
                                        value={sheet.name}
                                        onChange={(e) => renameSheet(sheet.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{sheet.name}</span>
                                )}
                                {activeSheetId === sheet.id && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteSheet(sheet.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Trash2 className="w-3   h-3 text-red-500/60" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={addSheet}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-xl md:rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/10 shrink-0"
                        >
                            <Plus className="w-4 h-4 text-primary" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-1.5 md:gap-3 w-full md:w-auto pt-1 md:pt-0 border-t border-white/5 md:border-none">
                    <div className="flex items-center gap-2 md:gap-1.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearContent}
                            className="rounded-xl border border-white/5 text-zinc-500 hover:text-red-400 px-3 md:px-3 h-10 md:h-9 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                            title="Clear Sheet"
                        >
                            <Trash2 className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
                            <span className="hidden md:inline">Clear</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            className="rounded-xl border border-white/5 text-zinc-500 hover:text-white px-3 md:px-3 h-10 md:h-9 hover:bg-white/10 hover:border-white/20 transition-all"
                            title="Undo"
                        >
                            <RotateCcw className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
                            <span className="hidden md:inline">Undo</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePasteContent}
                            className="rounded-xl border-2 border-primary/60 bg-primary/15 text-primary hover:bg-primary/30 hover:border-primary/80 px-4 md:px-5 h-10 md:h-9 shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:shadow-[0_0_30px_rgba(212,175,55,0.55)] transition-all font-black uppercase tracking-widest text-[10px]"
                            title="Paste Content"
                        >
                            <ClipboardPaste className="w-5 h-5 md:w-4 md:h-4 mr-2" />
                            <span className="font-black uppercase text-[10px]">Paste</span>
                        </Button>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFocusMode(!isFocusMode)}
                            className="rounded-xl border-white/10 text-[10px] font-black uppercase tracking-widest h-9"
                        >
                            {isFocusMode ? <Minimize2 className="w-3 h-3 mr-2" /> : <Maximize2 className="w-3 h-3 mr-2" />}
                            {isFocusMode ? 'Exit Focus' : 'Focus'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Console Area */}
            <div className="flex-1 relative bg-card/95 backdrop-blur-xl border-2 border-border rounded-none overflow-hidden flex flex-col group/console shadow-2xl">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent z-20" />

                <div className="flex-1 flex overflow-hidden">
                    {/* Gutter (Line Numbers) */}
                    <div
                        ref={gutterRef}
                        className="w-14 bg-muted/50 border-r border-border flex flex-col select-none overflow-hidden text-primary/30 font-mono text-[10px] tabular-nums leading-[26px]"
                    >
                        <div className="pt-0">
                            {Array.from({ length: Math.max(lineCount, 30) }).map((_, i) => (
                                <div
                                    key={i}
                                    onClick={() => jumpToLine(i)}
                                    className={cn(
                                        "h-[26px] flex items-center justify-center transition-colors cursor-pointer hover:bg-primary/20 hover:text-primary",
                                        hoveredRow === i && "text-primary bg-primary/10"
                                    )}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 relative overflow-hidden flex flex-col" onMouseLeave={() => setHoveredRow(null)}>
                        {isDiffMode ? (
                            <div className="flex-1 flex font-mono text-sm leading-[26px] overflow-auto custom-scrollbar">
                                <div className="flex-1 p-6 bg-red-500/5 text-red-500/50 whitespace-pre">
                                    <div className="text-[9px] font-black mb-4 uppercase tracking-widest opacity-40">Previous Snapshot</div>
                                    {snapshot}
                                </div>
                                <div className="flex-1 p-6 bg-green-500/5 text-green-500/90 whitespace-pre">
                                    <div className="text-[9px] font-black mb-4 uppercase tracking-widest opacity-40">Current Version</div>
                                    {activeSheet.content}
                                </div>
                                <button
                                    onClick={() => setIsDiffMode(false)}
                                    className="absolute top-4 right-4 p-2 bg-muted rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-muted/80 z-20"
                                >
                                    Close Diff
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 relative flex flex-col" onClick={() => textareaRef.current?.focus()}>
                                {/* Hover Row Glow */}
                                {hoveredRow !== null && (
                                    <div
                                        className="absolute w-full bg-primary/[0.03] border-y border-primary/10 pointer-events-none transition-all duration-75 z-0"
                                        style={{
                                            top: (hoveredRow * rowHeight) - (textareaRef.current?.scrollTop || 0),
                                            height: rowHeight,
                                            boxShadow: 'inset 4px 0 0 var(--primary)'
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
                                    </div>
                                )}

                                {/* Force Selection Transparency to hide tags even when highlighting */}
                                <style>
                                    {`
                                        #big-data-textarea::selection {
                                            color: transparent !important;
                                            -webkit-text-fill-color: transparent !important;
                                            background: rgba(212, 175, 55, 0.3) !important;
                                        }
                                        #big-data-textarea::-moz-selection {
                                            color: transparent !important;
                                            background: rgba(212, 175, 55, 0.3) !important;
                                        }
                                    `}
                                </style>

                                {/* Syntax Mirror (Visible behind textarea) */}
                                <div
                                    ref={mirrorRef}
                                    className="absolute inset-0 flex-1 w-full px-6 py-0 text-sm font-medium font-mono leading-[26px] text-foreground whitespace-pre-wrap break-words overflow-hidden pointer-events-none z-0"
                                    style={{
                                        lineHeight: `${rowHeight}px`,
                                        backgroundImage: 'linear-gradient(to bottom, rgba(212,175,55,0.05) 1px, transparent 1px)',
                                        backgroundSize: `100% ${rowHeight}px`,
                                        backgroundAttachment: 'local',
                                        letterSpacing: 'normal',
                                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                                    }}
                                >
                                    {renderMirrorText(activeSheet.content)}
                                </div>

                                {/* Main Textarea (Semi-transparent) */}
                                <textarea
                                    ref={textareaRef}
                                    id="big-data-textarea"
                                    value={activeSheet.content}
                                    onChange={(e) => handleContentChange(e.target.value)}
                                    onScroll={handleScroll}
                                    onMouseMove={handleMouseMove}
                                    onSelect={handleSelect}
                                    placeholder="SELECT TEXT TO EDIT OR FORMAT..."
                                    className="flex-1 w-full bg-transparent border-none outline-none resize-none px-6 py-0 text-sm font-medium caret-primary font-mono leading-[26px] custom-scrollbar z-10"
                                    spellCheck={false}
                                    style={{
                                        lineHeight: `${rowHeight}px`,
                                        color: 'transparent',
                                        WebkitTextFillColor: 'transparent',
                                        letterSpacing: 'normal',
                                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / Status Bar */}
                <div className="h-10 md:h-12 bg-muted/40 border-t border-border px-3 md:px-6 flex items-center justify-between z-10 overflow-x-auto no-scrollbar scroll-smooth">
                    <div className="flex items-center gap-4 md:gap-6 min-w-max">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest">Rows:</span>
                            <span className="text-[8px] md:text-[9px] font-bold text-primary">{lineCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 md:hidden">
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Words:</span>
                            <span className="text-[8px] font-bold text-primary">{activeSheet.content ? activeSheet.content.trim().split(/\s+/).filter(Boolean).length : 0}</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Words:</span>
                            <span className="text-[9px] font-bold text-primary">{activeSheet.content ? activeSheet.content.trim().split(/\s+/).filter(Boolean).length : 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest">Mode:</span>
                            <span className="text-[8px] md:text-[9px] font-black text-primary uppercase">{activeMode}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 min-w-max ml-4">
                        <button
                            onClick={takeSnapshot}
                            className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 hover:bg-white/10 transition-colors"
                        >
                            <History className="w-3 h-3 text-zinc-500" />
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Snapshot</span>
                        </button>
                        <button
                            onClick={toggleDiff}
                            className={cn(
                                "flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 rounded-full border transition-colors",
                                isDiffMode ? "bg-orange-500/20 border-orange-500/40 text-orange-500" : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                            )}
                        >
                            <Split className="w-3 h-3" />
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Diff</span>
                        </button>
                        <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-[8px] md:text-[9px] font-black text-primary uppercase tracking-widest">T: {activeSheet.content ? Math.ceil(activeSheet.content.length / 4) : 0}</span>
                        </div>
                        <div className={cn(
                            "flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 rounded-full border transition-all",
                            Number.isFinite(AI_LIMIT) && aiUsageCount >= AI_LIMIT ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-white/10 text-zinc-500"
                        )}>
                            <div className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full", Number.isFinite(AI_LIMIT) && aiUsageCount >= AI_LIMIT ? "bg-red-500 animate-pulse" : "bg-primary")} />
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">AI: {aiUsageCount}/{Number.isFinite(AI_LIMIT) ? AI_LIMIT : 'UNL'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BigDataConsole;
