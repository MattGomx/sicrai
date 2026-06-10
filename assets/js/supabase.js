const SUPABASE_URL = "https://wojftcqshaumsdqrhqkj.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvamZ0Y3FzaGF1bXNkcXJocWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MjkzMzYsImV4cCI6MjA5NjUwNTMzNn0.s88OJT_V32AoopQq2utfUpqnQcQPtDSmiwD8EdiCbNw";

const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

window.client = client;

console.log("Cliente criado:", client);
console.log("Auth:", client.auth);