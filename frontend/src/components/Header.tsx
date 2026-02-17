import { useEffect, useState } from 'react';
import { AppInfo } from '../types';
import { api } from '../api/client';

export function Header() {
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    api.getInfo().then(setInfo).catch(console.error);
  }, []);

  return (
    <header className="header">
      <div className="header-content">
        <h1>Feladatkezelő</h1>
        <span className="subtitle">DevOps Demo Alkalmazás 10</span>
      </div>
      {info && (
        <div className="header-info">
          <span>v{info.version}</span>
          <span>|</span>
          <span>Pod: {info.hostname}</span>
          <span>|</span>
          <span>{info.environment}</span>
        </div>
      )}
    </header>
  );
}
