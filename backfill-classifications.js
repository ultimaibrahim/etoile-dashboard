const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { classifyAndSave } = require('./netlify/functions/classify-review');

// Manual parsing of .env file
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine.startsWith('#') || !cleanLine) return;
  const index = cleanLine.indexOf('=');
  if (index !== -1) {
    const key = cleanLine.substring(0, index).trim();
    const val = cleanLine.substring(index + 1).trim();
    env[key] = val;
  }
});

// Inject loaded variables into process.env for classify-review to find GEMINI_API_KEY
Object.assign(process.env, env);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || !process.env.GEMINI_API_KEY) {
  console.error("❌ Faltan configurar variables en tu archivo .env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o GEMINI_API_KEY).");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Small delay helper to avoid hitting Gemini rate limits
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBackfill() {
  console.log("🔍 Buscando reseñas pendientes de clasificación en Supabase...");

  let reviews = [];
  let from = 0;
  let to = 999;
  let keepFetching = true;

  while (keepFetching) {
    console.log(`   Obteniendo lote de rango ${from} a ${to}...`);
    const { data, error } = await supabase
      .from('reviews')
      .select('id, text, stars')
      .or('classification.is.null,classification_status.eq.pending')
      .range(from, to);

    if (error) {
      console.error("❌ Error al obtener reseñas de Supabase:", error.message);
      process.exit(1);
    }

    reviews = reviews.concat(data);
    if (data.length < 1000) {
      keepFetching = false;
    } else {
      from += 1000;
      to += 1000;
    }
  }

  // Filtrar las que tienen texto real
  const reviewsToClassify = reviews.filter(r => r.text && r.text.trim().length > 0);
  const emptyReviews = reviews.filter(r => !r.text || r.text.trim().length === 0);

  console.log(`📊 Encontradas ${reviews.length} reseñas sin clasificar.`);
  console.log(`   - ${reviewsToClassify.length} con texto (requieren Gemini)`);
  console.log(`   - ${emptyReviews.length} sin texto (se clasificarán de forma inmediata y automática)`);

  // 2. Procesar reseñas vacías inmediatamente
  if (emptyReviews.length > 0) {
    console.log("⚡ Procesando reseñas sin texto...");
    for (const r of emptyReviews) {
      await classifyAndSave(supabase, r.id, r.text, r.stars);
    }
    console.log("✅ Reseñas sin texto clasificadas.");
  }

  // 3. Procesar reseñas con texto usando Gemini
  if (reviewsToClassify.length > 0) {
    console.log(`🚀 Iniciando clasificación con Gemini para ${reviewsToClassify.length} reseñas...`);
    let count = 0;
    
    for (const r of reviewsToClassify) {
      count++;
      console.log(`[${count}/${reviewsToClassify.length}] Clasificando reseña ID: ${r.id} (${r.stars}★) - "${r.text.substring(0, 40)}..."`);
      
      try {
        const result = await classifyAndSave(supabase, r.id, r.text, r.stars);
        console.log(`   └─ Resultado: ${result.status.toUpperCase()} (${result.classification.resumen_tema})`);
      } catch (err) {
        console.error(`   ❌ Error en reseña ${r.id}:`, err.message);
      }
      
      // Delay de 1 segundo entre llamadas para no saturar la cuota gratuita (15 RPM en Gemini 1.5 Flash tier gratuito)
      await sleep(1200);
    }
  }

  console.log("🎉 ¡Proceso de backfill completado con éxito!");
}

runBackfill();
