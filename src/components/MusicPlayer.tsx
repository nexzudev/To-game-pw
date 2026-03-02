import React, { useEffect, useState } from 'react';

export default function MusicPlayer() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem('to-game-music-enabled') !== 'false';
  });

  const [volume, setVolume] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem('to-game-music-volume') ?? '');
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.35;
  });

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('musicEnabledChange', { detail: { enabled } }));
  }, [enabled]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('musicVolumeChange', { detail: { volume } }));
  }, [volume]);

  return (
    <div className="flex gap-2 items-center px-3 py-2 rounded-lg glass">
      <button
        className={`btn ${enabled ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-white/10 hover:bg-white/20'} text-slate-200 px-3 py-1 rounded`}
        onClick={() => setEnabled(!enabled)}
        title={enabled ? 'Pausar música' : 'Reproducir música'}
      >
        {enabled ? '⏸' : '▶'}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={e => setVolume(Number(e.target.value))}
        className="w-28 accent-indigo-500"
        title="Volumen de música"
      />
    </div>
  );
}