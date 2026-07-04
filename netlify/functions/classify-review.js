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

// Local NLP Heuristic Classifier for zero-API/fast fallback
function classifyLocally(text, stars) {
  const cleanText = (text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isLowRating = stars <= 3;
  
  // 1. Keywords definitions (MANTENER SINCRONIZADO con COMPLAINT_KEYWORDS en js/config.js)
  const serviceKeywords = ["servicio", "atencion", "mesero", "meser", "cajero", "cajer", "tarde", "tard", "espera", "esper", "demora", "demor", "trato", "grosero", "groser", "actitud", "limpieza", "limp", "sucio", "fila", "caja", "personal", "mal servicio", "lento", "tade", "tardaron", "amabilidad"];
  const qualityKeywords = ["comida", "crepa", "ingrediente", "fria", "frio", "quema", "sabor", "malo", "rancio", "pelo", "mosca", "insipido", "calidad", "cruda", "crudo", "queso", "massa", "masa", "sucio"];
  const valueKeywords = ["caro", "precio", "costo", "porcion", "tamaño", "chico", "diminuto", "estafa", "robo", "carisimo", "abusivo", "cantidad"];

  const hasService = serviceKeywords.some(kw => cleanText.includes(kw));
  const hasQuality = qualityKeywords.some(kw => cleanText.includes(kw));
  const hasValue = valueKeywords.some(kw => cleanText.includes(kw));

  let es_queja = isLowRating && (hasService || hasQuality || hasValue);
  let queja_servicio = isLowRating && hasService;
  let queja_calidad = isLowRating && hasQuality;
  let queja_valor = isLowRating && hasValue;

  if (isLowRating && !es_queja) {
    es_queja = true;
    if (cleanText.includes("crep") || cleanText.includes("comida")) {
      queja_calidad = true;
    } else {
      queja_servicio = true;
    }
  }

  // 2. Name Extraction patterns
  const namePatterns = [
    /atendio\s+([A-Za-zÁ-ÿ]+)/i,
    /atencion\s+de\s+([A-Za-zÁ-ÿ]+)/i,
    /gracias\s+a\s+([A-Za-zÁ-ÿ]+)/i,
    /servicio\s+de\s+([A-Za-zÁ-ÿ]+)/i,
    /cajero\s+([A-Za-zÁ-ÿ]+)/i,
    /mesero\s+([A-Za-zÁ-ÿ]+)/i,
    /atencion\s+por\s+parte\s+de\s+([A-Za-zÁ-ÿ]+)/i,
    /excelente\s+servicio\s+de\s+([A-Za-zÁ-ÿ]+)/i,
    /nos\s+atendio\s+([A-Za-zÁ-ÿ]+)/i
  ];

  const empleados_mencionados = [];
  const seenNames = new Set();
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().charAt(0).toUpperCase() + match[1].trim().slice(1).toLowerCase();
      const stopWords = ["El", "La", "Los", "Un", "Una", "Mi", "Su", "Excelente", "Muy", "Buena", "Buen", "Me", "Nos", "Se", "Por", "Para", "Tu", "Con"];
      if (name.length > 2 && !stopWords.includes(name) && !seenNames.has(name)) {
        seenNames.add(name);
        empleados_mencionados.push({
          nombre: name,
          confianza: "alta",
          evidencia: match[0]
        });
      }
    }
  }

  // 3. Resumen tema
  let resumen_tema = "Opinión positiva";
  if (es_queja) {
    if (queja_servicio && queja_calidad) resumen_tema = "Detalle en servicio y calidad";
    else if (queja_servicio) resumen_tema = "Demora o detalle en servicio";
    else if (queja_calidad) resumen_tema = "Detalle en calidad o sabor";
    else if (queja_valor) resumen_tema = "Detalle en relación valor-precio";
    else resumen_tema = "Detalle en la sucursal";
  } else if (stars === 5) {
    resumen_tema = "Excelente experiencia";
  } else if (stars === 4) {
    resumen_tema = "Buena experiencia";
  }

  return {
    es_queja,
    categoria_queja: {
      servicio: queja_servicio,
      calidad: queja_calidad,
      valor: queja_valor
    },
    empleados_mencionados,
    resumen_tema
  };
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
  } else if (process.env.USE_LOCAL_NLP === 'true' || !process.env.GEMINI_API_KEY) {
    classification = classifyLocally(text, stars);
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
        console.warn(`Intento fallido de clasificación con Gemini para la reseña ${reviewId}:`, err.message);
        attempts--;
        if (attempts === 0) {
          console.warn(`Usando clasificador NLP local como fallback para la reseña ${reviewId}.`);
          classification = classifyLocally(text, stars);
          status = 'done'; // Marcamos como done porque el fallback local lo resolvió
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

// Helper function to call Gemini API for a BATCH of reviews
async function callGeminiBatchClassifier(reviewsList) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta la variable de entorno GEMINI_API_KEY.");
  }

  const prompt = `Eres un clasificador de reseñas de Google Maps para una cadena de creperías (La Crêpe Parisienne).

Analiza la siguiente lista de reseñas y clasifica cada una de ellas por su respectivo "id".

Lista de reseñas a clasificar:
${JSON.stringify(reviewsList)}

Tareas para cada reseña en la lista:
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

Responde con una lista JSON de objetos en este formato:
[
  {
    "id": "string (el mismo id de la reseña)",
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
  }
]`;

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
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'STRING' },
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
            required: ['id', 'es_queja', 'categoria_queja', 'empleados_mencionados', 'resumen_tema']
          }
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

