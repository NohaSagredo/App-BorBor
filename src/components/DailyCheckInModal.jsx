import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const STEPS = [
  {
    id: 'emotions',
    title: '¿Cómo te sientes hoy?',
    subtitle: 'Elige tu estado de ánimo principal',
    options: [
      { value: 'happy', label: 'Feliz', icon: '😊' },
      { value: 'sensitive', label: 'Sensible', icon: '🥺' },
      { value: 'sad', label: 'Triste', icon: '😢' },
      { value: 'irritable', label: 'Irritable', icon: '😤' },
      { value: 'calm', label: 'Calmada', icon: '😌' } // Fallback
    ]
  },
  {
    id: 'pain',
    title: '¿Sientes alguna molestia física?',
    subtitle: 'Nos ayuda a proyectar alertas premenstruales',
    options: [
      { value: 'none', label: 'Sin dolor', icon: '✨' },
      { value: 'cramps', label: 'Cólicos', icon: '⚡' },
      { value: 'headache', label: 'Cabeza', icon: '🤕' },
      { value: 'breasts', label: 'Senos', icon: '🍈' }
    ]
  },
  {
    id: 'bleeding',
    title: '¿Tuviste sangrado hoy?',
    subtitle: 'Vital para calibrar el algoritmo de tu ciclo',
    options: [
      { value: 'none', label: 'Nada', icon: '💧' },
      { value: 'spotting', label: 'Manchado', icon: '🩸' },
      { value: 'light', label: 'Ligero', icon: '🩸' },
      { value: 'medium', label: 'Medio', icon: '🔴' },
      { value: 'heavy', label: 'Fuerte', icon: '⭕' }
    ]
  }
];

export default function DailyCheckInModal({ onComplete, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
      emotions: null,
      pain: null,
      bleeding: null
  });

  const stepData = STEPS[currentStep];

  const handleSelect = (value) => {
    const newAnswers = { ...answers, [stepData.id]: value };
    setAnswers(newAnswers);

    // Timeout para auto-avanzar después de seleccionar (Sensación fluida)
    setTimeout(() => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            // Completado
            onComplete(newAnswers);
        }
    }, 400);
  };

  const progressPct = ((currentStep) / STEPS.length) * 100;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      zIndex: 999999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem'
    }}>
        {/* Barra de progreso superior */}
        <div style={{ position: 'absolute', top: '2rem', left: '2rem', right: '2rem', height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
           <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.4s ease' }} />
        </div>

        {/* Cierre condicional o Botón Saltar */}
        <button 
           onClick={onClose}
           style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
           Omitir hoy
        </button>

        <div className="animate-fade-in" key={currentStep} style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--color-text-highlight)', marginBottom: '0.4rem' }}>{stepData.title}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>{stepData.subtitle}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', justifyItems: 'stretch' }}>
                {stepData.options.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => handleSelect(opt.value)}
                        className="hover-scale"
                        style={{
                            background: answers[stepData.id] === opt.value ? 'var(--color-primary)' : 'var(--glass-bg)',
                            color: answers[stepData.id] === opt.value ? 'var(--btn-text-color)' : 'var(--color-text-main)',
                            border: answers[stepData.id] === opt.value ? 'none' : '1px solid var(--glass-border)',
                            padding: '1.5rem',
                            borderRadius: '20px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            boxShadow: answers[stepData.id] === opt.value ? 'var(--btn-primary-shadow)' : '0 2px 10px rgba(0,0,0,0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            width: '100%'
                        }}
                    >
                        <span style={{ fontSize: '2rem' }}>{opt.icon}</span>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
        
        {/* Paso atrás manual si se equivocó */}
        {currentStep > 0 && (
           <button 
             onClick={() => setCurrentStep(c => c - 1)}
             style={{ background: 'none', border: 'none', padding: '1rem', marginTop: '2rem', color: 'var(--color-text-muted)', cursor: 'pointer', opacity: 0.7 }}
           >
             ← Volver a la pregunta anterior
           </button>
        )}
    </div>,
    document.body
  );
}
