export async function onRequest(context) {
  const token = context.request.headers.get('Authorization') || '';

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await context.request.text();
    const response = await fetch('https://smartpay.propskynet.com/api/withdrawal/apply', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to apply withdrawal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
