import { useMemo } from 'react';

export function Header() {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <header className="text-center mb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
        {greeting}! ☀️
      </h1>
      <p className="text-muted-foreground">
        What would you like to accomplish today?
      </p>
    </header>
  );
}
