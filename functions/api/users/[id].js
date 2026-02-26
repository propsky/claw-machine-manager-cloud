export async function onRequest(context) {
  const token = context.request.headers.get('Authorization') || '';
  const { id } = context.params;

  try {
    const body = await context.request.text();
    const response = await fetch(`https://smartpay.propskynet.com/api/users/${id}`, {
      method: context.request.method,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: body || undefined,
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to update user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
