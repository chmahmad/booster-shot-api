import { useEffect, useState } from 'react';

export default function Home() {
  const [locationId, setLocationId] = useState(null);
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [smsText, setSmsText] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locId = params.get('location_id');
    setLocationId(locId);
  }, []);

  // Mock fetch contacts function - replace with your real API call
  async function fetchContacts() {
    // Example fetch call: replace with your API endpoint
    const response = await fetch('/api/get-contacts');
    if (response.ok) {
      const data = await response.json();
      return data.contacts || [];
    }
    return [];
  }

  async function handleLoadContacts() {
    if (!showContacts) {
      const fetchedContacts = await fetchContacts();
      setContacts(fetchedContacts);
      setShowContacts(true);
    } else {
      setShowContacts(false);
    }
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedContacts(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(contacts.map(c => c.id));
      setSelectedContacts(allIds);
      setSelectAll(true);
    }
  }

  function toggleContactSelection(contactId) {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
    setSelectAll(newSelected.size === contacts.length);
  }

  function handleLaunchCampaign() {
    alert(`Launching campaign with ${selectedContacts.size} contacts.\nMessage: ${smsText}`);
    // TODO: Implement campaign launch logic here
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>🚀 Booster Shot Campaign Launcher</h1>
      {locationId ? (
        <>
          <p><strong>Subaccount ID:</strong> {locationId}</p>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <label htmlFor="smsText" style={{ flexGrow: 1 }}>
              <strong>SMS/Text</strong><br />
              <textarea
                id="smsText"
                rows={4}
                style={{ width: '100%', fontSize: 16 }}
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
              />
            </label>
            <button
              onClick={handleLaunchCampaign}
              style={{ marginLeft: 20, padding: '10px 20px', fontSize: 16, height: 90, alignSelf: 'flex-start' }}
            >
              Launch Campaign
            </button>
          </div>

          <div>
            <button 
              onClick={handleLoadContacts} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'blue', 
                textDecoration: 'underline', 
                cursor: 'pointer', 
                fontSize: 18,
                marginBottom: 10
              }}
            >
              Select Campaign Contacts
            </button>

            {showContacts && (
              <div style={{ border: '1px solid #ddd', padding: 10, maxHeight: 400, overflowY: 'auto' }}>
                <div style={{ marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    id="selectAllCheckbox"
                  />
                  <label htmlFor="selectAllCheckbox" style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    Select All
                  </label>
                </div>

                {contacts.length === 0 ? (
                  <p>No contacts found.</p>
                ) : (
                  contacts.map(contact => (
                    <div key={contact.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.id)}
                        onChange={() => toggleContactSelection(contact.id)}
                        id={`contact_${contact.id}`}
                      />
                      <label htmlFor={`contact_${contact.id}`} style={{ marginLeft: 8 }}>
                        {contact.name || 'No Name'} — {contact.email || 'No Email'} — {contact.phone || 'No Phone'}
                      </label>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <p>Loading subaccount ID...</p>
      )}
    </div>
  );
}
