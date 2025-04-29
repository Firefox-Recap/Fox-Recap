import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  const checkPermission = async () => {
    try {
      const granted = await browser.permissions.contains({ permissions: ['trialML'] });
      setHasPermission(granted);
    } catch (err) {
      setError('Could not check permission status.');
      setHasPermission(false);
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  const handleRequestPermission = async () => {
    setRequesting(true);
    setError('');
    try {
      const granted = await browser.permissions.request({ permissions: ['trialML'] });
      setHasPermission(granted);
      if (!granted) setError('Permission was not granted.');
    } catch (err) {
      setError('An error occurred while requesting permission.');
      setHasPermission(false);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <h1>Settings</h1>
      <h2>ML Engine Permission</h2>
      {hasPermission === null && <p>Checking permission status...</p>}
      {hasPermission && <p style={{ color: 'green' }}>✅ trialML permission granted.</p>}
      {hasPermission === false && (
        <div>
          <p style={{ color: 'red' }}>❌ trialML permission is required for ML features.</p>
          <button onClick={handleRequestPermission} disabled={requesting}>
            {requesting ? 'Requesting...' : 'Grant Permission'}
          </button>
          {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
        </div>
      )}
      <p style={{ marginTop: 20, fontSize: '0.9em', color: '#666' }}>
        Note: You might need to enable <code>browser.ml.enable</code> and <code>extensions.ml.enabled</code> in <code>about:config</code> in Firefox Nightly.
      </p>
    </div>
  );
};

export default Settings;
