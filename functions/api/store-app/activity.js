export async function onRequest(context) {
  const url = new URL(context.request.url);
  const token = context.request.headers.get('Authorization') || '';

  // 取得所有查詢參數並轉發
  const params = new URLSearchParams(url.searchParams);
  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    const response = await fetch(
      `https://smartpay.propskynet.com/api/store-app/activity${query}`,
      { headers: { 'Authorization': token } }
    );

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch activity' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
