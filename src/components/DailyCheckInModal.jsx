import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

const STEPS = [
  {
    id: 'bleeding',
    title: '¿Tuviste sangrado hoy?',
    subtitle: 'Vital para calibrar el algoritmo de tu ciclo',
    options: [
      { value: 'none',     label: 'Nada',      icon: '💧' },
      { value: 'spotting', label: 'Manchado',   icon: '🟤' },
      { value: 'light',    label: 'Ligero',     icon: '🩸' },
      { value: 'medium',   label: 'Medio',      icon: '🩸' },
      { value: 'heavy',    label: 'Abundante',  icon: '🔴' }
    ]
  },
  {
    id: 'flowColor',
    title: '¿De qué color fue el sangrado?',
    subtitle: 'Salta si no tuviste sangrado hoy',
    skipIfPrev: { field: 'bleeding', value: 'none' }, // se salta si bleeding === none
    options: [
      { value: 'pink',  label: 'Rosado',        icon: '🌸' },
      { value: 'red',   label: 'Rojo',          icon: '🍎' },
      { value: 'dark',  label: 'Oscuro/Marrón', icon: '🍂' }
    ]
  },
  {
    id: 'emotions',
    title: '¿Cómo te sientes hoy?',
    subtitle: 'Elige tu estado de ánimo principal',
    options: [
      { value: 'happy',     label: 'Feliz',     icon: '😊' },
      { value: 'sensitive', label: 'Sensible',  icon: '🥺' },
      { value: 'sad',       label: 'Triste',    icon: '😢' },
      { value: 'irritable', label: 'Irritable', icon: '😤' },
      { value: 'calm',      label: 'Calmada',   icon: '😌' }
    ]
  }
];

export default function DailyCheckInModal({ onComplete, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    bleeding:  null,
    flowColor: null,
    emotions:  null,
  });

  const stepData = STEPS[currentStep];

  const handleSelect = (value) => {
    const newAnswers = { ...answers, [stepData.id]: value };
    setAnswers(newAnswers);

    setTimeout(() => {
      let nextStep = currentStep + 1;

      // Si el siguiente paso tiene skipIfPrev, chequeamos si saltar
      while (nextStep < STEPS.length) {
        const ns = STEPS[nextStep];
        if (ns.skipIfPrev && newAnswers[ns.skipIfPrev.field] === ns.skipIfPrev.value) {
          nextStep++;
        } else {
          break;
        }
      }

      if (nextStep < STEPS.length) {
        setCurrentStep(nextStep);
      } else {
        onComplete(newAnswers);
      }
    }, 400);
  };

  const progressPct = ((currentStep) / STEPS.length) * 100;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/60 backdrop-blur-md font-body-md">
      {/* Subtle particle effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full blur-[1px] opacity-70"></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-indigo-400 rounded-full blur-[1px] opacity-50"></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-cyan-300 rounded-full blur-[2px] opacity-40"></div>
      </div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-glass-heavy w-full max-w-sm rounded-[2rem] p-8 flex flex-col items-center text-center relative border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.1)]"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-surface-container-high rounded-t-[2rem] overflow-hidden">
          <motion.div 
            className="h-full bg-cyan-400 glow-cyan"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Close / Skip button */}
        <button 
           onClick={onClose}
           className="absolute top-4 right-4 text-outline-variant hover:text-white transition-colors"
           title="Omitir hoy"
        >
           <X size={24} />
        </button>

        <AnimatePresence mode="wait">
          <motion.div 
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-col items-center"
          >
            <h3 className="font-h1 text-h2 text-white mb-2 mt-4 leading-tight">{stepData.title}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-8">{stepData.subtitle}</p>

            <div className="grid grid-cols-2 gap-4 w-full">
                {stepData.options.map((opt) => {
                    const isSelected = answers[stepData.id] === opt.value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => handleSelect(opt.value)}
                            className={`relative group rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                                isSelected 
                                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                                    : 'bg-surface-container hover:bg-surface-container-high border-transparent hover:border-outline-variant'
                            } border cursor-pointer`}
                        >
                            <span className="text-4xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                            <span className={`font-label-caps tracking-widest uppercase mt-2 ${isSelected ? 'text-cyan-300 font-bold' : 'text-on-surface-variant'}`}>
                                {opt.label}
                            </span>
                            {isSelected && (
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center glow-cyan"
                                >
                                    <Check size={14} className="text-white" strokeWidth={3} />
                                </motion.div>
                            )}
                        </button>
                    )
                })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Manual back step */}
        {currentStep > 0 && (
           <button 
             onClick={() => {
               let prevStep = currentStep - 1;
               while (prevStep > 0) {
                 const ps = STEPS[prevStep];
                 if (ps.skipIfPrev && answers[ps.skipIfPrev.field] === ps.skipIfPrev.value) {
                   prevStep--;
                 } else {
                   break;
                 }
               }
               setCurrentStep(prevStep);
             }}
             className="mt-6 text-outline font-label-caps tracking-widest uppercase hover:text-white transition-colors"
           >
             ← Volver a la pregunta anterior
           </button>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
