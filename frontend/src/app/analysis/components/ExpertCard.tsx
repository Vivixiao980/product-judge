'use client';

import { Check } from 'lucide-react';
import { Expert } from '@/data/experts';

interface ExpertCardProps {
  expert: Expert;
  isSelected: boolean;
  isRecommended: boolean;
  onToggle: () => void;
}

export function ExpertCard({ expert, isSelected, isRecommended, onToggle }: ExpertCardProps) {
  return (
    <button
      onClick={onToggle}
      className={`relative p-4 rounded-xl border-2 transition-all text-left w-full ${
        isSelected
          ? 'border-black bg-gray-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      {isRecommended && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-medium rounded-full">
          推荐
        </span>
      )}

      {isSelected && (
        <span className="absolute top-3 right-3 w-5 h-5 bg-black rounded-full flex items-center justify-center">
          <Check size={12} className="text-white" />
        </span>
      )}

      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: expert.color }}
        >
          {expert.name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{expert.name}</h3>
          <p className="text-sm text-gray-500 truncate">{expert.title}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400 line-clamp-2">
        {expert.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1">
        {expert.expertise.slice(0, 2).map((item) => (
          <span
            key={item}
            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
          >
            {item}
          </span>
        ))}
      </div>
    </button>
  );
}
