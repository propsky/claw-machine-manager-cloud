export async function onRequest(context) {
  const token = context.request.headers.get('Authorization') || '';

  try {
    const options = {
      method: context.request.method,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch('https://smartpay.propskynet.com/api/stores/options', options);
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch store options' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
