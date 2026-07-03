const { createClient } = require('@supabase/supabase-js');

// Helper to fetch with retry and backoff on 429 errors
async function fetchWithRetry(url, options, maxRetries = 5) {
  let delay = 2000;
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429) {
      let waitTime = delay;
      try {
        // Clone the response so we can read it and still return it if we run out of retries
        const clone = response.clone();
        const retryInfo = await clone.json();
        if (retryInfo.error?.message?.includes("Please retry in")) {
          const match = retryInfo.error.message.match(/Please retry in ([\d\.]+)s/);
          if (match) {
            waitTime = Math.ceil(parseFloat(match[1]) + 1.5) * 1000;
          }
        }
      } catch (e) {
        // Ignorar fallo en parseo de JSON de error
      }
      console.warn(`[429 Quota] Límite excedido. Reintentando en ${waitTime / 1000}s... (Intento ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      delay *= 2.5; // Exponential backoff factor
      continue;
    }
    return response;
  }
  return fetch(url, options); // Final fallback request
}

// Helper function to call Gemini API
async function callGeminiClassifier(text, stars) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta la variable de entorno GEMINI_API_KEY.");
  }

  const prompt = `Eres un clasificador de reseñas de Google Maps para una cadena de creperías (La Crêpe Parisienne).

Analiza la siguiente reseña y clasifícala.

Reseña (estrellas: ${stars}): "${text}"

Tareas:
1. Clasifica si es una queja real sobre: servicio, calidad de producto, o valor/precio.
   Si no es una queja (es neutra o elogiosa), márcalo como false en cada categoría.
2. Identifica si se menciona a algún EMPLEADO del restaurante por nombre.
   Un empleado es alguien que atendió, sirvió, cobró, preparó el pedido o trabaja ahí.
   NO cuentes como empleado a: acompañantes del cliente, familiares, amigos,
   ni nombres mencionados sin contexto de haber prestado servicio.
   Evalúa el contexto: "me atendió Valentina" = empleado.
   "fui con mi amiga Vale" = NO es empleado.
   Si tienes duda razonable, márcalo como no-empleado (favorece precisión sobre cobertura).
3. Escribe un resumen_tema de máximo 8 palabras.

Responde con este formato exacto:
{
  "es_queja": boolean,
  "categoria_queja": {
    "servicio": boolean,
    "calidad": boolean,
    "valor": boolean
  },
  "empleados_mencionados": [
    { "nombre": "string", "confianza": "alta" | "media", "evidencia": "fragmento del texto que justifica la clasificación" }
  ],
  "resumen_tema": "string breve, máx 8 palabras"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            es_queja: { type: 'BOOLEAN' },
            categoria_queja: {
              type: 'OBJECT',
              properties: {
                servicio: { type: 'BOOLEAN' },
                calidad: { type: 'BOOLEAN' },
                valor: { type: 'BOOLEAN' }
              },
              required: ['servicio', 'calidad', 'valor']
            },
            empleados_mencionados: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  nombre: { type: 'STRING' },
                  confianza: { type: 'STRING', enum: ['alta', 'media'] },
                  evidencia: { type: 'STRING' }
                },
                required: ['nombre', 'confianza', 'evidencia']
              }
            },
            resumen_tema: { type: 'STRING' }
          },
          required: ['es_queja', 'categoria_queja', 'empleados_mencionados', 'resumen_tema']
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en API de Gemini: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error("Respuesta vacía o incorrecta de Gemini API.");
  }

  return JSON.parse(textResponse);
}

// Function to classify a single review and save it to Supabase
async function classifyAndSave(supabase, reviewId, text, stars) {
  let attempts = 2;
  let classification = null;
  let status = 'failed';

  if (!text || text.trim() === '') {
    // Si no hay texto, clasificar como sin queja ni empleados
    classification = {
      es_queja: false,
      categoria_queja: { servicio: false, calidad: false, valor: false },
      empleados_mencionados: [],
      resumen_tema: "Sin texto"
    };
    status = 'done';
  } else {
    while (attempts > 0) {
      try {
        classification = await callGeminiClassifier(text, stars);
        // Validar campos requeridos en el objeto retornado
        if (
          typeof classification.es_queja === 'boolean' &&
          classification.categoria_queja &&
          typeof classification.categoria_queja.servicio === 'boolean' &&
          typeof classification.categoria_queja.calidad === 'boolean' &&
          typeof classification.categoria_queja.valor === 'boolean' &&
          Array.isArray(classification.empleados_mencionados) &&
          typeof classification.resumen_tema === 'string'
        ) {
          status = 'done';
          break;
        } else {
          throw new Error("Estructura JSON inválida");
        }
      } catch (err) {
        console.warn(`Intento fallido de clasificación para la reseña ${reviewId}:`, err.message);
        attempts--;
        if (attempts === 0) {
          status = 'failed';
          classification = {
            es_queja: false,
            categoria_queja: { servicio: false, calidad: false, valor: false },
            empleados_mencionados: [],
            resumen_tema: "Error clasificación"
          };
        }
      }
    }
  }

  // Guardar en Supabase
  const { error } = await supabase
    .from('reviews')
    .update({
      classification: classification,
      classification_status: status
    })
    .eq('id', reviewId);

  if (error) {
    console.error(`Error guardando clasificación en Supabase para ${reviewId}:`, error.message);
  }

  return { classification, status };
}

exports.handler = async (event, context) => {
  // Authorization: Bearer DIAG_SECRET o APIFY_WEBHOOK_SECRET
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  const secret = process.env.DIAG_SECRET || process.env.APIFY_WEBHOOK_SECRET;

  if (!secret) {
    return { statusCode: 500, body: JSON.stringify({ error: "Falta configurar token secreto de autorización." }) };
  }
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed. Usa POST.' }) };
  }

  try {
    const { reviewId, text, stars } = JSON.parse(event.body || '{}');
    if (!reviewId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Falta reviewId' }) };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const result = await classifyAndSave(supabase, reviewId, text, stars);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, ...result })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// Exportar funciones para uso directo en otros Netlify Functions sin llamadas HTTP
module.exports = {
  callGeminiClassifier,
  classifyAndSave
};
