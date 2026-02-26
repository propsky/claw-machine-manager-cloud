export async function onRequest(context) {
  const token = context.request.headers.get('Authorization') || '';
  const { id } = context.params;

  try {
    const options = {
      method: context.request.method,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    };

    if (['PUT', 'PATCH'].includes(context.request.method)) {
      options.body = await context.request.text();
    }

    const response = await fetch(`https://smartpay.propskynet.com/api/favorite-bank-accounts/${id}`, options);

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to manage bank account' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
