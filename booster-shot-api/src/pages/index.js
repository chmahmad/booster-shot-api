import { useEffect, useState } from 'react';

export default function Home() {
  const [locationId, setLocationId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [pageSize, setPageSize] = useState(20); // default to 20
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locId = params.get('location_id');
    setLocationId(locId);
  }, []);

  useEffect(() => {
    if (locationId) fetchContacts(); // fetch when locationId is set
  }, [locationId, pageSize]);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const response = await fetch(`/api/get-contacts?limit=${pageSize}&location_id=${locationId}`);
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error('Error fetching contacts', err);
      setContacts([]);
    }
    setLoadingContacts(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🚀 Booster Shot Campaign Launcher</h1>

      {locationId ? (
        <>
          <p><strong>Subaccount ID:</strong> {locationId}</p>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="messageBox" style={{ fontWeight: 'bold' }}>SMS/Text</label>
            <textarea id="messageBox" rows={4} style={{ width: '100%', marginTop: '8px' }} />
            <button style={{ float: 'right', marginTop: '8px' }}>Launch Campaign</button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h3>Select Campaign Contacts</h3>

            <label htmlFor="pageSize" style={{ marginRight: '8px' }}>Show</label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{ marginBottom: '10px' }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            {loadingContacts ? (
              <p>Loading contacts...</p>
            ) : (
              <>
                <button style={{ marginBottom: '10px' }}>Select All</button>
                {contacts.map((contact) => (
                  <div key={contact.id} style={{ border: '1px solid #ccc', padding: '8px', marginBottom: '4px' }}>
                    <input type="checkbox" style={{ marginRight: '8px' }} />
                    {contact.name} — {contact.email} — {contact.phone}
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      ) : (
        <p>Loading subaccount ID...</p>
      )}
    </div>
  );
}
