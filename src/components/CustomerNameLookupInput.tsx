import React, { useState, useRef, useEffect } from 'react';
import { History, User, Smartphone, CreditCard, Zap, Wifi, Gamepad2, Receipt } from 'lucide-react';
import { CustomerDirectoryEntry } from '../utils/customerLookup';

interface CustomerNameLookupInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelectSuggestion: (entry: CustomerDirectoryEntry) => void;
  suggestions: CustomerDirectoryEntry[];
  placeholder?: string;
  inputClassName?: string;
  alignDropdown?: 'left' | 'right';
}

const getKindBadgeStyle = (kind: CustomerDirectoryEntry['kind']) => {
  switch (kind) {
    case 'ewallet':
      return {
        bg: 'bg-teal-50 text-teal-800 border-teal-200',
        Icon: Smartphone,
      };
    case 'bank':
    case 'mbanking':
    case 'card':
      return {
        bg: 'bg-amber-50 text-amber-900 border-amber-200',
        Icon: CreditCard,
      };
    case 'ppob_pln':
    case 'ppob_pln_bulanan':
      return {
        bg: 'bg-amber-50 text-amber-900 border-amber-200',
        Icon: Receipt,
      };
    case 'ppob_wifi':
      return {
        bg: 'bg-sky-50 text-sky-900 border-sky-200',
        Icon: Wifi,
      };
    case 'ppob_game':
      return {
        bg: 'bg-violet-50 text-violet-900 border-violet-200',
        Icon: Gamepad2,
      };
    case 'ppob_hp':
    case 'ppob_tagihan':
      return {
        bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        Icon: Zap,
      };
    default:
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        Icon: User,
      };
  }
};

export const CustomerNameLookupInput: React.FC<CustomerNameLookupInputProps> = ({
  value,
  onChange,
  onSelectSuggestion,
  suggestions,
  placeholder = 'Ketik nama pelanggan...',
  inputClassName = 'w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none',
  alignDropdown = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHighlightedIdx(0);
  }, [value, suggestions.length]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelect = (entry: CustomerDirectoryEntry) => {
    onSelectSuggestion(entry);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && isOpen && value.trim().length > 0 && suggestions[highlightedIdx]) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIdx]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClassName}
      />

      {isOpen && suggestions.length > 0 && (
        <div
          className={`absolute top-full mt-1 z-40 w-full min-w-[260px] sm:min-w-[310px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden ${
            alignDropdown === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2 text-[10.5px] font-bold text-slate-600">
            <span className="flex items-center gap-1">
              <History className="w-3 h-3 text-teal-600 shrink-0" />
              <span>Riwayat Pelanggan ({suggestions.length})</span>
            </span>
            <span className="text-[10px] font-normal text-slate-400">Ketuk untuk isi nomor</span>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {suggestions.map((entry, idx) => {
              const { bg, Icon } = getKindBadgeStyle(entry.kind);
              const isHighlighted = idx === highlightedIdx;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(entry);
                  }}
                  className={`w-full text-left px-2.5 py-2 transition cursor-pointer flex items-center justify-between gap-2 ${
                    isHighlighted ? 'bg-teal-50/90' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-900 truncate">
                        {entry.customerName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 text-[9.5px] font-bold rounded border whitespace-nowrap ${bg}`}
                      >
                        <Icon className="w-2.5 h-2.5 shrink-0" />
                        <span>{entry.channelTag}</span>
                      </span>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-teal-800 truncate mt-0.5 tabular-nums">
                      {entry.displayTarget}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded shrink-0">
                    Isi
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
