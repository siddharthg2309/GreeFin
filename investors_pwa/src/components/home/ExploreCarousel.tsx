'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Building, Building2, TrendingUp } from 'lucide-react';

import { IconWrapper } from '@/components/ui/IconWrapper';

const categories = [
  {
    id: 'GREEN_FUND',
    title: 'Green Mutual Funds',
    description: 'ESG & renewable energy funds',
    icon: TrendingUp,
    iconColor: 'text-emerald-500',
    glowColor: 'bg-emerald-500/10',
  },
  {
    id: 'GREEN_BOND',
    title: 'Green Bonds',
    description: 'Fixed return green bonds',
    icon: Building,
    iconColor: 'text-teal-400',
    glowColor: 'bg-teal-400/10',
  },
  {
    id: 'INVIT',
    title: 'Green InvITs',
    description: 'Infrastructure trusts',
    icon: Building2,
    iconColor: 'text-amber-500',
    glowColor: 'bg-amber-500/10',
  },
];

export function ExploreCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth * 0.7;
      const gap = 16;
      const totalCardWidth = cardWidth + gap;
      // Use floor with a small threshold to improve snapping detection
      const index = Math.round((scrollLeft + totalCardWidth / 3) / totalCardWidth);
      setActiveIndex(Math.max(0, Math.min(index, categories.length - 1)));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCard = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.offsetWidth * 0.7;
    const gap = 16;
    const scrollPosition = index * (cardWidth + gap);
    container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-white mb-4">Explore investment ideas</h2>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {categories.map(({ id, title, description, icon: Icon, iconColor, glowColor }) => (
          <Link
            key={id}
            href={`/discover?type=${id}`}
            className="snap-start flex-shrink-0"
            style={{ width: '70%' }}
          >
            <div className="group bg-[#262626] border border-[#333333] rounded-md p-5 h-32 flex items-center gap-4 hover:bg-[#2e2e2e] transition-colors">
              <IconWrapper
                icon={Icon}
                primaryClassName={iconColor}
                secondaryClassName={iconColor}
                glowClassName={glowColor}
              />
              <div className="min-w-0">
                <h3 className="text-white text-base font-semibold leading-tight">{title}</h3>
                <p className="text-sm text-[#9B9B9B] leading-snug">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-2">
        {categories.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => scrollToCard(index)}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${index === activeIndex ? 'bg-blue-500' : 'bg-neutral-600'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
