import { StoreReadingsResponse } from '../types';

const SMARTPAY_API_KEY = import.meta.env.VITE_SMARTPAY_API_KEY || '';

export async function fetchStoreReadings(storeId: number): Promise<StoreReadingsResponse> {
  const response = await fetch(`/api/smartpay/external/store/${storeId}/readings`, {
    headers: {
      'X-API-Key': SMARTPAY_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
