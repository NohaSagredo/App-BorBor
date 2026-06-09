import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, ChevronDown, ChevronUp, Award, Sparkles, Search, SlidersHorizontal, PlayCircle, Clock, Bookmark } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import GlobalLoader from '../components/GlobalLoader';

const ACADEMY_CONTENT_FEMALE = [
  {
    id: 'f1',
    title: 'Anatomía y Fundamentos',
    icon: '🧘‍♀️',
    summary: 'Conoce los músculos reales que sostienen tu bienestar íntimo.',
    content: `El suelo pélvico es un conjunto de músculos y tejidos conectivos que forman una "hamaca" en la base de la pelvis. Sostiene los órganos pélvicos: vejiga, útero y recto. El músculo clave es el Pubocoxígeo (PC).\n\nPara identificarlos, imagina que intentas detener el flujo de orina a mitad de camino. Sentirás una elevación interna. ¡Atención! No practiques esto constantemente al orinar, solo hazlo una o dos veces para identificar el músculo.`,
    expandedContent: `El suelo pélvico no actúa en aislamiento. Funciona en estricta coordinación con el diafragma respiratorio, los músculos multífidos de la columna y el transverso del abdomen, formando lo que en fisioterapia se conoce como el "Core Cylinder" (Cilindro Central).\n\nFascia y Tejido Conectivo: Más allá de solo músculo estriado, existe una densa red de fascia endopélvica. Cuando esta se debilita (ya sea por factores hormonales, partos o sedentarismo), la pura contracción no basta; se requiere reentrenamiento propioceptivo para enseñarle al cerebro a reclutar estas fibras en situaciones de impacto (como estornudar o saltar).\n\nEl exceso de intentos de detener la orina (flujo) puede causar reflujo vesical y dañar los nervios autonómicos responsables del vaciado, por ello la identificación se debe realizar idealmente acostada (en decúbito supino) y en escenarios apartados del inodoro.\n\nLas fibras del músculo elevador del ano (Levator Ani) — compuesto por el pubocoxígeo, puborrectal e iliocoxígeo — responden tanto a la voluntad consciente como a reflejos automáticos. El entrenamiento propioceptivo busca mejorar ambas vías para lograr un soporte dinámico que se active sin que tengas que pensar en ello.`,
    quiz: {
      question: '¿Qué otros músculos forman junto al suelo pélvico el "Core Cylinder"?',
      options: ['Bíceps y Tríceps', 'Diafragma y Transverso abdominal', 'Cuádriceps e Isquiotibiales'],
      answerIndex: 1,
      reward: 10
    }
  },
  {
    id: 'f2',
    title: 'Niveles de Kegel',
    icon: '📊',
    summary: 'Cómo progresar desde el nivel básico hasta el avanzado.',
    content: `• Nivel Principiante: Contracciones de 3 segundos y 3 de relajación. Foco en aislar el músculo sin apretar glúteos.\n• Nivel Intermedio: Contracciones de 5-10 segundos progresivos con 10s de relajación. Agregamos "Quick Flicks" (contracciones de 1 segundo rápidas).\n• Nivel Avanzado: Ejercicios dinámicos sumando posturas como sentadillas o puentes de glúteo a las contracciones combinadas.`,
    expandedContent: `El músculo del suelo pélvico está compuesto estructuralmente por dos tipos de fibras musculares. Aproximadamente el 70% son Fibras de Contracción Lenta (Tipo I) y el 30% son Fibras de Contracción Rápida (Tipo II).\n\n• Entrenando el Tipo I: Necesitas "Holds" (Contracciones estáticas de largo aliento, aguantando hasta 10 segundos). Esto otorga resistencia y soporte basal continuo durante el día a día para evitar prolapsos y filtraciones lentas.\n\n• Entrenando el Tipo II: Necesitas "Flicks" (Contraer agresivamente un milisegundo y soltar). Estos reaccionan a presiones súbitas, protegiéndote instantáneamente al reírte o toser fuerte.\n\nIgnorar alguno de estos dos sistemas resulta en una rehabilitación defectuosa e incompleta. Una rutina equilibrada alterna series de "holds" largos con ráfagas de "flicks" rápidos, cubriendo ambas poblaciones de fibras y ofreciendo protección tanto estática como dinámica.\n\nPeriodización del entrenamiento: Así como en el gimnasio se usan mesociclos de fuerza e hipertrofia, aquí deberías dedicar 2 semanas focalizando resistencia (holds de 10s) y luego 1 semana priorizando velocidad (flicks de 1s x 20 repeticiones), para evitar mesetas adaptativas.`,
    quiz: {
      question: '¿Para qué sirven principalmente las Fibras de Contracción Rápida (Tipo II) en tu suelo pélvico?',
      options: ['Para mantener los órganos sostenidos al dormir', 'Para reaccionar velozmente a aumentos súbitos de presión (como un estornudo)', 'Para mejorar la digestión'],
      answerIndex: 1,
      reward: 15
    }
  },
  {
    id: 'f3',
    title: 'Relajación Pélvica (Kegel Inverso)',
    icon: '🌸',
    summary: 'Por qué relajar es igual o más importante que contraer.',
    content: `Un suelo pélvico demasiado tenso causa dolor (dispareunia). Para relajar, adopta una postura cómoda, inhala profundo e imagina que el suelo pélvico se ensancha y desciende. Exhala lento dejando regresar los músculos sin forzar empujes.\n\nSe recomienda que el 30% de tu rutina consista en ejercicios de relajación y el 70% en contracciones de fuerza.`,
    expandedContent: `El concepto de que todo músculo fuerte debe estar "apretado" es un error clínico inmenso. El suelo pélvico necesita rango de movimiento.\n\nLa hipertonía (estado de espasmo permanente y acortamiento de las fibras) es producida comúnmente por un estrés psicológico subyacente donde las mujeres adoptan una postura defensiva ("belly-gripping" o apretar constantemente el estómago hacia adentro) o producto de traumatismos.\n\nEl Kegel Inverso (Reverse Kegel) actúa manipulando el nervio vago y reseteando el sistema nervioso simpático. Si presentas dolores profundos al usar tampones o copas menstruales, detén los ejercicios convencionales de Kegel; necesitas dedicar un 100% de tu esfuerzo inicial estrictamente en meditación de expansión respiratoria y técnicas paradójicas antes de intentar recuperar la fuerza.\n\nRecuerda: Un músculo perpetuamente tenso se convierte en un músculo funcionalmente débil. Esto se conoce como "debilidad por hipertonía": el músculo está tan acortado que no tiene rango suficiente para generar una contracción poderosa cuando realmente se necesita.\n\nTécnica de elongación con gravedad: Acuéstate boca arriba, rodillas hacia el pecho, y deja que la gravedad abra tu pelvis. Respira lento hacia el bajo vientre durante 5 minutos. Este ejercicio es la base de cualquier protocolo de rehabilitación para vaginismo o dispareunia.`,
    quiz: {
      question: '¿Qué condición describe a un suelo pélvico que permanece acortado y tenso produciendo dolor persistente?',
      options: ['Hipertrofia', 'Hipertonía Pélvica', 'Atonía'],
      answerIndex: 1,
      reward: 20
    }
  },
  {
    id: 'f4',
    title: 'Pompoir: El Arte del Control',
    icon: '🌊',
    summary: 'Técnica avanzada para explorar contracciones rítmicas.',
    content: `El Pompoir es un sistema avanzado de control y consciencia de la musculatura vaginal interna con 5 movimientos fundamentales:\n1. Succionar: Tracción que atrae hacia adentro.\n2. Ordeñar: Contracción rítmica ondulatoria (de la base hacia dentro).\n3. Bloquear: Contracción sostenida y firme alrededor de un punto.\n4. Expulsar: Empuje suave y controlado hacia afuera.\n5. Retorcer: Movimiento avanzado rotatorio sutil de la musculatura.`,
    expandedContent: `A diferencia del control general de Kegel que bloquea los tres anillos de manera conjunta, la disciplina originaria de la India y Medio Oriente bautizada Pompoir aboga por aislar artificialmente los distintos ejes del cabestrillo de la musculatura profunda.\n\nBiomecánicamente implica entrenar individualmente tres secciones:\n1. El anillo externo (Bulboesponjoso).\n2. El tercio medio (haces iliococcígeos).\n3. El fornix profundo.\n\nPara lograr las famosas ondas peristálticas ("ordeñar"), tu corteza motora necesita trazar una disociación neuronal, enviando un impulso secuencial que viaja por estos tres sectores en lugar de reclutarlos mediante una orden masiva simultánea. Su aprendizaje genera mejoras notables de propiocepción íntima, lubricación natural producto del masaje glandular interno y amplificación sensitiva en ambos individuos a nivel neurológico.\n\nProgresión de aprendizaje recomendada:\n• Semanas 1-2: Solo contracciones generales (Kegel clásico) para construir conciencia basal.\n• Semanas 3-4: Intentar diferenciar "arriba" vs "abajo" dentro del canal.\n• Semanas 5-8: Practicar contracciones secuenciales lentas (onda ascendente en 5 segundos).\n• Mes 3+: Incorporar ritmo y velocidad a la onda peristáltica.`,
    quiz: {
      question: '¿En qué se basa fisiológicamente el movimiento ondulante conocido como "ordeñar" durante el Pompoir?',
      options: ['En contraer el diafragma sin usar las piernas', 'En reclutar simultánea y explosivamente todo el abdomen', 'En disociar neuronalmente secciones musculares enviando el pulso motor por etapas'],
      answerIndex: 2,
      reward: 25
    }
  },
  {
    id: 'f5',
    title: 'Yoga para Suelo Pélvico',
    icon: '🧘',
    summary: 'Posturas corporales que benefician tu salud pélvica.',
    content: `Las mejores posturas para tu bienestar pélvico incluyen:\n\n- Postura de la Mariposa (Baddha Konasana): Unir plantas de pies. Libera tensión y abre caderas.\n- Bebé Feliz (Ananda Balasana): De espaldas sujetando los pies. Estira el suelo pélvico y baja presión lumbar.\n- Sentadilla Profunda (Malasana): Activa toda el área.\n- Gato-Vaca: Enseña la oscilación pélvica rítmica al respirar.`,
    expandedContent: `El tejido blando de tu suelo pélvico tiene fascias insertadas directamente en tu hueso sacro, coxis y los isquiones (huesos del glúteo). Si sufres de caderas tensas, ciática rígida o síndrome piriforme, los vectores de fuerza halarán mecánicamente de tu suelo pélvico desestabilizándolo.\n\nLa "Malasana" (sentadilla de descanso hindú profunda) genera una elongación pasiva excéntrica de los haces posteriores. Cuando pasas 5 minutos diarios en esta posición, obligas a tus glúteos y rotadores externos a ceder presión, liberando la compresión directa sobre el nervio pudendo. Esta apertura articular fomenta una red circulatoria abundante (angiogénesis local) oxigenando órganos cuya tasa de metabolismo celular decrece con el sentarse por largos periodos al frente de un computador.\n\nRutina sugerida de 10 minutos:\n• Gato-Vaca: 2 min (sincronizar Kegel con exhalación)\n• Malasana: 3 min (relajar SP en la posición)\n• Mariposa: 3 min (abrir rotadores de cadera)\n• Bebé Feliz: 2 min (estirar el SP y descomprimir lumbar)\n\nEsta secuencia moviliza todas las inserciones fasciales del suelo pélvico y prepara el tejido para la contracción activa posterior.`,
    quiz: {
      question: 'Fisiológicamente, ¿por qué ayuda tener caderas flexibles y tendones pélvicos relajados?',
      options: ['Porque endurece los tendones', 'Porque la fascia se encuentra unida a la cadera, y quitar tensión allí disminuye presiones directas al área pélvica y ciática', 'Porque ayuda al sueño REM'],
      answerIndex: 1,
      reward: 10
    }
  },
  {
    id: 'f6',
    title: 'Respiración y Mindfulness',
    icon: '🌬️',
    summary: 'La clave secreta para la conexión íntima.',
    content: `El diafragma y el suelo pélvico se mueven juntos como un pistón.\n\nAl inhalar: El vientre se expande, y el suelo pélvico desciende/se relaja.\nAl exhalar: El diafragma asciende y el suelo pélvico se eleva/contrae.\n\nDurante la intimidad: Respirar profundamente activa el sistema parasimpático y "frena" la intensidad (ideal para prolongar). Respirar rápido y sonoro aumenta tu estimulación y circulación.`,
    expandedContent: `La sexualidad y excitación funcional humanas operan bajo sistemas duales. El sistema Nervioso Simpático (lucha y huída/fuego) acelera el ritmo cardíaco e induce el pico de la tensión orgásmica. Sin embargo, toda la lubricación preparatoria y el engrosamiento del tejido clitoriano se logran solo bajo la vía Parasimpática (descanso y digestión).\n\nEl diafragma, el cual cruza por tu centro, tiene al nervio Vago ensartado a través de su hiato esofágico. Cuando empleas una respiración lenta y prolongas la exhalación (por ejemplo, tomar 4 segundos de inhalación y exhalar frunciendo labios en 6 segundos), estimulas el nervio vago enviando transmisores inhibidores al bulbo raquídeo, obligando al sistema cardiovascular a calmarse.\n\nEsta regulación autónoma controlada aumenta la resistencia a contratiempos emocionales y es una de las pocas herramientas humanas para modificar intencionalmente ritmos biológicos inconscientes.\n\nEjercicio práctico de "Respiración 4-7-8":\n• Inhala por la nariz contando 4 segundos.\n• Retén el aire contando 7 segundos.\n• Exhala lentamente por la boca contando 8 segundos.\n• Repite 4 ciclos. Esto induce un estado parasimpático profundo en menos de 2 minutos.`,
    quiz: {
      question: '¿Qué sucede si alargas tu exhalación respirando profundamente (ej: inhalar en 4s, exhalar en 6s)?',
      options: ['Activamos el sistema nervioso simpático, induciendo al páncreas a entrar en pánico', 'Estimulamos el Nervio Vago forzando la inducción a un estado biológico parasimpático de calma profunda', 'Nada en especial, simplemente el aire sale más rápido'],
      answerIndex: 1,
      reward: 15
    }
  }
];

