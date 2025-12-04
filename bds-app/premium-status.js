export default {
  async fetch(request, env) {
    // Allow CORS for your domain
    const headers = {
      "Access-Control-Allow-Origin": "https://aiphotostudio.co.uk",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // Get email query parameter
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        headers,
        status: 400,
      });
    }

    // Lookup in Cloudflare KV storage
    const record = await env.PREMIUM.get(email);

    // If no record → free user
    if (!record) {
      return new Response(
        JSON.stringify({
          email,
          premium: false,
          plan: null,
          expires: null,
          status: "free",
        }),
        { headers }
      );
    }

    const data = JSON.parse(record);

    // Return the premium status
    return new Response(JSON.stringify(data), { headers });
  },
};
