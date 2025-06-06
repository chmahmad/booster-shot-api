// pages/index.js
import { useEffect, useState } from 'react';

export default function Home() {
  const [locationId, setLocationId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locId = params.get('location_id');
    setLocationId(locId);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🚀 Booster Shot Campaign Launcher</h1>
      {locationId ? (
        <>
          <p><strong>Subaccount ID:</strong> {locationId}</p>
          <button
            onClick={() => alert('Start New Campaign')}
            style={{ padding: '10px 20px', fontSize: '16px' }}
          >
            Start New Campaign
          </button>
        </>
      ) : (
        <p>Loading subaccount ID...</p>
      )}
    </div>
  );
}
