export async function onRequest(context) {
  const token = context.request.headers.get('Authorization') || '';

  try {
    const response = await fetch(
      'https://smartpay.propskynet.com/api/store-app/activity',
      { headers: { 'Authorization': token } }
    );

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch activity' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
