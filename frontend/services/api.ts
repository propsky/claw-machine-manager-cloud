import { StoreReadingsResponse } from '../types';

const SMARTPAY_API_KEY = import.meta.env.VITE_SMARTPAY_API_KEY || '';
const isDev = import.meta.env.DEV;

export async function fetchStoreReadings(storeId: number): Promise<StoreReadingsResponse> {
  let response: Response;

  if (isDev) {
    // 開發環境：透過 Vite proxy
    response = await fetch(`/api/smartpay/external/store/${storeId}/readings`, {
      headers: { 'X-API-Key': SMARTPAY_API_KEY },
    });
  } else {
    // 生產環境：透過 Vercel Serverless Function
    response = await fetch(`/api/readings?storeId=${storeId}`);
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
