import React, { useState, useEffect, useRef, useCallback } from 'react';

const SOUNDSCAPES = [
  { id: 'rain', name: 'Lluvia Suave', icon: '🌧️', description: 'Gotas de lluvia relajantes' },
  { id: 'bowls', name: 'Cuencos Tibetanos', icon: '🔔', description: 'Tonos armónicos profundos' },
  { id: 'ocean', name: 'Olas de Mar', icon: '🌊', description: 'Oleaje rítmico y sereno' },
  { id: 'forest', name: 'Bosque Nocturno', icon: '🌿', description: 'Sonidos suaves de naturaleza' }
];

function createNoiseBuffer(audioCtx, duration = 2) {
  const sampleRate = audioCtx.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function startRain(audioCtx, gainNode) {
  const noiseBuffer = createNoiseBuffer(audioCtx, 4);
  
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  // Bandpass filter for rain-like pink noise
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.5;

  // Second highpass for crispness
  const highpass = audioCtx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 400;

  // Subtle LFO modulation on filter for organic feel
  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.15;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 200;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  noiseSource.connect(filter);
  filter.connect(highpass);
  highpass.connect(gainNode);
  noiseSource.start();

  return () => {
    try {
      noiseSource.stop();
      lfo.stop();
    } catch(e) {}
  };
}

function startBowls(audioCtx, gainNode) {
  const frequencies = [174, 285, 396, 528, 639];
  const oscillators = [];

  const playBowl = (freq, startTime) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const envGain = audioCtx.createGain();
    envGain.gain.setValueAtTime(0, startTime);
    envGain.gain.linearRampToValueAtTime(0.08, startTime + 1.5);
    envGain.gain.exponentialRampToValueAtTime(0.001, startTime + 8);

    // Subtle harmonic (octave above, very quiet)
    const harmonic = audioCtx.createOscillator();
    harmonic.type = 'sine';
    harmonic.frequency.value = freq * 2;
    const harmGain = audioCtx.createGain();
    harmGain.gain.setValueAtTime(0, startTime);
    harmGain.gain.linearRampToValueAtTime(0.02, startTime + 1);
    harmGain.gain.exponentialRampToValueAtTime(0.001, startTime + 6);

    osc.connect(envGain);
    harmonic.connect(harmGain);
    envGain.connect(gainNode);
    harmGain.connect(gainNode);

    osc.start(startTime);
    osc.stop(startTime + 9);
    harmonic.start(startTime);
    harmonic.stop(startTime + 7);

    oscillators.push(osc, harmonic);
  };

  // Schedule repeating bowls
  let schedulerInterval;
  let nextBowlTime = audioCtx.currentTime + 0.5;
  let freqIndex = 0;

  const schedule = () => {
    const now = audioCtx.currentTime;
    while (nextBowlTime < now + 2) {
      playBowl(frequencies[freqIndex % frequencies.length], nextBowlTime);
      freqIndex++;
      nextBowlTime += 3 + Math.random() * 2; // 3-5 seconds between bowls
    }
  };

  schedulerInterval = setInterval(schedule, 1000);
  schedule();

  return () => {
    clearInterval(schedulerInterval);
    oscillators.forEach(o => { try { o.stop(); } catch(e) {} });
  };
}

function startOcean(audioCtx, gainNode) {
  const noiseBuffer = createNoiseBuffer(audioCtx, 4);
  
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  // Low pass filter for deep ocean sound
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;
  filter.Q.value = 1;

  // LFO for wave-like volume modulation (breathing rhythm)
  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.08; // ~7.5 seconds per wave
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.4;

  const waveGain = audioCtx.createGain();
  waveGain.gain.value = 0.6;

  lfo.connect(lfoGain);
  lfoGain.connect(waveGain.gain);
  lfo.start();

  // Second LFO for filter sweep
  const filterLfo = audioCtx.createOscillator();
  filterLfo.type = 'sine';
  filterLfo.frequency.value = 0.06;
  const filterLfoGain = audioCtx.createGain();
  filterLfoGain.gain.value = 300;
  filterLfo.connect(filterLfoGain);
  filterLfoGain.connect(filter.frequency);
  filterLfo.start();

  noiseSource.connect(filter);
  filter.connect(waveGain);
  waveGain.connect(gainNode);
  noiseSource.start();

  return () => {
    try {
      noiseSource.stop();
      lfo.stop();
      filterLfo.stop();
    } catch(e) {}
  };
}

