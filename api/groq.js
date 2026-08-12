export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY no configurada en Vercel' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const modo = url.searchParams.get('mode') || 'chat';

    if (modo === 'transcribe') {
      const formData = await req.formData();
      const archivoAudio = formData.get('file');

      if (!archivoAudio) {
        return new Response(JSON.stringify({ error: 'No audio file provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const buffer = await archivoAudio.arrayBuffer();
      const nuevoFormData = new FormData();
      nuevoFormData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'audio.webm');
      nuevoFormData.append('model', 'whisper-large-v3-turbo');
      nuevoFormData.append('language', 'es');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: nuevoFormData,
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      const body = await req.json();
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config = {
  runtime: 'edge',
};
