import React, { useState, useEffect } from 'react';

const ResponsiveTestIndicator = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isMobile = windowWidth < 992;
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: isMobile ? '#dc3545' : '#28a745',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 9999,
        fontSize: '12px',
        fontWeight: 'bold'
      }}
    >
      {/* Screen: {windowWidth}px - {isMobile ? 'MOBILE (Navbar Hidden)' : 'DESKTOP (Navbar Visible)'} */}
    </div>
  );
};

export default ResponsiveTestIndicator;
