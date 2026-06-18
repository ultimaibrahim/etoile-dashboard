/**
 * setup-apify.js
 * Script para configurar automáticamente la tarea, webhook y schedule de Apify
 * para la extracción periódica de reseñas de Google Maps de La Crêpe Parisienne.
 *
 * Ejecución:
 *   node setup-apify.js
 * O pasando variables directamente:
 *   APIFY_TOKEN=tu_token NETLIFY_URL=https://tu-sitio.netlify.app APIFY_WEBHOOK_SECRET=secreto node setup-apify.js
 */

const readline = require('readline');

const SUCURSALES_QUERIES = [
  "La Crêpe Parisienne Andares, Guadalajara",
  "La Crêpe Parisienne Plaza Patria, Guadalajara",
  "La Crêpe Parisienne Midtown Jalisco, Guadalajara",
  "La Crêpe Parisienne Galerías Guadalajara",
  "La Crêpe Parisienne Via Viva, Guadalajara",
  "La Crêpe Parisienne Galerías Santa Anita, Tlajomulco",
  "La Crêpe Parisienne La Perla, Zapopan",
  "La Crêpe Parisienne Forum Tlaquepaque",
  "La Crêpe Parisienne Aztlán, CDMX",
  "La Crêpe Parisienne Plaza Carso, CDMX",
  "La Crêpe Parisienne Parque La Mexicana, CDMX",
  "La Crêpe Parisienne Paseo Acoxpa, CDMX",
  "La Crêpe Parisienne Tepeyac, CDMX",
  "La Crêpe Parisienne Polanquito, CDMX",
  "La Crêpe Parisienne Oceanía, CDMX",
  "La Crêpe Parisienne Artz Pedregal, CDMX",
  "La Crêpe Parisienne Arcos Bosques, CDMX",
  "La Crêpe Parisienne Mitikah, CDMX",
  "La Crêpe Parisienne Oasis Coyoacán, CDMX",
  "La Crêpe Parisienne Parque Duraznos, CDMX",
  "La Crêpe Parisienne Centro Santa Fe, CDMX",
  "La Crêpe Parisienne Plaza Satélite, Naucalpan",
  "La Crêpe Parisienne Galerías Monterrey",
  "La Crêpe Parisienne Galerías Valle Oriente, Monterrey",
  "La Crêpe Parisienne Fashion Drive, Monterrey",
  "La Crêpe Parisienne Altacia, León",
  "La Crêpe Parisienne The Park, San Luis Potosí",
  "La Crêpe Parisienne Altaria, Aguascalientes",
  "La Crêpe Parisienne Galerías Metepec",
  "La Crêpe Parisienne Town Square Metepec",
  "La Crêpe Parisienne Antea, Querétaro",
  "La Crêpe Parisienne Marina Puerto Cancún",
  "La Crêpe Parisienne Plaza Península, Tijuana"
];

