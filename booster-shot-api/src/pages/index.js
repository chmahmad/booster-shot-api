import { useEffect, useState } from 'react';

export default function Home() {
  const [locationId, setLocationId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [limit, setLimit] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Map to store pagination cursors for each page
  const [pageCursorMap, setPageCursorMap] = useState({
    1: { startAfter: null, startAfterId: null },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locId = params.get('location_id');
    setLocationId(locId);
  }, []);

  // Load first page or reload when locationId or limit changes
  useEffect(() => {
    if (locationId) {
      // Reset cursor map to start fresh
      setPageCursorMap({ 1: { startAfter: null, startAfterId: null } });
      loadPage(1);
    }
  }, [locationId, limit]);

  const loadPage = async (pageNumber) => {
    const cursor = pageCursorMap[pageNumber] || { startAfter: null, startAfterId: null };

    setLoading(true);

    // Prepare query parameters
    const params = new URLSearchParams({
      locationId,
      limit,
    });
    if (cursor.startAfter) params.append('startAfter', cursor.startAfter);
    if (cursor.startAfterId) params.append('startAfterId', cursor.startAfterId);

    try {
      const res = await fetch(`/api/get-contacts?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setContacts(data.contacts || []);
        setTotalCount(data.total || 0);

        // Store cursor for next page if available
        if (data.nextPage && data.nextPage.startAfter && data.nextPage.startAfterId) {
          setPageCursorMap((prev) => ({
            ...prev,
            [pageNumber + 1]: {
              startAfter: data.nextPage.startAfter,
              startAfterId: data.nextPage.startAfterId,
            },
          }));
        }

        setCurrentPage(pageNumber);
        setSelectedContacts(new Set()); // Clear selections when page changes
      } else {
        alert('Failed to load contacts: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error fetching contacts: ' + error.message);
    }

    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / limit);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      loadPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      loadPage(currentPage - 1);
    }
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

          <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={handlePreviousPage} disabled={currentPage === 1 || loading}>
              Previous
            </button>

            <div>Page {currentPage} of {totalPages || '...'}</div>

            <button onClick={handleNextPage} disabled={currentPage === totalPages || loading || !pageCursorMap[currentPage + 1]}>
              Next
            </button>
          </div>

          {loading && <div style={{ marginTop: '8px' }}>Loading...</div>}
        </>
      ) : (
        <p>Loading subaccount ID...</p>
      )}
    </div>
  );
}
