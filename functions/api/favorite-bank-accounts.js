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

    if (context.request.method === 'POST') {
      options.body = await context.request.text();
    }

    const response = await fetch('https://smartpay.propskynet.com/api/favorite-bank-accounts', options);

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to manage bank accounts' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
