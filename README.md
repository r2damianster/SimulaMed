# SimulaMed — prototipo 0-cost

Prototipo funcional de simulación clínica digital para la práctica de anamnesis y llenado técnico del Formulario MSP 002, derivado de la propuesta "Proyecto SimulaMed" (FCSEE, Universidad UTE). Reemplaza el stack propuesto originalmente (Character.AI + Google Pinpoint + Gemini Pro) por herramientas de costo cero o marginal:

| Función | Herramienta original | Herramienta en este prototipo |
|---|---|---|
| Paciente sintético conversacional | Character.AI | Groq API (modelos open-source, nivel gratuito) |
| Voz → texto | Google Pinpoint | Web Speech API del navegador |
| Texto → voz del paciente | — | SpeechSynthesis API del navegador |
| Evaluación con rúbrica | Gemini Pro | Groq API, mismo prompt estructurado |
| Registro de resultados | — | Pendiente (ver Roadmap) |

## Cómo usarlo

1. Abre `index.html` directamente en Chrome (el reconocimiento de voz solo funciona en navegadores basados en Chromium).
2. Consigue una API key gratuita en [console.groq.com/keys](https://console.groq.com/keys) — no pide tarjeta de crédito.
3. Pega la clave en el campo superior y pulsa "Guardar". Se guarda solo en el `localStorage` de tu navegador.
4. Pestaña **1 · Caso clínico**: genera un caso nuevo (patología variable cada vez).
5. Pestaña **2 · Consulta**: interroga al paciente por voz (botón del micrófono) o texto. El paciente responde por voz y texto.
6. Pestaña **3 · Evaluación**: al pulsar "Finalizar y evaluar", se califica la transcripción real contra los cinco campos del Formulario MSP 002 y se genera un puntaje sobre 10 con retroalimentación.

## Despliegue

Es un sitio estático de un solo archivo — no requiere build ni backend para el piloto:

### Opción 1: GitHub Pages (recomendado para piloto)
- Activa Pages sobre la rama principal en la configuración del repositorio. Gratis.
- La clave se ingresa en el navegador (ver **Nota de seguridad**).

### Opción 2: Vercel
- Arrastra la carpeta al [panel de Vercel](https://vercel.com). Gratis en el nivel free.
- Para usar un proxy y ocultar la clave: agrega variables de environment en **Settings > Environment Variables**:
  - `GROQ_API_KEY`: tu clave de Groq (nunca en el código fuente)
  - `GROQ_MODEL`: modelo de Groq (opcional; defecto: `llama-3.3-70b-versatile`)
- Luego despliega `proxy-example/cloudflare-worker.js` en Cloudflare Workers y apunta a ese proxy.

### Opción 3: Local
- Abrir `index.html` directamente también funciona.
- Nota: algunos navegadores restringen el micrófono en `file://`; si pasa, sirve la carpeta con `python -m http.server`.

## Nota de seguridad importante

La clave de API vive en el navegador del estudiante/docente que la ingresa (`localStorage`), y las llamadas salen directo del navegador hacia Groq. Esto es aceptable para un piloto de un solo computador de laboratorio, pero **no es seguro para producción o para compartir el repositorio públicamente con una clave ya cargada**: cualquiera con acceso al código fuente de la página o a las herramientas de desarrollador puede leer la clave y consumir tu cuota.

Para escalar a toda la facultad, mover la llamada a Groq detrás de un proxy propio evita exponer la clave. Ver `proxy-example/cloudflare-worker.js` para una referencia mínima desplegable gratis en Cloudflare Workers.

## Roadmap sugerido

- [ ] Proxy serverless para ocultar la API key (ver `proxy-example/`).
- [ ] Transcripción con Whisper de Groq (`whisper-large-v3`, ~$0.04/hora de audio) en vez de Web Speech API, para mayor precisión en acento ecuatoriano.
- [ ] Registro automático de cada evaluación en Google Sheets vía Google Apps Script (aprovechando el flujo de formularios que ya usa el equipo).
- [ ] Banco de casos clínicos curado por los docentes SME en vez de generación libre por el modelo, para alinear estrictamente con el sílabo.
- [ ] Exportar la transcripción y evaluación de cada sesión en PDF para el expediente del estudiante.

## Origen

Este prototipo nace del análisis de la propuesta "Proyecto SimulaMed" (Facultad de Ciencias de la Salud Eugenio Espejo, Universidad UTE) como prueba de concepto de una arquitectura de costo cero para la misma práctica pedagógica.