function startForest(audioCtx, gainNode) {
  // Base: very quiet pink noise (wind through leaves)
  const noiseBuffer = createNoiseBuffer(audioCtx, 4);
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const windFilter = audioCtx.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 400;

  const windGain = audioCtx.createGain();
  windGain.gain.value = 0.15;

  // Wind LFO
  const windLfo = audioCtx.createOscillator();
  windLfo.type = 'sine';
  windLfo.frequency.value = 0.1;
  const windLfoGain = audioCtx.createGain();
  windLfoGain.gain.value = 0.08;
  windLfo.connect(windLfoGain);
  windLfoGain.connect(windGain.gain);
  windLfo.start();

  noiseSource.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(gainNode);
  noiseSource.start();

  // Crickets: periodic high-pitched tones
  const cricketOscillators = [];
  let cricketInterval;
  
  const playCricket = () => {
    const freq = 3800 + Math.random() * 800;
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const env = audioCtx.createGain();
    const now = audioCtx.currentTime;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.03, now + 0.05);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(env);
    env.connect(gainNode);
    osc.start(now);
    osc.stop(now + 0.4);
    cricketOscillators.push(osc);
  };

  cricketInterval = setInterval(() => {
    if (Math.random() > 0.4) playCricket();
  }, 800 + Math.random() * 1200);

  return () => {
    clearInterval(cricketInterval);
    try { noiseSource.stop(); windLfo.stop(); } catch(e) {}
    cricketOscillators.forEach(o => { try { o.stop(); } catch(e) {} });
  };
}

const SOUND_STARTERS = {
  rain: startRain,
  bowls: startBowls,
  ocean: startOcean,
  forest: startForest
};

export default function ZenAudio({ isPlaying, onTogglePlay }) {
  const [selectedSound, setSelectedSound] = useState(() => {
    return localStorage.getItem('borbor-zen-sound') || 'rain';
  });
  const [volume, setVolume] = useState(() => {
    return parseFloat(localStorage.getItem('borbor-zen-volume') || '0.5');
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const cleanupRef = useRef(null);

  const stopSound = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try { audioCtxRef.current.close(); } catch(e) {}
      audioCtxRef.current = null;
    }
  }, []);

  const startSound = useCallback(() => {
    stopSound();
    
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.value = isMuted ? 0 : volume;
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;

      const starter = SOUND_STARTERS[selectedSound];
      if (starter) {
        cleanupRef.current = starter(ctx, gain);
      }
    } catch(e) {
      console.warn('Web Audio not supported:', e);
    }
  }, [selectedSound, volume, isMuted, stopSound]);

  // Start/stop based on isPlaying prop
  useEffect(() => {
    if (isPlaying) {
      startSound();
    } else {
      stopSound();
    }
    return stopSound;
  }, [isPlaying, selectedSound]);

  // Volume/mute changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(
        isMuted ? 0 : volume, 
        gainNodeRef.current.context.currentTime, 
        0.1
      );
    }
  }, [volume, isMuted]);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem('borbor-zen-sound', selectedSound);
    localStorage.setItem('borbor-zen-volume', String(volume));
  }, [selectedSound, volume]);

  const handleSoundChange = (soundId) => {
    setSelectedSound(soundId);
  };

  return (
    <div style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(16px)',
      borderRadius: '20px',
      border: '1px solid var(--glass-border)',
      padding: isExpanded ? '1.2rem' : '0.6rem 1rem',
      marginBottom: '1rem',
      transition: 'all 0.3s ease'
    }}>
      {/* Compact bar */}
      <div 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>
            {SOUNDSCAPES.find(s => s.id === selectedSound)?.icon || '🎵'}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-main)' }}>
            {SOUNDSCAPES.find(s => s.id === selectedSound)?.name || 'Zen Audio'}
          </span>
          {isPlaying && (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '14px' }}>
              {[3, 5, 4, 6, 3].map((h, i) => (
                <div key={i} style={{
                  width: '3px',
                  height: `${h + Math.sin(Date.now() / 300 + i) * 2}px`,
                  background: 'var(--color-primary)',
                  borderRadius: '2px',
                  animation: `audioBar 0.8s ease-in-out ${i * 0.1}s infinite alternate`
                }} />
              ))}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onTogglePlay && (
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePlay(!isPlaying); }}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '4px', color: 'var(--color-text-highlight)' }}
                title={isPlaying ? "Pausar música" : "Reproducir música"}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '4px' }}
            title={isMuted ? "Quitar silencio" : "Silenciar"}
          >
            {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
            ▼
          </span>
        </div>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="animate-fade-in" style={{ marginTop: '1rem' }}>
          {/* Soundscape selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '1rem' }}>
            {SOUNDSCAPES.map(sound => (
              <button
                key={sound.id}
                onClick={() => handleSoundChange(sound.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 12px', borderRadius: '12px',
                  border: selectedSound === sound.id ? '2px solid var(--color-primary)' : '1px solid var(--glass-border)',
                  background: selectedSound === sound.id ? 'rgba(var(--color-primary-rgb, 244, 63, 94), 0.08)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>{sound.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-main)' }}>{sound.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{sound.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Volume slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--color-primary)', height: '4px' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>🔊</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes audioBar {
          from { height: 3px; }
          to { height: 12px; }
        }
      `}</style>
    </div>
  );
}
