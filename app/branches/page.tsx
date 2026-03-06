// app/accurate-branches/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/accurate/branches')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBranches(data.branches);
        } else {
          setError(data.error);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 20 }}>Loading branches...</p>;
  if (error)   return <p style={{ padding: 20, color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h2>Accurate Branches</h2>
      <table border={1} cellPadding={8} cellSpacing={0}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Number</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch, i) => (
            <tr key={i}>
              <td>{branch.id ?? '—'}</td>
              <td>{branch.number ?? '—'}</td>
              <td>{branch.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 style={{ marginTop: 20 }}>Raw JSON:</h3>
      <pre style={{ background: '#f4f4f4', padding: 12 }}>
        {JSON.stringify(branches, null, 2)}
      </pre>
    </div>
  );
}