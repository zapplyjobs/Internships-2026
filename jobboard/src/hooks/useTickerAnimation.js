import { useEffect } from 'react';

const useTickerAnimation = () => {
  useEffect(() => {
    // Only apply on mobile devices
    if (window.innerWidth > 768) return;

    const ticker = document.querySelector('.companies-track');
    if (!ticker) return;

    let animationId;
    let position = 0;
    const speed = 0.5; // Pixels per frame

    const animate = () => {
      position -= speed;
      
      // Get the width of the ticker content
      const tickerWidth = ticker.scrollWidth / 2; // Divided by 2 because content is duplicated
      
      // Reset position when first set of logos has scrolled out
      if (Math.abs(position) >= tickerWidth) {
        position = 0;
      }
      
      ticker.style.transform = `translateX(${position}px)`;
      ticker.style.webkitTransform = `translateX(${position}px)`;
      
      animationId = requestAnimationFrame(animate);
    };

    // Intersection Observer to control animation based on visibility
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start animation when visible
            if (!animationId) {
              animate();
            }
          } else {
            // Pause animation when not visible
            if (animationId) {
              cancelAnimationFrame(animationId);
              animationId = null;
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const companiesBanner = document.querySelector('.companies-banner');
    if (companiesBanner) {
      observer.observe(companiesBanner);
    }

    // Start animation if initially visible
    const rect = companiesBanner?.getBoundingClientRect();
    if (rect && rect.top < window.innerHeight && rect.bottom > 0) {
      animate();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (companiesBanner) {
        observer.unobserve(companiesBanner);
      }
    };
  }, []);
};

export default useTickerAnimation;