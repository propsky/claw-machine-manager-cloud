export async function onRequestPost(context) {
  const token = context.request.headers.get('Authorization') || '';
  const { machineId } = context.params;

  try {
    const response = await fetch(
      `https://smartpay.propskynet.com/api/claw-machines/${machineId}/restart`,
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
    return new Response(JSON.stringify({ error: 'Failed to restart machine' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
