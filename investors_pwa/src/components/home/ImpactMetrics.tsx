'use client';

import { Cloud, TreePine, Wind } from 'lucide-react';

import { Card } from '@/components/ui/Card';

interface ImpactMetricsProps {
  co2Avoided: number;
  cleanEnergyGenerated: number;
  treesEquivalent: number;
}

export function ImpactMetrics({ co2Avoided, cleanEnergyGenerated, treesEquivalent }: ImpactMetricsProps) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-4">Your Impact</h2>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <Cloud className="w-6 h-6 mx-auto mb-2 text-blue-400" />
          <p className="text-lg font-bold">{co2Avoided.toFixed(1)}</p>
          <p className="text-xs text-gray-500">kg CO₂ avoided</p>
        </Card>

        <Card className="text-center py-4">
          <Wind className="w-6 h-6 mx-auto mb-2 text-green-400" />
          <p className="text-lg font-bold">{cleanEnergyGenerated.toFixed(0)}</p>
          <p className="text-xs text-gray-500">kWh clean energy</p>
        </Card>

        <Card className="text-center py-4">
          <TreePine className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
          <p className="text-lg font-bold">{treesEquivalent}</p>
          <p className="text-xs text-gray-500">trees equivalent</p>
        </Card>
      </div>
    </div>
  );
}

