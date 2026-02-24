export async function onRequest(context) {
  const url = new URL(context.request.url);
  const startDate = url.searchParams.get('start_date') || '';
  const endDate = url.searchParams.get('end_date') || '';
  const token = context.request.headers.get('Authorization') || '';

  try {
    const response = await fetch(
      `https://smartpay.propskynet.com/api/store-app/payments?start_date=${startDate}&end_date=${endDate}`,
      { headers: { 'Authorization': token } }
    );

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch payments' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
