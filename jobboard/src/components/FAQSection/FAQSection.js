import React, { useState, useRef, useEffect } from 'react';
import { faqData } from '../../data/faqData';
import { useTheme } from '../../context/ThemeContext';
import './FAQSection.css';

const FAQItem = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded]);

  return (
    <div className={`faq-item ${isExpanded ? 'expanded' : ''}`}>
      <button 
        className="faq-question" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>{item.question}</span>
        <svg 
          className="faq-arrow" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      <div 
        className="faq-answer"
        style={{ height: `${height}px` }}
        ref={contentRef}
      >
        <p>{item.answer}</p>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const { isDarkMode } = useTheme();
  const sectionRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;
      
      // Animation completes when bottom of section reaches bottom of viewport
      const startPoint = windowHeight;
      const endPoint = -sectionHeight + windowHeight;
      const currentPosition = rect.top;
      
      const progress = Math.max(0, Math.min(1, 1 - ((currentPosition - endPoint) / (startPoint - endPoint))));
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate translation based on scroll progress - full range
  const triangleTransform = `translateX(${600 * (1 - scrollProgress)}px)`;
  const helixTransform = `translateX(${-600 * (1 - scrollProgress)}px)`;

  return (
    <section id="faq" className="faq-section scroll-reveal" ref={sectionRef}>
      <div className="faq-background" style={{ 
        backgroundImage: `url(${process.env.PUBLIC_URL}/faq-background.png)`,
        opacity: isDarkMode ? 0 : 1
      }}></div>
      <div className="faq-decorations">
        <img 
          className="faq-triangle" 
          src={`${process.env.PUBLIC_URL}/triangle.png`}
          alt="" 
          style={{ transform: triangleTransform }}
        />
        <img 
          className="faq-helix" 
          src={`${process.env.PUBLIC_URL}/helix.png`}
          alt="" 
          style={{ transform: helixTransform }}
        />
      </div>
      <div className="faq-container">
        <h2 className="faq-title">
          Frequently Asked Questions
        </h2>
        
        <div className="faq-items">
          {faqData.map((item) => (
            <FAQItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;