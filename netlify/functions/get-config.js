/**
 * netlify/functions/get-config.js
 * Returns the public configuration for Supabase from environment variables.
 */
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    body: JSON.stringify({
      supabaseUrl: process.env.SUPABASE_URL || 'https://lbnqpcrhyebtbblpvazp.supabase.co',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'sb_publishable_WXCdzeTmvrF2IGJfogAMGw_FBP-mr8Y'
    })
  };
};
