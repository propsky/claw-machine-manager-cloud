export async function onRequestPost(context) {
  const token = context.request.headers.get('Authorization') || '';
  const { machineId } = context.params;
  const url = new URL(context.request.url);
  const epays = url.searchParams.get('epays') || '';

  try {
    const query = epays ? `?epays=${epays}` : '';
    const response = await fetch(
      `https://smartpay.propskynet.com/api/claw-machines/${machineId}/start${query}`,
      {
        method: 'POST',
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      }
    );

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to start machine' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