const ACADEMY_CONTENT_MALE = [
  {
    id: 'm1',
    title: 'El Músculo PC en el Hombre',
    icon: '⚛️',
    summary: 'Identificando tu motor de potencia y resistencia.',
    content: `El músculo Pubococcígeo (PC) en los hombres rodea la base del pene y el ano. Es el principal responsable del soporte de los órganos de la pelvis, de la fuerza eréctil y del control del flujo eyaculatorio.\n\nPara encontrarlo: Imagina que estás orinando y quieres interrumpir el flujo del líquido. El músculo que aprietas es tu núcleo PC.`,
    expandedContent: `El suelo pélvico masculino opera con un grado de aislamiento único comparado con otros bloques. Dos componentes críticos para una gran función son:\n\n1. Músculo Isquiocavernoso (IC): Clave y fundamental para endurecer estructuralmente la compresión sanguínea peneana y retener el flujo durante las erecciones severas, previniendo fuga venosa.\n\n2. Músculo Bulboesponjoso (BC): Principal mediador para exhalar semen fuera de la uretra al alcanzar el orgasmo y el encargado directo del control orgásmico en rutinas de contención y freno.\n\nSi identificas cómo separar la presión entre retener heces (esfínter exterior), detener orina y elevar directamente el conducto frontal, podrás activar solo lo necesario y evitar fatigarlo excesivamente en pleno acto.\n\nTest de aislamiento: Acuéstate boca arriba con las rodillas flexionadas. Intenta "levantar" solo la base del pene sin apretar los glúteos ni el abdomen. Si notas que tu abdomen se endurece, estás compensando. La clave es la sutileza: piensa en un 30% de esfuerzo máximo, no en un 100%.`,
    quiz: {
      question: 'El músculo de tu suelo pélvico principal para prevenir la fuga venosa y estabilizar erecciones es el...',
      options: ['Bulboesponjoso', 'Transverso', 'Isquiocavernoso (IC)'],
      answerIndex: 2,
      reward: 20
    }
  },
  {
    id: 'm2',
    title: 'Dominio y Resistencia',
    icon: '🛡️',
    summary: 'Cómo utilizar la musculatura para evitar la eyaculación precoz.',
    content: `Tener un músculo PC fuerte y entrenado mejora dramáticamente el control eyaculatorio. Durante un alto nivel de excitación, la tensión tiende a acumularse. Realizar contracciones sostenidas de "Hold" (Sujetar firme y luego soltar completamente) te permite disipar tensión de la zona pélvica y reducir la urgencia orgásmica.`,
    expandedContent: `La eyaculación precoz o rápida usualmente proviene de un componente mixto: hipersensibilidad en el glande o reflejos espinales demasiado programados para dispararse al menor umbral de excitación.\n\nCientíficamente, cuando practicas Contracciones Isométricas Severas ("Holds") justo antes del "Punto de No Retorno" orgásmico, se induce un estado llamado Fenómeno de Fatiga Competitiva. Tu sistema nervioso entra en conflicto porque está dividiendo sus canales de transmisión para manejar una contracción física máxima de 10s y su reflejo inminente sexual. Al fatigarlo rápidamente de forma temporal con un "Hold", logras que la curva neurofisiológica desestime el orgasmo para "concentrarse" en el tono muscular.\n\nSumado a una relajación súbita completa (Belly breathing), disipas de golpe el punto de calor, bajando un nivel tu estímulo general.\n\nProtocolo "Stop-Start Muscular":\n1. Durante la estimulación, al sentir un 7/10 de excitación, detén todo movimiento.\n2. Realiza un Hold severo (contracción máxima del PC) durante 10 segundos.\n3. Suelta completamente y respira profundo desde el abdomen por 15 segundos.\n4. Reanuda. Repetir este ciclo entrena al sistema nervioso a "resetear" su umbral de disparo reflejo.`,
    quiz: {
      question: '¿Qué mecanismo fisiológico aprovechas al utilizar Holds severos justo antes del orgasmo para frenarlo?',
      options: ['Efecto de Gravedad de Bernoulli', 'Fenómeno de fatiga competitiva neuronal', 'Hiperactividad celular prostática'],
      answerIndex: 1,
      reward: 15
    }
  },
  {
    id: 'm3',
    title: 'Relajación y Salud de Próstata',
    icon: '🌿',
    summary: 'Manteniendo una estructura pélvica libre de dolores.',
    content: `Un suelo pélvico hipertónico en hombres puede generar síntomas de prostatitis crónica y dolor pélvico. Es crucial realizar Kegels invertidos ("Reverse Kegels").\n\nTécnica: Inhala profundamente llenando tu abdomen, e imagina cómo el pene y la base del escroto descienden milimétricamente expandiéndose. Exhala suave relajando. Hazlo unas 15 veces al día.`,
    expandedContent: `Miles de hombres padecen dolores en la base de la uretra o perineo después de entrenar en el gimnasio, montar bicicleta o pasar períodos de estrés laboral, pensando que cursan una infección crónica bacteriana.\n\nEl CPPS (Chronic Pelvic Pain Syndrome) es una tensión miofascial subyacente. Los ligamentos pélvicos atrapan nervios sensitivos. Al someter a Kegels Inversos empujando ligeramente — cual si trataras sutilmente de soltar gases (evadiendo pujar usando fuerzas glúteas u originando hernias abdominales) — generas un efecto de estiramiento pasivo a lo largo del suelo pélvico frontal y distal.\n\nCon el tiempo, la fascia readapta su longitud basal. Además la baja de compresión sobre la arteria prostática mejora la irrigación a la próstata disminuyendo tasas inflamatorias.\n\nSignos de alerta de hipertonía masculina:\n• Dolor o molestia al sentarse por largos periodos\n• Urgencia urinaria sin infección bacteriana confirmada\n• Dolor post-eyaculatorio en la base del pene\n• Hormigueo o pesadez en el perineo\n\nSi presentas 2 o más, prioriza la relajación sobre el fortalecimiento.`,
    quiz: {
      question: 'El CPPS (Síndrome de Dolor Pélvico Crónico) frecuentemente no se debe a infecciones prostáticas, sino a...',
      options: ['Un suelo pélvico crónicamente espalmado (Hipertónico) y acortado', 'Falta de vitaminas B y Magnesio', 'Mucha sudoración tras el ejercicio cardiovascular'],
      answerIndex: 0,
      reward: 15
    }
  },
  {
    id: 'm4',
    title: 'Respiración para la Durabilidad',
    icon: '🌬️',
    summary: 'El manejo del aire como acelerador y freno.',
    content: `Tu respiración dicta tu sistema nervioso. Respirar superficial y rápido desde el pecho induce una respuesta de estrés y acelera el orgasmo. Respirar desde el estómago, profundo y relajado (diafragmáticamente) envía señales de calma al cerebro y relaja el suelo pélvico.`,
    expandedContent: `Cada fase de una relación incrementa el acopio de neurotransmisores adrenérgicos (Dopamina y Adrenalina). Un factor para durar 5 minutos vs durar 30, consiste en "fluctuar" artificialmente tu umbral.\n\nEfectuar el principio de respiración táctica "Box Breathing" (4s inhalar, 4s pausa, 4s exhalar, 4s pausa) intercepta la lectura quimio-receptora de la sangre (aumentos de CO2). Tu cerebro asume que necesitas estar en reposo profundo para poder regular oxigenación sistémica. Biomecánicamente, esta regulación obliga a tu tejido esfíntero a soltar la sobrecarga tensional.\n\nEl dominio aéreo se constituye en el 50% de las terapias para corregir falacias de resistencia íntima masculina y prolongación general.\n\nEjercicio "Box Breathing" aplicado:\n• Inhala 4 segundos por la nariz.\n• Retén el aire 4 segundos (sin tensionar mandíbula ni hombros).\n• Exhala por la boca 4 segundos.\n• Pausa sin aire 4 segundos.\n• Repite 6 ciclos. Practica esto antes de dormir para automatizar la respuesta parasimpática.\n\nCombinación avanzada: Realiza Box Breathing + Reverse Kegel simultáneamente. Al inhalar, expande el suelo pélvico. Al exhalar, déjalo volver natural. Nunca fuerces la contracción durante este ejercicio combinado.`,
    quiz: {
      question: '¿Qué le informa al cerebro la respiración baja y táctica (Ej. pausas de 4 segundos) respecto a tu nivel de estrés?',
      options: ['Le señala que necesitas más adrenalina muscular urgente', 'Inhibe el quimio-receptor asumiendo letargo profundo, forzando a bajar revoluciones y relajarse', 'Disminuye la absorción de serotonina gástrica'],
      answerIndex: 1,
      reward: 10
    }
  }
];

