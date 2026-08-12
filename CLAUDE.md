# CLAUDE.md

Guía de contexto para Claude Code (u otro asistente) al trabajar en este repositorio.

## Qué es este proyecto

Prototipo de simulación clínica digital para entrenar anamnesis y llenado del Formulario MSP 002 en estudiantes de Medicina (materia Habilidades y Destrezas, FCSEE — Universidad UTE). Es la versión 0-cost de la propuesta "Proyecto SimulaMed", que originalmente dependía de Character.AI + Google Pinpoint + Gemini Pro.

Es un sitio estático de un solo archivo (`index.html`, HTML + CSS + JS vanilla, sin build step, sin framework, sin dependencias de npm). Todo el "backend" es la API de Groq llamada directo desde el navegador.

## Arquitectura

- **Generación de caso clínico**: prompt a Groq que devuelve JSON con datos demográficos, motivo de consulta visible y un `guion_clinico` oculto (antecedentes, revisión por sistemas, signos vitales, diagnóstico presuntivo + CIE-10).
- **Paciente conversacional**: cada turno del estudiante se envía junto con el `guion_clinico` como contexto de sistema (nunca visible en el DOM del estudiante) para que el modelo responda en personaje, sin revelar el diagnóstico.
- **Voz**: `SpeechRecognition` (STT) y `SpeechSynthesis` (TTS) son APIs nativas del navegador, no pasan por Groq. Solo funcionan en navegadores basados en Chromium.
- **Evaluación**: al finalizar, se envía la transcripción completa + el `guion_clinico` de referencia a Groq con un prompt que pide una calificación estructurada en JSON contra 5 criterios del Formulario MSP 002 (2 puntos cada uno, total /10).
- Todo el estado de la sesión vive en la variable `state` de JS, en memoria — no hay persistencia entre recargas salvo la API key (`localStorage`).

## Convenciones al modificar

- Mantener el archivo como un único HTML autocontenido salvo que se introduzca explícitamente un build step — es una decisión deliberada para que cualquier docente lo pueda alojar copiando un solo archivo.
- Los prompts de sistema (generación de caso, paciente, evaluación) están en español y ya calibrados para el contexto clínico ecuatoriano (CIE-10, terminología MSP). Si se edita un prompt, probar que la salida JSON siga siendo parseable — `parseJSONLoose()` solo limpia backticks de markdown, no corrige JSON inválido.
- El modelo de Groq es seleccionable (`llama-3.3-70b-versatile` por defecto). Si se agrega un modelo nuevo al `<select>`, verificar que soporte bien salida JSON estructurada en español antes de dejarlo como default.
- No introducir dependencias de servidor sin actualizar también `README.md` (instrucciones de despliegue) y sin mover la API key fuera del cliente — ver `proxy-example/`.

## Seguridad — no romper esto

La clave de Groq se ingresa en el navegador y se guarda en `localStorage`. Esto es aceptable solo porque el README lo advierte explícitamente y el uso previsto es un piloto de laboratorio. No agregar código que suba la clave a ningún servicio de terceros, ni la incluya en commits, ni la escriba en el propio HTML como valor por defecto.

Si se implementa el proxy serverless del roadmap, la clave debe vivir únicamente como variable de entorno del lado del servidor (Cloudflare Worker secret o equivalente), y el cliente debe dejar de pedir la clave al usuario.

## Pendientes conocidos (ver también README → Roadmap)

- Transcripción por Whisper de Groq en vez de Web Speech API.
- Registro de resultados en Google Sheets.
- Banco de casos curado en vez de generación libre.
- Exportar sesión a PDF.
