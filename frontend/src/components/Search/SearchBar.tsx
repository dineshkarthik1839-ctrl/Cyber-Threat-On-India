import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
      <input 
        type="text" 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search IPs, domains, threats..." 
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(0,0,0,0.2)',
          color: 'white',
          width: '300px'
        }}
      />
      <button type="submit" style={{
        padding: '8px 16px',
        borderRadius: '20px',
        border: 'none',
        background: '#1a8dd0',
        color: 'white',
        cursor: 'pointer'
      }}>
        Search
      </button>
    </form>
  );
};
