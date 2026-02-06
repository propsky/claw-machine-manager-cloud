export default async function handler(req, res) {
  const { storeId } = req.query;

  const apiKey = process.env.SMARTPAY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(
      `https://smartpay.propskynet.com/api/external/store/${storeId}/readings`,
      {
        headers: { 'X-API-Key': apiKey },
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
}
