/**
 * 機台類型靜態對映設定檔
 *
 * 用途：後端尚未支援 machine_type 欄位前，由此檔案手動指定 device_id → 機台類型。
 * 後端正式支援後，此檔案的對映會成為「覆寫層」（config 優先 > API > 預設）。
 *
 * 使用方式：
 *   直接在 MACHINE_TYPE_MAP 中新增或修改條目：
 *   'cpu_id 字串': 'machine_type_code'
 *
 * 機台類型代碼：
 *   claw    = 娃娃機 🧸
 *   gacha   = 扭蛋機 🥚（有庫存）
 *   whack   = 打地鼠 🐹
 *   rocking = 搖馬機 🐴
 *   vending = 販賣機 🥤（有庫存）
 */

// ─────────────────────────────────────────────
// 類型定義
// ─────────────────────────────────────────────

export type MachineType = 'claw' | 'gacha' | 'whack' | 'rocking' | 'vending' | 'pinball';

export interface MachineTypeInfo {
  type: MachineType;
  name: string;
  icon: string;
  /** 是否有庫存欄位（gacha / vending） */
  hasInventory: boolean;
  /** 單次投幣金額（null = 不固定，如販賣機） */
  coinPrice: number | null;
}

// ─────────────────────────────────────────────
// 機台類型基本資訊（全域不變，不需修改）
// ─────────────────────────────────────────────

export const MACHINE_TYPE_INFO: Record<MachineType, MachineTypeInfo> = {
  claw:    { type: 'claw',    name: '娃娃機', icon: '🧸', hasInventory: false, coinPrice: 30 },
  gacha:   { type: 'gacha',   name: '扭蛋機', icon: '🥚', hasInventory: true,  coinPrice: 30 },
  whack:   { type: 'whack',   name: '打地鼠', icon: '🐹', hasInventory: false, coinPrice: 10 },
  rocking: { type: 'rocking', name: '搖馬機', icon: '🐴', hasInventory: false, coinPrice: 10 },
  vending: { type: 'vending', name: '販賣機', icon: '🥤', hasInventory: true,  coinPrice: null },
  pinball: { type: 'pinball', name: '彈珠檯', icon: '🎱', hasInventory: false, coinPrice: 10  },
};

// ─────────────────────────────────────────────
// ✏️  在這裡填入你的機台 device_id 對映
//
// 格式：
//   'cpu_id': 'machine_type',
//
// 範例：
//   'AA:BB:CC:DD:EE:01': 'gacha',
//   'AA:BB:CC:DD:EE:02': 'vending',
// ─────────────────────────────────────────────

export const MACHINE_TYPE_MAP: Record<string, MachineType> = {
  '781C3CEB8B9C': 'whack',    // 地鼠機
  '6CC8403B0A8C': 'rocking',  // 搖馬機
  '6CC8403BCEBC': 'gacha',    // 機率扭蛋機
  '6CC8403B24E8': 'pinball',  // 彈珠檯
};

// ─────────────────────────────────────────────
// 公用函數（直接在元件中呼叫）
// ─────────────────────────────────────────────

/** 未在 MACHINE_TYPE_MAP 中設定的機台，預設為娃娃機 */
export const DEFAULT_MACHINE_TYPE: MachineType = 'claw';

/**
 * 取得機台類型代碼
 * @param cpuId cpu_id 或 happy_cpu_id
 * @param apiType 後端回傳的 machine_type（可選，config 優先）
 */
export function getMachineType(cpuId: string, apiType?: string): MachineType {
  if (MACHINE_TYPE_MAP[cpuId]) return MACHINE_TYPE_MAP[cpuId];
  if (apiType && apiType in MACHINE_TYPE_INFO) return apiType as MachineType;
  return DEFAULT_MACHINE_TYPE;
}

/**
 * 取得機台類型完整資訊
 * @param cpuId cpu_id 或 happy_cpu_id
 * @param apiType 後端回傳的 machine_type（可選）
 */
export function getMachineTypeInfo(cpuId: string, apiType?: string): MachineTypeInfo {
  return MACHINE_TYPE_INFO[getMachineType(cpuId, apiType)];
}

/**
 * 此機台是否有庫存欄位（gacha / vending）
 */
export function hasInventory(cpuId: string, apiType?: string): boolean {
  return getMachineTypeInfo(cpuId, apiType).hasInventory;
}
