'use client';

import clsx from 'clsx';
import { Stage } from '../types';

interface PhaseIndicatorProps {
    currentStage: Stage;
}

const phases: { key: Stage; label: string }[] = [
    { key: 'info', label: 'Step 1 信息收集' },
    { key: 'deep', label: 'Step 2 深度追问' },
    { key: 'analysis', label: 'Step 3 多视角分析' },
];

export function PhaseIndicator({ currentStage }: PhaseIndicatorProps) {
    return (
        <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-4 text-sm text-gray-500">
                {phases.map((phase) => (
                    <span
                        key={phase.key}
                        className={clsx(
                            "pb-1 border-b-2",
                            currentStage === phase.key
                                ? "text-black font-bold border-black"
                                : "text-gray-400 border-transparent"
                        )}
                    >
                        {phase.label}
                    </span>
                ))}
            </div>
        </div>
    );
}
