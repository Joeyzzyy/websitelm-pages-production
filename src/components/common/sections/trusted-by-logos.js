'use client';
import React, { useEffect, useState } from 'react';
import themeConfig from '../../../styles/themeConfig';

const TrustedByLogos = ({ data, themeName = 'normal' }) => {
  const theme = themeConfig[themeName];
  const logos = data?.bottomContent || [];
  const [position, setPosition] = useState(0);
  
  useEffect(() => {
    const itemWidth = 128;
    const totalWidth = itemWidth * logos.length;
    
    const interval = setInterval(() => {
      setPosition(prev => {
        const newPosition = prev - 1;
        if (Math.abs(newPosition) >= totalWidth) {
          return 0;
        }
        return newPosition;
      });
    }, 20);
    
    return () => clearInterval(interval);
  }, [logos.length]);

  const tripleLogos = [...logos, ...logos, ...logos];

  return (
    <div className={`${theme.section.background.primary} ${theme.section.padding.base} relative overflow-hidden`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="overflow-hidden relative">
          <div
            className="flex gap-8"
            style={{
              transform: `translateX(${position}px)`,
              transition: 'none',
            }}
          >
            {tripleLogos.map((logo, index) => (
              <div
                key={`${logo.imageUrl}-${index}`}
                className={`${theme.card.variants.primary} flex-shrink-0 w-24 h-24 flex items-center justify-center`}
              >
                <img
                  src={logo.imageUrl}
                  alt={`Logo ${index}`}
                  className="w-full h-full object-contain p-2"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className={`absolute right-0 top-0 w-32 h-full bg-gradient-to-l ${theme.section.background.primary === 'bg-white' ? 'from-white' : 'from-blue-50'} to-transparent z-10`} />
    </div>
  );
};

export default TrustedByLogos;