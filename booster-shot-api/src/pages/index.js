import { useEffect, useState } from 'react';

export default function Home() {
  const [locationId, setLocationId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [limit, setLimit] = useState(100);
  const [page, setPage] = useState(1);
  const [totalLoaded, setTotalLoaded] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locId = params.get('location_id');
    setLocationId(locId);
  }, []);

  useEffect(() => {
    if (locationId) {
      fetchContacts({ reset: true });
    }
  }, [locationId, limit]);

  const fetchContacts = async ({ startAfter = null, startAfterId = null, reset = false } = {}) => {
    setLoading(true);

    const query = new URLSearchParams({
      locationId,
      limit,
    });

    if (startAfter) query.append('startAfter', startAfter);
    if (startAfterId) query.append('startAfterId', startAfterId);

    const res = await fetch(`/api/get-contacts?${query.toString()}`);
    const data = await res.json();

    if (reset) {
      setContacts(data.contacts);
      setPage(1);
      setTotalLoaded(data.contacts.length);
    } else {
      setContacts((prev) => [...prev, ...data.contacts]);
      setPage((prev) => prev + 1);
      setTotalLoaded((prev) => prev + data.contacts.length);
    }

    setPagination(data.nextPage || null);
    setLoading(false);
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size < contacts.length) {
      const newSet = new Set(contacts.map((c) => c.id));
      setSelectedContacts(newSet);
    } else {
      setSelectedContacts(new Set());
    }
  };

  const toggleSelectContact = (contactId) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(contactId)) {
      newSet.delete(contactId);
    } else {
      newSet.add(contactId);
    }
    setSelectedContacts(newSet);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🚀 Booster Shot Campaign Launcher</h1>
      {locationId ? (
        <>
          <p><strong>Subaccount ID:</strong> {locationId}</p>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h2>SMS/Text</h2>
            <button
              onClick={() => alert(`Launching campaign with ${selectedContacts.size} contact(s)`)}
              style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
              Launch Campaign
            </button>
          </div>

          <textarea
            placeholder="Type your SMS/Text here..."
            style={{ width: '100%', height: '100px', marginBottom: '20px' }}
          />

          <h3>Select Campaign Contacts</h3>

          <div style={{ marginBottom: '10px' }}>
            <label>Show </label>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <label> contacts per page</label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <button onClick={toggleSelectAll}>
              {selectedContacts.size < contacts.length ? 'Select All' : 'Unselect All'}
            </button>
            <div>Selected: {selectedContacts.size}</div>
          </div>

          {contacts.map((contact) => (
            <div key={contact.id} style={{ borderBottom: '1px solid #ddd', padding: '5px 0', display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={selectedContacts.has(contact.id)}
                onChange={() => toggleSelectContact(contact.id)}
                style={{ marginRight: '10px' }}
              />
              <div>
                <div><strong>{contact.firstName || ''} {contact.lastName || ''}</strong></div>
                <div>{contact.email || ''}</div>
                <div>{contact.phone || ''}</div>
              </div>
            </div>
          ))}

          {pagination && (
            <button
              onClick={() => fetchContacts({
                startAfter: pagination.startAfter,
                startAfterId: pagination.startAfterId,
              })}
              disabled={loading}
              style={{ marginTop: '10px', padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}

          <div style={{ marginTop: '8px' }}>
            Page {page} | Loaded {totalLoaded} contact(s)
          </div>
        </>
      ) : (
        <p>Loading subaccount ID...</p>
      )}
    </div>
  );
}
