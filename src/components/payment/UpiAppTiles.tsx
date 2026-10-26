import React from 'react';
import { Check } from 'lucide-react';
import { UpiAppProvider } from '../../data/paymentConfig';
import { UpiAppIcon } from './UpiAppIcon';

export interface UpiTileOption {
  id: UpiAppProvider;
  name: string;
  badgeText?: string;
}

interface UpiAppTilesProps {
  selectedApp: UpiAppProvider | null;
  onSelectApp: (app: UpiAppProvider) => void;
  disabled?: boolean;
}

export const UpiAppTiles: React.FC<UpiAppTilesProps> = ({
  selectedApp,
  onSelectApp,
  disabled = false,
}) => {
  const tiles: UpiTileOption[] = [
    {
      id: 'any',
      name: 'Any UPI',
      badgeText: 'Chooser',
    },
    {
      id: 'paytm',
      name: 'Paytm',
      badgeText: 'Direct',
    },
    {
      id: 'gpay',
      name: 'Google Pay',
      badgeText: 'Direct',
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      badgeText: 'Direct',
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#20150F] uppercase tracking-wider font-sans">
          Pay Via UPI
        </label>
        <span className="text-[11px] text-[#8C7A6B] font-medium hidden sm:inline">
          Tap any app to pay instantly
        </span>
      </div>

      {/* RESPONSIVE 4-TILE GRID: 4 columns on desktop & tablet, 4-col / 2x2 on mobile */}
      <div
        role="radiogroup"
        aria-label="Select UPI Application"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5"
      >
        {tiles.map((tile) => {
          const isSelected = selectedApp === tile.id;

          return (
            <button
              key={tile.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelectApp(tile.id)}
              className={`group relative flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer min-h-[96px] text-center outline-none focus-visible:ring-2 focus-visible:ring-[#D7AD36] ${
                isSelected
                  ? 'bg-[#FFFFFF] border-2 border-[#D7AD36] shadow-md ring-2 ring-[#D7AD36]/25 translate-y-[-1px]'
                  : 'bg-white border-[#E5DFD7] hover:border-[#C49A5A]/60 hover:bg-[#FFFDF9] shadow-xs'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-97'}`}
            >
              {/* Selected Gold Checkmark Pill */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#D7AD36] text-[#20150F] flex items-center justify-center shadow-xs animate-scaleIn">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}

              {/* Centered Brand Icon */}
              <div className="mb-2">
                <UpiAppIcon provider={tile.id} size="md" />
              </div>

              {/* Provider Name */}
              <span
                className={`text-xs font-bold font-sans transition-colors ${
                  isSelected ? 'text-[#20150F]' : 'text-[#3B2C24] group-hover:text-[#20150F]'
                }`}
              >
                {tile.name}
              </span>

              {/* Subtle visual state bar */}
              <div
                className={`w-6 h-0.5 rounded-full mt-1.5 transition-all ${
                  isSelected ? 'bg-[#D7AD36]' : 'bg-transparent group-hover:bg-[#E5DFD7]'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
