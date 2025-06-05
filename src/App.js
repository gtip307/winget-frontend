import React, { useState, useEffect } from 'react';
import Fuse from 'fuse.js';

export default function App() {
  const [appId, setAppId] = useState('');
  const [appName, setAppName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const priorityList = [
    'Google.Chrome', 'Microsoft.Edge', 'Mozilla.Firefox',
    '7zip.7zip', 'Notepad++.Notepad++', 'VideoLAN.VLC'
  ];

  useEffect(() => {
    fetch('/winget_packages.json')
      .then(res => res.json())
      .then(data => setAllPackages(data));
  }, []);

  const isEnglish = (str) => /^[\x00-\x7F]+$/.test(str);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setAppName(value);
    setHighlightIndex(-1);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const fuse = new Fuse(allPackages, {
      keys: ['name', 'id'],
      threshold: 0.3,
    });

    let results = fuse.search(value).map(r => r.item);
    results = results.filter(pkg => isEnglish(pkg.name || pkg.id));

    results.sort((a, b) => {
      const aPriority = priorityList.includes(a.id) ? 0 : 1;
      const bPriority = priorityList.includes(b.id) ? 0 : 1;
      return aPriority - bPriority;
    });

    setSuggestions(results.slice(0, 30));
  };

  const handleSuggestionClick = (pkg) => {
    setAppId(pkg.id);
    setAppName(pkg.name);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[highlightIndex]);
    }
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
        onKeyDown={handleKeyDown}
        style={{ width: '300px', marginBottom: 10 }}
      />
      <div
        style={{
          marginBottom: 10,
          maxHeight: '250px',
          overflowY: 'auto',
          border: suggestions.length ? '1px solid #ccc' : 'none',
          borderRadius: '6px',
          maxWidth: '300px'
        }}
      >
        {suggestions.map((pkg, index) => (
          <div
            key={pkg.id}
            onClick={() => handleSuggestionClick(pkg)}
            style={{
              cursor: 'pointer',
              background: highlightIndex === index ? '#d0ebff' : '#f0f0f0',
              padding: '5px',
              marginBottom: '2px',
              borderRadius: '4px',
              fontWeight: priorityList.includes(pkg.id) ? 'bold' : 'normal'
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