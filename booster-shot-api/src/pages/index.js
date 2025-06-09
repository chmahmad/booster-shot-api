import { useEffect, useState } from 'react';

export default function ContactList() {
  const [locationId, setLocationId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [limit, setLimit] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPages, setPrevPages] = useState([]);

  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLocationId(params.get('location_id'));
  }, []);

  useEffect(() => {
    if (locationId) {
      // Reset pagination stack and load first page
      setPrevPages([]);
      const initialUrl = `/api/get-contacts?locationId=${locationId}&limit=${limit}`;
      loadPage(initialUrl, 1, true);
    }
  }, [locationId, limit]);

  const loadPage = async (url, pageNumber, resetHistory = false) => {
    setLoading(true);
    console.log('Loading:', url);

    try {
      const res = await fetch(url);
      const data = await res.json();

      setDebugInfo({
        lastRequest: url,
        response: {
          contactsCount: data.contacts?.length,
          pagination: data.pagination,
          hasMore: data.pagination?.hasMore
        }
      });

      if (res.ok) {
        setContacts(data.contacts || []);
        setTotalCount(data.pagination?.total || 0);
        setCurrentPage(pageNumber);

        // Set nextPageUrl only if hasMore is true
        setNextPageUrl(data.pagination?.hasMore ? data.pagination.nextPageUrl : null);

        if (resetHistory) {
          setPrevPages([]);
        } else {
          // Push current URL to prevPages stack only if navigating forward
          if (pageNumber > prevPages.length + 1) {
            setPrevPages((prev) => [...prev, url]);
          }
        }

        setSelectedContacts(new Set());
      } else {
        alert('API error: ' + (data.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (nextPageUrl) {
      loadPage(nextPageUrl, currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && prevPages[currentPage - 2]) {
      const prevUrl = prevPages[currentPage - 2];
      loadPage(prevUrl, currentPage - 1);
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
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedContacts(newSet);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🚀 Booster Shot Campaign Launcher</h1>

      {locationId ? (
        <>
          {/* Debug Panel */}
          <div style={{
            background: '#f0f0f0',
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '4px'
          }}>
            <h4>Debug Info:</h4>
            <pre>
              {JSON.stringify({
                currentPage,
                totalCount,
                hasNextPage: !!nextPageUrl,
                nextPageUrlSnippet: nextPageUrl?.split('startAfter=')[1]?.substring(0, 20),
                loading
              }, null, 2)}
            </pre>
          </div>

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
            <div>Page {currentPage} of {Math.ceil(totalCount / limit)}</div>
            <button
              onClick={handleNextPage}
              disabled={!nextPageUrl || loading}
              style={{
                backgroundColor: nextPageUrl ? '#0070f3' : '#ccc',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                cursor: nextPageUrl ? 'pointer' : 'default'
              }}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p>Please provide a location_id URL parameter.</p>
      )}
    </div>
  );
}
