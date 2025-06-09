import { useEffect, useState } from 'react';

export default function Home() {
  const [locationId, setLocationId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locId = params.get('location_id');
    setLocationId(locId);
  }, []);

  const fetchContacts = async (pageNumber = 1) => {
    if (!locationId) return;
    setLoadingContacts(true);
    try {
      const offset = (pageNumber - 1) * limit;
      const response = await fetch(`/api/get-contacts?location_id=${locationId}&limit=${limit}&offset=${offset}`);
      const data = await response.json();
      setContacts(data.contacts || []);
      setTotalContacts(data.total || 0); // Make sure your API returns total count of contacts
      setSelectedContacts([]);
      setPage(pageNumber);
    } catch (err) {
      console.error(err);
      alert('Error fetching contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const toggleContactSelection = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map((contact) => contact.id));
    }
  };

  const totalPages = Math.ceil(totalContacts / limit);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🚀 Booster Shot Campaign Launcher</h1>

      {locationId ? (
        <>
          <p><strong>Subaccount ID:</strong> {locationId}</p>

          <div style={{ marginBottom: '20px' }}>
            <label><strong>Sms/Text:</strong></label><br />
            <textarea rows="4" cols="50" placeholder="Type your SMS message here..." style={{ width: '100%', padding: '8px', fontSize: '14px' }} />
            <button
              style={{ marginTop: '10px', float: 'right', padding: '8px 16px', fontSize: '14px' }}
              onClick={() => alert('Launch Campaign')}
            >
              🚀 Launch Campaign
            </button>
          </div>

          <hr />

          <div style={{ margin: '20px 0' }}>
            <label htmlFor="limit"><strong>Show:</strong> </label>
            <select id="limit" value={limit} onChange={(e) => setLimit(parseInt(e.target.value))} style={{ marginRight: '10px' }}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <button onClick={() => fetchContacts(1)} style={{ padding: '4px 12px', fontSize: '12px' }}>Load Contacts</button>
          </div>

          {loadingContacts && <p>Loading contacts...</p>}

          {contacts.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === contacts.length}
                    onChange={toggleSelectAll}
                  /> Select All
                </label>
                <span>{selectedContacts.length} selected</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0 }}>
                {contacts.map((contact) => (
                  <li key={contact.id} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleContactSelection(contact.id)}
                      />{' '}
                      <strong>{contact.firstName || ''} {contact.lastName || ''}</strong> — {contact.email || ''} — {contact.phone || ''}
                    </label>
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button onClick={() => fetchContacts(page - 1)} disabled={page <= 1}>⬅ Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => fetchContacts(page + 1)} disabled={page >= totalPages}>Next ➡</button>
              </div>
            </>
          )}
        </>
      ) : (
        <p>Loading subaccount ID...</p>
      )}
    </div>
  );
}
