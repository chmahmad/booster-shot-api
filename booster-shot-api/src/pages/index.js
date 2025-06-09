import { useEffect, useState } from 'react';

export default function Home() {
  const [locationId, setLocationId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [limit, setLimit] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPages, setPrevPages] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locId = params.get('location_id');
    setLocationId(locId);
  }, []);

  useEffect(() => {
    if (locationId) {
      setPrevPages([]);           // Reset history on locationId or limit change
      loadPage(buildInitialUrl(locationId, limit), 1, true);
    }
  }, [locationId, limit]);

 const buildInitialUrl = (locId, limit) => {
  return `/api/get-contacts?locationId=${locId}&limit=${limit}`;
};

const loadPage = async (url, pageNumber, resetHistory = false) => {
  setLoading(true);

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (res.ok) {
      setContacts(data.contacts || []);
      setTotalCount(data.pagination?.total || 0);
      setCurrentPage(pageNumber);
      // Use the correct path to nextPageUrl
      setNextPageUrl(data.pagination?.nextPageUrl || null);

      if (resetHistory) {
        setPrevPages([]);
      } else if (pageNumber > prevPages.length + 1) {
        setPrevPages((prev) => [...prev, url]);
      }

      setSelectedContacts(new Set());
    } else {
      alert('Failed to load contacts: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    alert('Error fetching contacts: ' + error.message);
  }

  setLoading(false);
};

  const handleNextPage = () => {
    if (nextPageUrl) {
      loadPage(nextPageUrl, currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && prevPages[currentPage - 2]) {
      loadPage(prevPages[currentPage - 2], currentPage - 1);
      setPrevPages((prev) => prev.slice(0, currentPage - 2));
    }
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size < contacts.length) {
      setSelectedContacts(new Set(contacts.map((c) => c.id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const toggleSelectContact = (id) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedContacts(newSet);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🚀 Booster Shot Campaign Launcher</h1>

      {locationId ? (
        <>
          <p><strong>Subaccount ID:</strong> {locationId}</p>

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
            <div>Page {currentPage}</div>
            <button onClick={handleNextPage} disabled={!nextPageUrl || loading}>
              Next
            </button>
          </div>

          {loading && <div style={{ marginTop: '8px' }}>Loading...</div>}
        </>
      ) : (
        <p>Loading subaccount ID...</p>
      )}
    </div>
console.log('Next page URL in frontend:', nextPageUrl);
  );
}
