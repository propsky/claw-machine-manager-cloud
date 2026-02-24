export async function onRequest(context) {
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || '';
  const token = context.request.headers.get('Authorization') || '';

  try {
    const response = await fetch(
      `https://smartpay.propskynet.com/api/store-app/readings?date=${date}`,
      { headers: { 'Authorization': token } }
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
