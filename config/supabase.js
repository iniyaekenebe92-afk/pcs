const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getClient() {
  if (!_client) {
    if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL is not set');
    if (!process.env.SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_KEY is not set');
    _client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return _client;
}

module.exports = new Proxy({}, {
  get(_, prop) {
    return getClient()[prop];
  }
});
