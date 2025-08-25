import React, { useState, useEffect } from 'react';
import './StatCard.css';

const StatCard = ({ number, label, animated = false }) => {
  const [displayNumber, setDisplayNumber] = useState(0);
  
  // Check if this is a date stat (contains multiple lines or specific date format)
  const isDateStat = label === 'LAST UPDATED' || String(number).includes('\n') || String(number).length > 10;
  
  useEffect(() => {
    if (animated && typeof number === 'number' && number > 0) {
      let start = 0;
      const end = number;
      const duration = 2000; // 2 seconds
      const increment = end / (duration / 16); // 60fps
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayNumber(end);
          clearInterval(timer);
        } else {
          setDisplayNumber(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(timer);
    } else {
      setDisplayNumber(number);
    }
  }, [number, animated]);
  
  return (
    <div className="stat">
      <div className={`stat-number ${isDateStat ? 'date-stat' : ''} ${animated ? 'animated-stat' : ''}`}>
        {animated && typeof number === 'number' ? `${displayNumber}+` : number}
      </div>
      <div className="stat-label">
        {label}
      </div>
    </div>
  );
};

export default StatCard;