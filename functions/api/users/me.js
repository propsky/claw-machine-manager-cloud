export async function onRequest(context) {
  const token = context.request.headers.get('Authorization') || '';

  try {
    const response = await fetch('https://smartpay.propskynet.com/api/users/me', {
      headers: { 'Authorization': token },
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch user profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
