// 台灣銀行代碼列表 (來源：銀行局全球資訊網)
// 前三個是常用的銀行（台新、玉山、國泰），放在最前面
// 手續費：0 = 免手續費，15 = 15元

export const BANK_CODES = [
  // 常用銀行（前三個）
  { code: '812', name: '台新銀行', fee: 0 },
  { code: '218', name: '玉山銀行', fee: 0 },
  { code: '013', name: '國泰世華', fee: 0 },
  
  // 本國銀行
  { code: '004', name: '臺灣銀行', fee: 15 },
  { code: '005', name: '土地銀行', fee: 15 },
  { code: '006', name: '合作金庫', fee: 15 },
  { code: '007', name: '第一銀行', fee: 15 },
  { code: '008', name: '華南銀行', fee: 15 },
  { code: '009', name: '彰化銀行', fee: 15 },
  { code: '012', name: '台北富邦', fee: 15 },
  { code: '016', name: '高雄銀行', fee: 15 },
  { code: '017', name: '金門縣信合社', fee: 15 },
  { code: '018', name: '農業金庫', fee: 15 },
  { code: '021', name: '花旗銀行', fee: 15 },
  { code: '022', name: '美國銀行', fee: 15 },
  { code: '023', name: '瑞興銀行', fee: 15 },
  { code: '024', name: '渣打銀行', fee: 15 },
  { code: '025', name: '首都銀行', fee: 15 },
  { code: '027', name: '台灣中小企銀', fee: 15 },
  { code: '031', name: '上海銀行', fee: 15 },
  { code: '032', name: '兆豐銀行', fee: 15 },
  { code: '033', name: '瑞士銀行', fee: 15 },
  { code: '038', name: '泰國盤谷銀行', fee: 15 },
  { code: '039', name: '澳盛銀行', fee: 15 },
  { code: '040', name: '中華開發', fee: 15 },
  { code: '041', name: '板信銀行', fee: 15 },
  { code: '045', name: '陽信銀行', fee: 15 },
  { code: '048', name: '台新銀行', fee: 0 }, // 812 的分行代碼
  { code: '049', name: '安泰銀行', fee: 15 },
  { code: '050', name: '聯邦銀行', fee: 15 },
  { code: '052', name: '遠東銀行', fee: 15 },
  { code: '053', name: '元大銀行', fee: 15 },
  { code: '054', name: '永豐銀行', fee: 15 },
  { code: '055', name: '玉山銀行', fee: 0 }, // 218 的分行代碼
  { code: '056', name: '新光銀行', fee: 15 },
  { code: '057', name: '國泰世華', fee: 0 }, // 013 的分行代碼
  { code: '058', name: '萬泰銀行', fee: 15 },
  { code: '059', name: '星辰銀行', fee: 15 },
  { code: '061', name: '日盛銀行', fee: 15 },
  { code: '062', name: '慶豐銀行', fee: 15 },
  
  // 農會 (常用代碼)
  { code: '500', name: '中華郵政', fee: 15 },
  { code: '600', name: '淡水區農會', fee: 15 },
  { code: '700', name: '中央銀行', fee: 15 },
  { code: '800', name: '交通銀行', fee: 15 },
] as const;

export type BankCode = typeof BANK_CODES[number];

// 根據銀行代碼取得銀行名稱
export function getBankName(code: string): string {
  const bank = BANK_CODES.find(b => b.code === code);
  return bank?.name || '';
}

// 根據銀行代碼取得手續費
export function getBankFee(code: string): number {
  const bank = BANK_CODES.find(b => b.code === code);
  return bank?.fee ?? 15;
}

// 取得免手續費的銀行列表
export function getFreeFeeBanks(): readonly { code: string; name: string; fee: number }[] {
  return BANK_CODES.filter(b => b.fee === 0);
}
