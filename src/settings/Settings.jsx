import React, { useState, useEffect } from 'react';
import './settings.css';

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
    <div className="settings-page">
      <div className="settings-container">
        <h1>Settings</h1>
        <h2>ML Engine Permission</h2>
        {hasPermission === null && <p>Checking permission status...</p>}
        {hasPermission && <p className="success">✅ trialML permission granted.</p>}
        {hasPermission === false && (
          <div>
            <p className="error">❌ trialML permission is required for ML features.</p>
            <button onClick={handleRequestPermission} disabled={requesting}>
              {requesting ? 'Requesting...' : 'Grant Permission'}
            </button>
            {error && <p className="error" style={{ marginTop: 10 }}>{error}</p>}
          </div>
        )}
        <p className="note">
          <strong>Note:</strong><br />
          If ML features aren’t showing up, follow these steps:
          <ol style={{ textAlign: 'left', marginTop: '10px', marginLeft: '20px' }}>
            <li>Open <code>about:config</code> in Firefox Nightly.</li>
            <li>Search for <code>browser.ml.enable</code> and set it to <code>true</code>.</li>
            <li>Search for <code>extensions.ml.enabled</code> and set it to <code>true</code>.</li>
          </ol>
        </p>
      </div>
    </div>
  );
  
};

export default Settings;
