import React, { useState } from 'react';

export default function App() {
  const [appId, setAppId] = useState('');
  const [appName, setAppName] = useState('');

  const generatePackage = async () => {
    const formData = new FormData();
    formData.append('app_id', appId);
    formData.append('app_name', appName);

    const response = await fetch('https://intune.gareth.tips/generate', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();

      // Robust filename extraction from Content-Disposition
      const contentDisposition = response.headers.get('content-disposition');
      console.log("📦 Content-Disposition header:", contentDisposition);
      let filename = 'winget_package.zip';

      if (contentDisposition) {
        try {
          const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/);
          const extracted = match?.[1] || match?.[2];
          if (extracted) {
            filename = decodeURIComponent(extracted);
          }
        } catch (e) {
          console.warn('Filename extraction failed:', e);
        }
      }

      // Trigger the download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } else {
      alert('Failed to generate package');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Winget Packager</h1>
      <input
        placeholder="App ID (e.g. Google.Chrome)"
        value={appId}
        onChange={(e) => setAppId(e.target.value)}
        style={{ width: '300px', marginBottom: 10 }}
      />
      <br />
      <input
        placeholder="App Name (optional)"
        value={appName}
        onChange={(e) => setAppName(e.target.value)}
        style={{ width: '300px', marginBottom: 10 }}
      />
      <br />
      <button onClick={generatePackage}>Generate Package</button>
    </div>
  );
}
