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

  // Debug state
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLocationId(params.get('location_id'));
  }, []);

  useEffect(() => {
    if (locationId) {
      loadInitialPage();
    }
  }, [locationId, limit]);

  const loadInitialPage = () => {
    setPrevPages([]);
    loadPage(`/api/get-contacts?locationId=${locationId}&limit=${limit}`, 1, true);
  };

  const loadPage = async (url, pageNumber, resetHistory = false) => {
    setLoading(true);
    console.log('Fetching:', url);

    try {
      const res = await fetch(url);
      const data = await res.json();
      
      setDebugInfo({
        lastRequest: url,
        response: {
          contactsCount: data.contacts?.length,
          pagination: data.pagination
        }
      });

      if (res.ok) {
        setContacts(data.contacts || []);
        setTotalCount(data.pagination?.total || 0);
        setCurrentPage(pageNumber);
        setNextPageUrl(data.pagination?.nextPageUrl || null);

        if (resetHistory) {
          setPrevPages([]);
        } else if (pageNumber > prevPages.length + 1) {
          setPrevPages(prev => [...prev, url]);
        }
      } else {
        console.error('API Error:', data.error);
        alert(`Error: ${data.error?.message || 'Unknown error'}`);
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
    if (currentPage > 1) {
      loadPage(prevPages[currentPage - 2], currentPage - 1);
    }
  };

  // ... (keep your existing toggleSelectAll and toggleSelectContact functions)

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Contact List</h1>
      
      {/* Debug Panel (remove in production) */}
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
            nextPageUrl: nextPageUrl?.split('startAfter=')[1]?.substring(0, 20),
            loading
          }, null, 2)}
        </pre>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0' }}>
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1 || loading}
        >
          Previous
        </button>
        
        <div>
          Page {currentPage} of {Math.ceil(totalCount / limit)}
        </div>
        
        <button
          onClick={handleNextPage}
          disabled={!nextPageUrl || loading}
          style={{
            backgroundColor: nextPageUrl ? '#4CAF50' : '#cccccc',
            cursor: nextPageUrl ? 'pointer' : 'not-allowed'
          }}
        >
          Next
        </button>
      </div>

      {/* ... (rest of your existing UI) */}
    </div>
  );
}