import { useMemo, useState } from 'react';
import { Sparkles, Zap, BrainCircuit } from 'lucide-react';

export function Header() {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Midnight Focus';
  }, []);

  const emoji = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅';
    if (hour < 17) return '☀️';
    return '🌙';
  }, []);

  return (
    <header className="text-center mb-12 space-y-6">

      <h1 className="text-6xl md:text-7xl font-black tracking-tight">
        <span className="block text-gray-500 text-xl font-bold mb-4">
          {greeting} 👋
        </span>
        <span className="text-white">Chaos to </span>
        <span className="text-primary">Clarity</span>
      </h1>

      <p className="text-gray-500 text-lg font-medium max-w-xl mx-auto leading-relaxed">
        No login. <span className="text-white font-bold">No friction.</span> Just pure productivity.
      </p>
    </header>
  );
}