// Helper para leer parámetros (Entorno, CLI, o interactivo)
function getParamFromEnvOrArg(envName, argName) {
  if (process.env[envName]) return process.env[envName];
  const idx = process.argv.indexOf(argName);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function run() {
  console.log("=====================================================");
  console.log("    Apify Automation Setup - La Crêpe Parisienne     ");
  console.log("=====================================================\n");

  let apifyToken = getParamFromEnvOrArg('APIFY_TOKEN', '--token');
  let netlifyUrl = getParamFromEnvOrArg('NETLIFY_URL', '--url');
  let webhookSecret = getParamFromEnvOrArg('APIFY_WEBHOOK_SECRET', '--secret');

  // Prompts interactivos si faltan datos
  if (!apifyToken) {
    apifyToken = await askQuestion("Introduce tu Apify API Token: ");
  }
  if (!netlifyUrl) {
    netlifyUrl = await askQuestion("Introduce el URL base de tu Netlify (ej: https://site.netlify.app): ");
  }
  if (!webhookSecret) {
    webhookSecret = await askQuestion("Introduce tu APIFY_WEBHOOK_SECRET (ej: LcpWebhook2026!): ");
  }

  if (!apifyToken || !netlifyUrl || !webhookSecret) {
    console.error("\n❌ Error: Faltan parámetros requeridos para la configuración.");
    process.exit(1);
  }

  // Normalizar el URL de netlify para apuntar a la función serverless
  let functionUrl = netlifyUrl;
  if (!functionUrl.endsWith('/.netlify/functions/apify-ingest')) {
    if (functionUrl.endsWith('/')) {
      functionUrl += '.netlify/functions/apify-ingest';
    } else {
      functionUrl += '/.netlify/functions/apify-ingest';
    }
  }

  const baseHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apifyToken}`
  };

  try {
    // 1. Detectar el Actor id (apify~google-maps-scraper o compass~crawler-google-places)
    console.log("\n1️⃣ Verificando disponibilidad de actores de Google Maps en tu cuenta...");
    let actorId = "apify~google-maps-scraper";
    let testRes = await fetch(`https://api.apify.com/v2/actors/${actorId}`, { headers: baseHeaders });
    
    if (!testRes.ok) {
      console.log(`⚠️  Actor '${actorId}' no respondio (Status: ${testRes.status}). Intentando fallback con 'compass~crawler-google-places'...`);
      actorId = "compass~crawler-google-places";
      testRes = await fetch(`https://api.apify.com/v2/actors/${actorId}`, { headers: baseHeaders });
      if (!testRes.ok) {
        console.error("❌ No se pudo validar ningún actor compatible en Apify. Usando 'apify~google-maps-scraper' por defecto.");
        actorId = "apify~google-maps-scraper";
      }
    }
    console.log(`✅ Usando Actor: ${actorId}`);

    // 2. Crear o actualizar la Tarea de Apify (Task)
    console.log("\n2️⃣ Creando o actualizando la Tarea (Task) en Apify...");
    const taskName = "google-maps-scraper-lcp";
    
    // Configuración de entrada óptima para reviews
    const taskInput = {
      searchStringsArray: SUCURSALES_QUERIES,
      maxCrawledPlacesPerSearch: 1, // Queremos exactamente el primer match de la sucursal
      maxCrawledPlaces: 33,
      scrapeReviews: true,
      maxReviews: 50, // Límite razonable por lote mensual/quincenal
      maxReviewsPerPlace: 50,
      reviewsSort: "newest",
      language: "es"
    };

    // Listar tareas existentes para ver si ya existe una con el nombre de LCP
    const listTasksRes = await fetch("https://api.apify.com/v2/actor-tasks", { headers: baseHeaders });
    if (!listTasksRes.ok) {
      throw new Error(`Error al listar tareas de Apify: ${listTasksRes.statusText}`);
    }
    const tasksData = await listTasksRes.json();
    const existingTask = tasksData.data.items.find(t => t.name === taskName);

    let taskId;
    if (existingTask) {
      taskId = existingTask.id;
      console.log(`🔄 Tarea existente encontrada (ID: ${taskId}). Actualizando su configuración...`);
      const updateRes = await fetch(`https://api.apify.com/v2/actor-tasks/${taskId}`, {
        method: 'PUT',
        headers: baseHeaders,
        body: JSON.stringify({
          name: taskName,
          actId: actorId,
          input: taskInput
        })
      });
      if (!updateRes.ok) {
        throw new Error(`Error al actualizar la tarea: ${updateRes.statusText}`);
      }
      console.log("✅ Tarea actualizada con éxito.");
    } else {
      console.log("✨ Creando nueva tarea en Apify...");
      const createRes = await fetch("https://api.apify.com/v2/actor-tasks", {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({
          name: taskName,
          actId: actorId,
          input: taskInput
        })
      });
      if (!createRes.ok) {
        const errObj = await createRes.json().catch(() => ({}));
        throw new Error(`Error al crear la tarea: ${errObj.error?.message || createRes.statusText}`);
      }
      const newCreatedTask = await createRes.json();
      taskId = newCreatedTask.data.id;
      console.log(`✅ Tarea creada con éxito (ID: ${taskId}).`);
    }

    // 3. Crear o actualizar el Webhook
    console.log("\n3️⃣ Configurando el Webhook de integración...");
    
    // Obtener webhooks existentes
    const listWebhooksRes = await fetch("https://api.apify.com/v2/webhooks", { headers: baseHeaders });
    if (!listWebhooksRes.ok) {
      throw new Error(`Error al listar webhooks: ${listWebhooksRes.statusText}`);
    }
    const webhooksData = await listWebhooksRes.json();
    
    // Buscar si ya existe un webhook asociado a esta tarea y URL
    const existingWebhook = webhooksData.data.items.find(w => 
      w.requestUrl === functionUrl && 
      w.condition && 
      w.condition.actorTaskId === taskId
    );

    const webhookBody = {
      requestUrl: functionUrl,
      eventTypes: ["ACTOR.RUN.SUCCEEDED"],
      condition: {
        actorTaskId: taskId
      },
      headersTemplate: JSON.stringify({
        "Authorization": `Bearer ${webhookSecret}`
      }),
      isAdHoc: false
    };

    if (existingWebhook) {
      const webhookId = existingWebhook.id;
      console.log(`🔄 Webhook existente encontrado (ID: ${webhookId}). Actualizando headers y dirección...`);
      const updateWebhookRes = await fetch(`https://api.apify.com/v2/webhooks/${webhookId}`, {
        method: 'PUT',
        headers: baseHeaders,
        body: JSON.stringify(webhookBody)
      });
      if (!updateWebhookRes.ok) {
        throw new Error(`Error al actualizar el webhook: ${updateWebhookRes.statusText}`);
      }
      console.log("✅ Webhook actualizado con éxito.");
    } else {
      console.log("✨ Creando nuevo webhook para conectar Apify con Netlify...");
      const createWebhookRes = await fetch("https://api.apify.com/v2/webhooks", {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(webhookBody)
      });
      if (!createWebhookRes.ok) {
        throw new Error(`Error al crear el webhook: ${createWebhookRes.statusText}`);
      }
      console.log("✅ Webhook creado con éxito.");
    }

    // 4. Crear o actualizar el Schedule (Cron los dias 1 y 15 de cada mes)
    console.log("\n4️⃣ Configurando la programación automática (Schedule)...");
    const scheduleName = "reviews-lcp-gdl-schedule";
    
    // Buscar schedules existentes
    const listSchedulesRes = await fetch("https://api.apify.com/v2/schedules", { headers: baseHeaders });
    if (!listSchedulesRes.ok) {
      throw new Error(`Error al listar schedules: ${listSchedulesRes.statusText}`);
    }
    const schedulesData = await listSchedulesRes.json();
    const existingSchedule = schedulesData.data.items.find(s => s.name === scheduleName);

    const scheduleBody = {
      name: scheduleName,
      cronExpression: "0 0 1,15 * *", // 00:00 los días 1 y 15 del mes
      timezone: "America/Mexico_City",
      isEnabled: true,
      actions: [
        {
          type: "RUN_ACTOR_TASK",
          actorTaskId: taskId
        }
      ]
    };

    if (existingSchedule) {
      const scheduleId = existingSchedule.id;
      console.log(`🔄 Programación existente encontrada (ID: ${scheduleId}). Actualizando...`);
      const updateScheduleRes = await fetch(`https://api.apify.com/v2/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: baseHeaders,
        body: JSON.stringify(scheduleBody)
      });
      if (!updateScheduleRes.ok) {
        throw new Error(`Error al actualizar schedule: ${updateScheduleRes.statusText}`);
      }
      console.log("✅ Programación actualizada con éxito.");
    } else {
      console.log("✨ Creando nueva programación mensual en Apify...");
      const createScheduleRes = await fetch("https://api.apify.com/v2/schedules", {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(scheduleBody)
      });
      if (!createScheduleRes.ok) {
        throw new Error(`Error al crear schedule: ${createScheduleRes.statusText}`);
      }
      console.log("✅ Programación creada con éxito.");
    }

    console.log("\n=====================================================");
    console.log(" 🎉  ¡Automatización configurada con éxito en Apify!  ");
    console.log("=====================================================");
    console.log(`🔗 Endpoint de Netlify: ${functionUrl}`);
    console.log("📅 Siguiente scrapeo: Días 1 y 15 de cada mes a las 00:00 (CDMX)\n");

  } catch (error) {
    console.error(`\n❌ Ocurrió un error inesperado durante el setup:`, error.message);
  }
}

run();
