export async function onRequest(context) {
  const token = context.request.headers.get('Authorization') || '';
  const { id } = context.params;

  try {
    const response = await fetch(`https://smartpay.propskynet.com/api/favorite-bank-accounts/${id}/set-default`, {
      method: 'PATCH',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to set default bank account' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
