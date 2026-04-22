# Estado del Proyecto: BorBor (Wellness App)

> **Instrucción para el Agente:** Este documento es la fuente viva de verdad y memoria a largo plazo del proyecto. Revísalo al iniciar cada sesión. Actualízalo de forma silenciosa cada vez que completes un hito, cambies la arquitectura o resuelvas un bug crítico. NUNCA borres el historial sin consolidar el contexto.

## 🎯 Objetivo General
* Desarrollar una plataforma integral de bienestar sexual y fortalecimiento del piso pélvico orientada a la mujer, con diseño premium, gamificación (Reto de 30 Días), feedback visual motivador y currícula educativa.

## 📌 Foco de la Sesión Actual
* **Finalizado:** Rediseño visual "Premium" completo de la aplicación (`HombreHome`, `MujerHome`, `AdminDashboard`, `KegelsModule`, `Welcome`). Estandarización de estética glassmorphic, gradientes y animaciones.

## 🗺️ Arquitectura y Decisiones Clave
* **Stack Tecnológico:** React 19, Vite, Firebase (Auth + Firestore).
* **Dependencias y Herramientas:** Recharts (Data), Canvas-Confetti, Date-fns, Lucide-React, React-Icons.
* **Patrones Principales:** Arquitectura por componentes con variables CSS para el manejo adaptativo del sistema de temas visuales (Rose, Lavender, etc.). Enfoque estético, colores elegantes y feedback dinámico fluido.

## 🛠️ Comandos de Desarrollo y Entorno
* `npm run dev` (run inside `App-Holistica-v2`)
* `npm run build`
* **Variables de Entorno necesarias:** Credenciales de Firebase.

## ✅ Hitos Completados (Historial)
* ... (hitos anteriores consolidados)
* Rediseño visual total de `HombreHome.jsx` y `MujerHome.jsx` con headers dinámicos y XP tracking.
* Embellecimiento de `KegelsModule.jsx` y `Welcome.jsx` (página de inicio).
* Transformación premium del `AdminDashboard.jsx` con paneles de insights mejorados y CRUD estilizado.
* Limpieza de código duplicado en módulos críticos para asegurar un build estable.

## 📋 Tareas Pendientes (To-Do)
1. [ ] **[Alta Prioridad]:** Optimización de Rendimiento (Performance). Reducir el tamaño de los bundles y optimizar renders innecesarios en dashboards pesados.
2. [ ] **[Baja Prioridad]:** Refinar micro-animaciones (CSS y Canvas).
3. [ ] **[Media Prioridad]:** Crear un sistema de notificaciones para recordar al usuario que debe realizar sus ejercicios.
4. [ ] **[Media Prioridad]:** Aumentar el ancho de visualizacion de la sección de academia. Con un diseño flexible inteligente adaptable a diferentes tamaños de pantalla.
5. [ ] **[Evaluación]:** Incorporar música Zen o ambientación de fondo al iniciar reproducciones de Kegels.

## 🐞 Bugs Activos y Blockers
* Al terminar una rutina de kegels, se vuelve al perfil de mujer aunque el usuario sea hombre.
* El usuario puede acceder al perfil de mujer aunque sea hombre cambiando la url y viceversa.

## 📂 Archivos Principales en Modificación
* `AdminDashboard.jsx`, `HombreHome.jsx`, `MujerHome.jsx`, `KegelsModule.jsx`, `Welcome.jsx`.
