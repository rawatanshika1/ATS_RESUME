import React from 'react';

function WaveBackground() {
  return (
    <div className="wave-background" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="wave-navy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1F3864" />
            <stop offset="1" stopColor="#101C36" />
          </linearGradient>
          <linearGradient id="wave-teal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#168F8B" stopOpacity=".18" />
            <stop offset="1" stopColor="#1F3864" stopOpacity=".32" />
          </linearGradient>
          <linearGradient id="wave-depth" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#2A3170" stopOpacity=".14" />
            <stop offset="1" stopColor="#1F3864" stopOpacity=".08" />
          </linearGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#wave-navy)" />
        <g className="wave-drift wave-drift-one">
          <path d="M-90 188C172 66 323 292 594 196S1008 50 1225 156s300 143 405 57v333c-223 94-345-63-580-22S648 657 398 548 91 405-90 523Z" fill="url(#wave-teal)" opacity=".8" />
          <path d="M-115 588C113 476 310 647 536 580s395-195 655-125 299 162 439 82v385H-115Z" fill="url(#wave-navy)" opacity=".62" />
        </g>
        <g className="wave-drift wave-drift-two">
          <path d="M720-78C869 79 1092 126 1211 269s103 251 298 289v-636Z" fill="url(#wave-depth)" />
          <path d="M-80 742c228-140 384-81 584-8s402 79 570-14 269-66 444 20v225H-80Z" fill="url(#wave-teal)" opacity=".56" />
        </g>
      </svg>
    </div>
  );
}

export default WaveBackground;
