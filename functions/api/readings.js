export async function onRequest(context) {
  const url = new URL(context.request.url);
  const storeId = url.searchParams.get('storeId');

  const apiKey = context.env.SMARTPAY_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(
      `https://smartpay.propskynet.com/api/external/store/${storeId}/readings`,
      { headers: { 'X-API-Key': apiKey } }
    );

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch readings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
