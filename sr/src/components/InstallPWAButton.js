import React, { useEffect, useState } from 'react';

const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        setShowButton(false);
        setDeferredPrompt(null);
      });
    }
  };

  if (!showButton) return null;
  return (
    <button onClick={handleInstallClick} style={{position: 'fixed', bottom: 20, right: 20, zIndex: 9999}}>
      Install App
    </button>
  );
};

export default InstallPWAButton;
