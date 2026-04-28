# Estado del Proyecto: BorBor (Wellness App)

> **Instrucción para el Agente:** Este documento es la fuente viva de verdad y memoria a largo plazo del proyecto. Revísalo al iniciar cada sesión. Actualízalo de forma silenciosa cada vez que completes un hito, cambies la arquitectura o resuelvas un bug crítico. NUNCA borres el historial sin consolidar el contexto.

## 🎯 Objetivo General
* Desarrollar una plataforma integral de bienestar sexual y fortalecimiento del piso pélvico orientada a la mujer, con diseño premium, gamificación (Reto de 30 Días), feedback visual motivador y currícula educativa.

## 📌 Foco de la Sesión Actual
* **Finalizado:** Migración completa de marca (Holistica -> BorBor) y separación de infraestructura (Backend propio en Chile/Brasil).
* **Finalizado:** Seguridad Nivel 2: Implementación de Control de Acceso Basado en Roles (RBAC) en Firestore y validaciones de ruta.

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
* Migración de marca a BorBor y conexión a nuevo proyecto de Firebase.
* Implementación de Seguridad Nivel 2 (Roles en DB) para el Dashboard administrativo.
* Refinamiento de micro-animaciones (CSS y transiciones fluidas).
* Mejora drástica de la estética del fondo animado (Glow y orbes fluidos en Canvas).

## 📋 Tareas Pendientes (To-Do)
1. [ ] **[Alta Prioridad]:** Optimización de Rendimiento (Performance). Reducir el tamaño de los bundles y optimizar renders innecesarios en dashboards pesados.
2. [x] **[Finalizado]:** Refinar micro-animaciones (CSS y Canvas).
3. [ ] **[Media Prioridad]:** Crear un sistema de notificaciones para recordar al usuario que debe realizar sus ejercicios.
4. [x] **[Finalizado]:** Aumentar el ancho de visualizacion de la sección de academia. Con un diseño flexible inteligente adaptable a diferentes tamaños de pantalla.
5. [/] **[En curso]:** Incorporar música Zen o ambientación de fondo (Implementado ZenAudio básico).
6. [ ] **[Alta Prioridad]:** Agregar sonidos de recompensa (XP/Monedas).
7. [ ] **[Media Prioridad]:** Sincronizar sonidos con los ritmos de las actividades Kegel.
8. [x] **[Finalizado]:** Mejorar drásticamente la estética del fondo animado (orbes y luciérnagas).

## 🐞 Bugs Activos y Blockers
* **Resuelto:** Acceso administrativo mediante UID fijo (Migrado a Roles).
* **Resuelto:** Redirección de género post-ejercicio (Bug #4).
* **Resuelto:** Acceso cruzado a perfiles de género opuesto (Bug #4).

## 📂 Archivos Principales en Modificación
* `AdminDashboard.jsx`, `HombreHome.jsx`, `MujerHome.jsx`, `KegelsModule.jsx`, `Welcome.jsx`.
