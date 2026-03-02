import { useEffect, useRef, useState } from 'react';

export default function AudioManager() {
  const bgAudioRef = useRef<HTMLAudioElement>(null);
  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem('to-game-music-enabled') !== 'false';
  });
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('to-game-music-volume');
    return saved ? Math.max(0, Math.min(1, parseFloat(saved))) : 0.25;
  });

  // Función para intentar reproducir (con manejo de errores)
  const tryPlay = () => {
    if (bgAudioRef.current && enabled) {
      bgAudioRef.current.play().catch(e => {
        console.log('Autoplay bloqueado o error:', e);
      });
    }
  };

  // Control principal de audio
  useEffect(() => {
    localStorage.setItem('to-game-music-enabled', enabled.toString());
    localStorage.setItem('to-game-music-volume', volume.toString());

    if (bgAudioRef.current) {
      bgAudioRef.current.volume = volume;
      bgAudioRef.current.loop = true;

      if (enabled) {
        // Intenta reproducir inmediatamente y también después de interacción
        tryPlay();
        document.addEventListener('click', tryPlay, { once: true });
        return () => document.removeEventListener('click', tryPlay);
      } else {
        bgAudioRef.current.pause();
      }
    }
  }, [enabled, volume]);

  // Escuchar eventos del MusicPlayer para sincronizar
  useEffect(() => {
    const handleEnabled = (e: Event) => {
      const customE = e as CustomEvent<{ enabled: boolean }>;
      const newEnabled = customE.detail?.enabled ?? false;
      setEnabled(newEnabled);
    };

    const handleVolume = (e: Event) => {
      const customE = e as CustomEvent<{ volume: number }>;
      const newVol = Math.max(0, Math.min(1, customE.detail?.volume ?? 0.25));
      setVolume(newVol);
    };

    window.addEventListener('musicEnabledChange', handleEnabled);
    window.addEventListener('musicVolumeChange', handleVolume);

    return () => {
      window.removeEventListener('musicEnabledChange', handleEnabled);
      window.removeEventListener('musicVolumeChange', handleVolume);
    };
  }, []);

  // Efectos de sonido (sin cambios, funciona bien)
  useEffect(() => {
    const playSound = (src: string, vol = 0.7) => {
      const audio = new Audio(src);
      audio.volume = vol;
      audio.play().catch(() => {});
    };

    const onTaskComplete = () => playSound('/audio/task-complete.wav', 0.7);
    const onLevelUp = () => playSound('/audio/level-up.wav', 0.8);
    const onButtonClick = () => playSound('/audio/button-click.wav', 0.5);

    window.addEventListener('taskCompleted', onTaskComplete);
    window.addEventListener('playerLevelUp', onLevelUp);
    window.addEventListener('buttonClick', onButtonClick);

    return () => {
      window.removeEventListener('taskCompleted', onTaskComplete);
      window.removeEventListener('playerLevelUp', onLevelUp);
      window.removeEventListener('buttonClick', onButtonClick);
    };
  }, []);

  return <audio ref={bgAudioRef} src="/audio/background-music.mp3" preload="auto" />;
}