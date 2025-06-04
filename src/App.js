import React, { useState, useEffect } from 'react';

export default function App() {
  const [appId, setAppId] = useState('');
  const [appName, setAppName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allPackages, setAllPackages] = useState([]);

  useEffect(() => {
    fetch('/winget_packages.json')
      .then(res => res.json())
      .then(data => setAllPackages(data));
  }, []);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setAppName(value);

    const filtered = allPackages
      .filter(pkg =>
        pkg.name.toLowerCase().includes(value.toLowerCase()) ||
        pkg.id.toLowerCase().includes(value.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 suggestions

    setSuggestions(filtered);
  };

  const handleSuggestionClick = (pkg) => {
    setAppId(pkg.id);
    setAppName(pkg.name);
    setSuggestions([]);
  };

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
        placeholder="App Name (type to search)"
        value={appName}
        onChange={handleNameChange}
        style={{ width: '300px', marginBottom: 10 }}
      />
      <div style={{ marginBottom: 10 }}>
        {suggestions.map((pkg, index) => (
          <div
            key={index}
            onClick={() => handleSuggestionClick(pkg)}
            style={{
              cursor: 'pointer',
              background: '#f0f0f0',
              padding: '5px',
              marginBottom: '2px',
              borderRadius: '4px',
              maxWidth: '300px'
            }}
          >
            {pkg.name} ({pkg.id})
          </div>
        ))}
      </div>
      <button onClick={generatePackage}>Generate Package</button>
    </div>
  );
}