// Function to classify a batch of reviews and save them in Supabase
async function classifyBatchAndSave(supabase, reviewsBatch) {
  if (!reviewsBatch || reviewsBatch.length === 0) return [];

  // Fallback local inmediato si no hay API Key o se fuerza NLP local
  if (process.env.USE_LOCAL_NLP === 'true' || !process.env.GEMINI_API_KEY) {
    const results = [];
    for (const r of reviewsBatch) {
      const classif = classifyLocally(r.text, r.stars);
      const { error } = await supabase
        .from('reviews')
        .update({
          classification: classif,
          classification_status: 'done'
        })
        .eq('id', r.id);
      
      if (error) {
        console.error(`Error guardando lote local en Supabase para ID ${r.id}:`, error.message);
        results.push({ id: r.id, status: 'failed' });
      } else {
        results.push({ id: r.id, status: 'done', classification: classif });
      }
    }
    return results;
  }

  let attempts = 2;
  let classifications = null;

  const inputList = reviewsBatch.map(r => ({ id: r.id, stars: r.stars, text: r.text }));

  while (attempts > 0) {
    try {
      classifications = await callGeminiBatchClassifier(inputList);
      if (Array.isArray(classifications) && classifications.length === reviewsBatch.length) {
        break;
      }
      throw new Error("La cantidad de clasificaciones no coincide con la cantidad de reseñas de entrada.");
    } catch (err) {
      console.warn(`Intento fallido de clasificación por lote:`, err.message);
      attempts--;
      if (attempts === 0) {
        console.warn("Lote fallido permanentemente. Cambiando a clasificación individual...");
        const fallbackResults = [];
        for (const rev of reviewsBatch) {
          const res = await classifyAndSave(supabase, rev.id, rev.text, rev.stars);
          fallbackResults.push({ id: rev.id, ...res });
        }
        return fallbackResults;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Guardar todas en Supabase
  const results = [];
  for (const classif of classifications) {
    const { error } = await supabase
      .from('reviews')
      .update({
        classification: classif,
        classification_status: 'done'
      })
      .eq('id', classif.id);

    if (error) {
      console.error(`Error guardando lote en Supabase para ID ${classif.id}:`, error.message);
      results.push({ id: classif.id, status: 'failed' });
    } else {
      results.push({ id: classif.id, status: 'done', classification: classif });
    }
  }

  return results;
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

module.exports = {
  callGeminiClassifier,
  classifyAndSave,
  callGeminiBatchClassifier,
  classifyBatchAndSave
};

