export async function onRequest(context) {
  const token = context.request.headers.get('Authorization') || '';
  const url = new URL(context.request.url);
  const queryString = url.searchParams.toString();

  try {
    const response = await fetch(
      `https://smartpay.propskynet.com/api/withdrawal/my-requests${queryString ? '?' + queryString : ''}`,
      { headers: { 'Authorization': token } }
    );

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch withdrawal requests' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
