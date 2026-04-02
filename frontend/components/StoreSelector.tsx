import { useState, useEffect, useRef } from 'react';
import { fetchStores, type StoreOption } from '../services/api';
import { getStoresWithCache, refreshStores } from '../services/storeCache';

interface StoreSelectorProps {
  selectedStoreId: number | null;
  onStoreChange: (storeId: number | null) => void;
}

export function StoreSelector({ selectedStoreId, onStoreChange }: StoreSelectorProps) {
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 載入場地列表
  useEffect(() => {
    loadStores();
  }, []);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadStores = async () => {
    setIsLoading(true);
    try {
      const data = await getStoresWithCache(fetchStores);
      setStores(data);
    } catch (err) {
      console.error('載入場地失敗:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      const data = await refreshStores(fetchStores);
      setStores(data);
    } catch (err) {
      console.error('刷新場地失敗:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 取得選中的場地名稱
  const selectedStore = stores.find(s => s.id === selectedStoreId);
  const displayName = selectedStore ? selectedStore.name : '全部場地';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 選單按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
      >
        <span className="text-lg">📍</span>
        <span className="text-white font-medium truncate max-w-[150px]">
          {displayName}
        </span>
        <span className={`text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
        {/* 刷新按鈕 */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`p-1 hover:bg-white/10 rounded ${isLoading ? 'animate-spin' : ''}`}
          title="重新整理場地"
        >
          <span className="text-2xl leading-none">🔄</span>
        </button>
      </button>

      {/* 下拉選單 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-surface-dark border border-white/10 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* 全部場地選項 */}
          <button
            onClick={() => {
              onStoreChange(null);
              setIsOpen(false);
            }}
            className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-2 ${
              selectedStoreId === null ? 'bg-primary/20 text-primary' : 'text-white'
            }`}
          >
            <span>🌐</span>
            <span className="font-medium">全部場地</span>
          </button>

          <div className="border-t border-white/10" />

          {/* 場地列表 */}
          {stores.map(store => (
            <button
              key={store.id}
              onClick={() => {
                onStoreChange(store.id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-2 ${
                selectedStoreId === store.id ? 'bg-primary/20 text-primary' : 'text-white'
              }`}
            >
              <span>📍</span>
              <span className="truncate">{store.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
