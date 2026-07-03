/**
 * netlify/functions/get-config.js
 * Returns the public configuration for Supabase from environment variables.
 */
exports.handler = async (event, context) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Faltan SUPABASE_URL o SUPABASE_ANON_KEY en variables de entorno.' })
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    body: JSON.stringify({ supabaseUrl, supabaseAnonKey })
  };
};
