export async function onRequest(context) {
  const url = new URL(context.request.url);
  const startDate = url.searchParams.get('start_date') || '';
  const endDate = url.searchParams.get('end_date') || '';
  const page = url.searchParams.get('page') || '';
  const pageSize = url.searchParams.get('page_size') || '';
  const token = context.request.headers.get('Authorization') || '';

  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  if (page) params.set('page', page);
  if (pageSize) params.set('page_size', pageSize);

  try {
    const response = await fetch(
      `https://smartpay.propskynet.com/api/store-app/payments?${params.toString()}`,
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