// ─── Componente de Animación de Monedas ────────────────────────────
function CoinRewardAnimation({ coins, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 999999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div className="animate-fade-in" style={{
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        color: '#78350f',
        padding: '1.5rem 2.5rem',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(245,158,11,0.5)',
        display: 'flex', alignItems: 'center', gap: '14px',
        animation: 'coinPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, coinFade 0.6s ease 2.2s forwards',
        fontSize: '1.3rem',
        fontWeight: 800,
        letterSpacing: '-0.5px'
      }}>
        <span style={{ fontSize: '2rem' }}>💰</span>
        +{coins} KegelCoins
      </div>

      <style>{`
        @keyframes coinPop {
          0% { transform: scale(0.3) translateY(40px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes coinFade {
          0% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.8) translateY(-30px); }
        }
      `}</style>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────
export default function AcademyModule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('mujer');
  const [expandedId, setExpandedId] = useState(null);

  // Progreso de lecturas
  const [readLessons, setReadLessons] = useState(() => {
    const stored = localStorage.getItem('borbor-academy-progress');
    return stored ? JSON.parse(stored) : [];
  });

  // Sistema de quizzes
  const [passedQuizzes, setPassedQuizzes] = useState(() => {
    const storedQuizzes = localStorage.getItem('borbor-academy-quizzes');
    return storedQuizzes ? JSON.parse(storedQuizzes) : [];
  });
  const [showDeepStudy, setShowDeepStudy] = useState({});    // { lessonId: true/false }
  const [selectedAnswer, setSelectedAnswer] = useState({});   // { lessonId: index }
  const [quizFeedback, setQuizFeedback] = useState({});       // { lessonId: 'correct' | 'wrong' }
  const [coinAnimation, setCoinAnimation] = useState(null);   // { coins: N } o null
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Comprobar rol de usuario validado
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.role) setRole(data.role);
            if (data.academyProgress) {
              setReadLessons(data.academyProgress);
              localStorage.setItem('borbor-academy-progress', JSON.stringify(data.academyProgress));
            }
            if (data.academyQuizzes) {
              setPassedQuizzes(data.academyQuizzes);
              localStorage.setItem('borbor-academy-quizzes', JSON.stringify(data.academyQuizzes));
            }
          }
        } catch (err) {
          console.error("Error cargando perfil", err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const contentList = ['hombre', 'pareja'].includes(role) ? ACADEMY_CONTENT_MALE : ACADEMY_CONTENT_FEMALE;

  const progressRatio = Math.round((readLessons.filter(id => contentList.some(c => c.id === id)).length / contentList.length) * 100) || 0;

  const quizzesCompleted = passedQuizzes.filter(id => contentList.some(c => c.id === id)).length;
  const totalQuizzes = contentList.filter(c => c.quiz).length;

  const toggleLesson = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Marcar como leída
      if (!readLessons.includes(id)) {
        const updated = [...readLessons, id];
        setReadLessons(updated);
        localStorage.setItem('borbor-academy-progress', JSON.stringify(updated));
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          updateDoc(userDocRef, { academyProgress: updated }).catch(console.error);
        }
      }
    }
  };

  const toggleDeepStudy = (lessonId) => {
    setShowDeepStudy(prev => ({ ...prev, [lessonId]: !prev[lessonId] }));
  };

  const handleQuizAnswer = useCallback(async (lesson, optionIndex) => {
    const lessonId = lesson.id;
    if (passedQuizzes.includes(lessonId)) return; // Ya aprobado
    if (quizFeedback[lessonId]) return; // Ya respondido en este intento

    setSelectedAnswer(prev => ({ ...prev, [lessonId]: optionIndex }));

    const isCorrect = optionIndex === lesson.quiz.answerIndex;

    if (isCorrect) {
      setQuizFeedback(prev => ({ ...prev, [lessonId]: 'correct' }));

      const updatedQuizzes = [...passedQuizzes, lessonId];
      setPassedQuizzes(updatedQuizzes);
      localStorage.setItem('borbor-academy-quizzes', JSON.stringify(updatedQuizzes));

      setCoinAnimation({ coins: lesson.quiz.reward });
      if (auth.currentUser) {
        try {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userDocRef, {
            academyQuizzes: updatedQuizzes,
            kegelCoins: increment(lesson.quiz.reward)
          });
        } catch (err) { console.error(err); }
      }
    } else {
      setQuizFeedback(prev => ({ ...prev, [lessonId]: 'wrong' }));
      setTimeout(() => {
        setQuizFeedback(prev => ({ ...prev, [lessonId]: null }));
        setSelectedAnswer(prev => ({ ...prev, [lessonId]: null }));
      }, 2000);
    }
  }, [passedQuizzes, quizFeedback]);

  if (loading) return <GlobalLoader text="Cargando biblioteca..." />;

  const filteredContent = contentList.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) || lesson.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="relative z-10 pt-20 pb-32 px-4 md:px-8 max-w-7xl mx-auto font-sans animate-fade-in min-h-screen">
      {coinAnimation && <CoinRewardAnimation coins={coinAnimation.coins} onDone={() => setCoinAnimation(null)} />}

      <div className="mb-8 relative z-10">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">Academy</h2>
            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">Expande tu conocimiento con cursos curados sobre salud holística, anatomía y bienestar diario.</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg">
             <div className="relative w-16 h-16 flex-shrink-0">
               <svg width="64" height="64" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
                 <circle cx="55" cy="55" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                 <circle cx="55" cy="55" r="48" fill="none" stroke="#cfbcff" strokeWidth="8"
                   strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 48}`} strokeDashoffset={`${2 * Math.PI * 48 * (1 - progressRatio / 100)}`}
                   style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-white text-lg font-bold leading-none">{progressRatio}%</span>
               </div>
             </div>
             <div>
               <div className="text-white font-bold text-lg">{readLessons.filter(id => contentList.some(c => c.id === id)).length}/{contentList.length} Lecciones</div>
               <div className="text-emerald-400 font-semibold text-sm flex items-center gap-1">
                 <CheckCircle size={14} /> {quizzesCompleted}/{totalQuizzes} Pruebas
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="mb-8 relative group z-10">
        <div className="relative flex items-center bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-xl">
          <Search className="text-slate-400 mr-3" size={20} />
          <input className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 outline-none text-base" placeholder="Buscar temas, ejercicios o anatomía..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 relative z-10">
        {filteredContent.map((lesson, index) => {
          const isExpanded = expandedId === lesson.id;
          const isQuizPassed = passedQuizzes.includes(lesson.id);
          const isDeepStudyOpen = showDeepStudy[lesson.id];
          const currentFeedback = quizFeedback[lesson.id];
          const currentSelected = selectedAnswer[lesson.id];
          const gradients = ['from-cyan-900/80 to-blue-900/80', 'from-fuchsia-900/80 to-rose-900/80', 'from-violet-900/80 to-purple-900/80', 'from-emerald-900/80 to-teal-900/80', 'from-amber-900/80 to-orange-900/80'];
          
          return (
            <article key={lesson.id} className={`break-inside-avoid relative rounded-2xl overflow-hidden bg-slate-900/70 backdrop-blur-md border transition-all duration-500 ${isExpanded ? 'border-primary shadow-[0_0_30px_rgba(207,188,255,0.2)]' : 'border-white/10'}`}>
              <div className="relative w-full cursor-pointer overflow-hidden" style={{ height: isExpanded ? '120px' : (index % 2 === 0 ? '220px' : '180px') }} onClick={() => toggleLesson(lesson.id)}>
                <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center`}>
                  <span className="text-6xl opacity-30">{lesson.icon}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
              </div>

              <div className="p-6">
                <div className="cursor-pointer" onClick={() => toggleLesson(lesson.id)}>
                  <h3 className="text-xl font-bold text-white mb-2">{lesson.title}</h3>
                  {!isExpanded && <p className="text-slate-400 text-sm line-clamp-3">{lesson.summary}</p>}
                </div>
                {isExpanded && (
                  <div className="animate-fade-in mt-4">
                    <div className="text-slate-300 text-sm p-4 rounded-xl bg-white/5 border border-white/5">{lesson.content}</div>
                    {lesson.expandedContent && (
                      <button onClick={() => toggleDeepStudy(lesson.id)} className={`mt-4 w-full p-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${isDeepStudyOpen ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-white'}`}>
                        {isDeepStudyOpen ? 'Cerrar Estudio Profundo' : 'Profundizar en este tema'}
                      </button>
                    )}
                    {isDeepStudyOpen && lesson.expandedContent && (
                      <div className="animate-fade-in mt-3 bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-5 text-slate-300 text-sm">
                        {lesson.expandedContent}
                      </div>
                    )}
                    {lesson.quiz && (
                      <div className={`mt-5 p-5 rounded-xl border ${isQuizPassed ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-amber-900/20 border-amber-500/30'}`}>
                        <h4 className={`text-sm font-bold mb-4 ${isQuizPassed ? 'text-emerald-400' : 'text-amber-400'}`}>{isQuizPassed ? 'Prueba Superada' : 'Cuestionario Rápido'}</h4>
                        <p className="text-white text-sm mb-4">{lesson.quiz.question}</p>
                        <div className="flex flex-col gap-2">
                          {lesson.quiz.options.map((option, idx) => {
                            const isSelected = currentSelected === idx;
                            return (
                              <button
                                key={idx}
                                disabled={currentFeedback != null}
                                onClick={() => handleQuizAnswer(lesson, idx)}
                                className={`w-full text-left p-3 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
                                  isSelected 
                                    ? (currentFeedback === 'correct' ? 'bg-emerald-900/40 border-emerald-500' : currentFeedback === 'wrong' ? 'bg-rose-900/40 border-rose-500' : 'bg-primary/20 border-primary') 
                                    : 'bg-slate-800/50 border-white/5 hover:bg-slate-700/50 hover:border-white/20'
                                }`}
                              >
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  isSelected 
                                    ? (currentFeedback === 'correct' ? 'bg-emerald-500 text-white' : currentFeedback === 'wrong' ? 'bg-rose-500 text-white' : 'bg-primary text-white') 
                                    : 'bg-slate-700 text-slate-300'
                                }`}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="text-white text-sm">{option}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Feedback */}
                        {currentFeedback === 'wrong' && (
                          <div className="animate-fade-in" style={{
                            marginTop: '0.8rem',
                            padding: '0.7rem',
                            background: 'rgba(239,68,68,0.08)',
                            borderRadius: '12px',
                            fontSize: '0.82rem',
                            color: '#b91c1c',
                            textAlign: 'center',
                            fontWeight: 600
                          }}>
                            ❌ Respuesta incorrecta. Revisa el contenido profundo e intenta de nuevo.
                          </div>
                        )}

                        {currentFeedback === 'correct' && (
                          <div className="animate-fade-in" style={{
                            marginTop: '0.8rem',
                            padding: '0.7rem',
                            background: 'rgba(16,185,129,0.1)',
                            borderRadius: '12px',
                            fontSize: '0.82rem',
                            color: '#065f46',
                            textAlign: 'center',
                            fontWeight: 600
                          }}>
                            🎉 ¡Correcto! Has ganado +{lesson.quiz.reward} KegelCoins.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

    </div>
  );
}
