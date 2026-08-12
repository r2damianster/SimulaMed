// Proxy mínimo para Cloudflare Workers — oculta la API key de Groq del lado del servidor.
//
// Por qué existe: en index.html tal como está, la API key de Groq se guarda en el
// navegador del usuario y las llamadas salen directo de ahí. Sirve para un piloto
// de un solo computador, pero no para compartir el sitio ampliamente: cualquiera
// puede leer la clave desde las herramientas de desarrollador.
//
// Cómo desplegarlo (gratis, nivel free de Cloudflare):
//   1. Crea una cuenta en https://dash.cloudflare.com (gratis).
//   2. Instala Wrangler: npm install -g wrangler
//   3. wrangler init simulamed-proxy   (o crea el worker desde el dashboard y pega este código)
//   4. Guarda la clave como secreto, NUNCA en el código:
//        wrangler secret put GROQ_API_KEY
//   5. wrangler deploy
//   6. Copia la URL que te da Cloudflare (algo como https://simulamed-proxy.tu-cuenta.workers.dev)
//   7. En index.html, cambia la URL de fetch de "https://api.groq.com/openai/v1/chat/completions"
//      a la URL de tu Worker, y quita el campo de API key del cliente por completo
//      (el Worker la agrega él mismo desde el secreto).

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Restringe qué páginas pueden llamar a este proxy. Reemplaza con tu dominio real
    // una vez desplegado (GitHub Pages, Netlify, etc.) para evitar que otros lo usen.
    const allowedOrigin = "*"; // TODO: cambiar a "https://tu-usuario.github.io" en producción

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const body = await request.json();

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + env.GROQ_API_KEY,
        },
        body: JSON.stringify(body),
      });

      const data = await groqResponse.text();

      return new Response(data, {
        status: groqResponse.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  },
};
