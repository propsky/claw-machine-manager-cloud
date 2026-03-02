export async function onRequest(context) {
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || '';
  const storeId = url.searchParams.get('store_id') || '';
  const token = context.request.headers.get('Authorization') || '';

  const params = new URLSearchParams({ date });
  if (storeId) params.set('store_id', storeId);

  try {
    const response = await fetch(
      `https://smartpay.propskynet.com/api/store-app/readings?${params.toString()}`,
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
