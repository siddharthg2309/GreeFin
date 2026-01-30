import { Cloud, Home, TreePine, Zap } from 'lucide-react';

import { Card } from '@/components/ui/Card';

interface ImpactMetricsProps {
  co2Avoided: number;
  cleanEnergyGenerated: number;
  treesEquivalent: number;
  homesPowered: number;
}

export function ImpactMetrics({
  co2Avoided,
  cleanEnergyGenerated,
  treesEquivalent,
  homesPowered,
}: ImpactMetricsProps) {
  const metrics = [
    {
      icon: Cloud,
      value: `${co2Avoided.toLocaleString()} kg`,
      label: 'CO₂ Avoided',
      color: 'text-blue-400',
    },
    {
      icon: Zap,
      value: `${cleanEnergyGenerated.toLocaleString()} kWh`,
      label: 'Clean Energy',
      color: 'text-yellow-400',
    },
    {
      icon: TreePine,
      value: treesEquivalent.toLocaleString(),
      label: 'Trees Equivalent',
      color: 'text-green-400',
    },
    {
      icon: Home,
      value: homesPowered.toLocaleString(),
      label: 'Homes Powered',
      color: 'text-purple-400',
    },
  ];

  return (
    <Card>
      <h3 className="text-lg font-medium mb-4">Environmental Impact</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="text-center p-4 bg-[#121212] rounded-lg">
            <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
            <p className="text-xl font-semibold">{value}</p>
            <p className="text-sm text-[#8E8E93]">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

