import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Menu, Wifi, Home, Search, Camera, CheckCircle, XCircle, Move } from 'lucide-react';

export default function WireframeBoard() {
  const [githubConfig, setGithubConfig] = useState({
    token: localStorage.getItem('github_token') || '',
    owner: localStorage.getItem('github_owner') || '',
    repo: localStorage.getItem('github_repo') || '',
    path: 'api-cards.json'
  });
  const [showGithubSetup, setShowGithubSetup] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');

  const [screens, setScreens] = useState([
    { id: 1, x: 100, y: 100, title: 'Login', type: 'login' },
    { id: 2, x: 350, y: 100, title: 'Selection', type: 'selection' },
    { id: 3, x: 650, y: 100, title: 'Scan', type: 'scan' },
    { id: 4, x: 900, y: 100, title: 'Scan Results (Valid)', type: 'scan-valid' },
    { id: 5, x: 1150, y: 100, title: 'Scan Results (Invalid)', type: 'scan-invalid' },
    { id: 6, x: 650, y: 450, title: 'Scan w/ no criteria', type: 'direct-scan' },
    { id: 7, x: 900, y: 450, title: 'Toast message', type: 'toast' },
    { id: 8, x: 1150, y: 450, title: 'Scan w/ no criteria (Results)', type: 'direct-scan-results' },
    { id: 9, x: 650, y: 800, title: 'Verify using name', type: 'verify-input' },
    { id: 10, x: 900, y: 800, title: 'Verify using name (Search)', type: 'verify-search' },
    { id: 11, x: 1150, y: 800, title: 'Verify using name (Detail)', type: 'verify-detail' },
    { id: 12, x: 900, y: 1150, title: 'Error Message', type: 'error' },
  ]);

  const [apiCards, setApiCards] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [showApiForm, setShowApiForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [draggingCard, setDraggingCard] = useState(null);
  const [cardDragOffset, setCardDragOffset] = useState({ x: 0, y: 0 });
  const [drawingArrow, setDrawingArrow] = useState(null);
  const [arrowStart, setArrowStart] = useState(null);
  const [arrowEnd, setArrowEnd] = useState(null);
  const [tempArrowEnd, setTempArrowEnd] = useState(null);
  const [apiFormData, setApiFormData] = useState({
    endpoint: '',
    method: 'POST',
    payload: '',
    response: '',
    status: 'available',
    arrowTo: null
  });

  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const boardRef = useRef(null);

  // Load cards from GitHub on mount
  useEffect(() => {
    if (githubConfig.token && githubConfig.owner && githubConfig.repo) {
      loadFromGitHub();
      // Auto-sync every 30 seconds
      const interval = setInterval(loadFromGitHub, 30000);
      return () => clearInterval(interval);
    }
  }, [githubConfig.token, githubConfig.owner, githubConfig.repo]);

  const saveGithubConfig = (config) => {
    localStorage.setItem('github_token', config.token);
    localStorage.setItem('github_owner', config.owner);
    localStorage.setItem('github_repo', config.repo);
    setGithubConfig(config);
  };

  const loadFromGitHub = async () => {
    if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.path}`,
        {
          headers: {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const content = JSON.parse(atob(data.content));
        setApiCards(content.cards || []);
        setLastSyncTime(new Date());
        setSyncStatus('✓ Synced');
        setTimeout(() => setSyncStatus(''), 3000);
      } else if (response.status === 404) {
        // File doesn't exist yet, create it
        await saveToGitHub([]);
      }
    } catch (error) {
      console.error('Error loading from GitHub:', error);
      setSyncStatus('✗ Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToGitHub = async (cards) => {
    if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) return;
    
    setIsSyncing(true);
    try {
      // Get current file SHA if it exists
      let sha = null;
      try {
        const getResponse = await fetch(
          `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.path}`,
          {
            headers: {
              'Authorization': `token ${githubConfig.token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        if (getResponse.ok) {
          const getData = await getResponse.json();
          sha = getData.sha;
        }
      } catch (e) {}

      // Save file
      const content = btoa(JSON.stringify({ cards, lastUpdated: new Date().toISOString() }, null, 2));
      const response = await fetch(
        `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Update API cards - ${new Date().toLocaleString()}`,
            content: content,
            sha: sha
          })
        }
      );

      if (response.ok) {
        setLastSyncTime(new Date());
        setSyncStatus('✓ Saved to GitHub');
        setTimeout(() => setSyncStatus(''), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving to GitHub:', error);
      setSyncStatus('✗ Save failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.3, zoom + delta), 2);
    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    if (e.target === boardRef.current || e.target.closest('.board-container')) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && !draggingCard && !drawingArrow) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
    
    if (draggingCard) {
      const rect = boardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x - cardDragOffset.x) / zoom;
      const y = (e.clientY - rect.top - pan.y - cardDragOffset.y) / zoom;
      
      const updatedCards = apiCards.map(card =>
        card.id === draggingCard.id ? { ...card, x, y } : card
      );
      setApiCards(updatedCards);
    }
    
    if (drawingArrow && arrowStart) {
      const rect = boardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setTempArrowEnd({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (draggingCard) {
      saveToGitHub(apiCards);
      setDraggingCard(null);
    }
    if (drawingArrow && arrowStart && tempArrowEnd) {
      const updatedCards = apiCards.map(card =>
        card.id === drawingArrow.id 
          ? { ...card, arrowTo: tempArrowEnd }
          : card
      );
      setApiCards(updatedCards);
      saveToGitHub(updatedCards);
      setDrawingArrow(null);
      setArrowStart(null);
      setTempArrowEnd(null);
    }
    setIsPanning(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, dragStart, draggingCard, apiCards, pan, zoom, drawingArrow, arrowStart, tempArrowEnd]);

  const renderScreenContent = (screen) => {
    switch (screen.type) {
      case 'login':
        return (
          <div className="h-full flex flex-col items-center justify-between p-3">
            <div className="w-full flex justify-end"><div className="w-3 h-3 bg-gray-500 rounded-full"></div></div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="bg-white px-4 py-2 rounded mb-4">
                <div className="text-xs font-bold">NASCAR</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-sm">NASCAR</div>
                <div className="font-bold text-xs">Credential Scanning</div>
              </div>
            </div>
            <button className="bg-gray-600 text-white px-6 py-2 rounded text-xs font-bold w-full">
              NASCAR AUTHO LOGIN
            </button>
          </div>
        );
      
      case 'selection':
        return (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center justify-between mb-3">
              <Menu size={16} />
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <Wifi size={14} className="text-red-500" />
            </div>
            <div className="bg-white px-3 py-1 rounded mb-3 text-center">
              <div className="text-xs font-bold">NASCAR</div>
            </div>
            <div className="text-xs font-bold mb-1">Select Event</div>
            <select className="w-full border text-xs p-1 mb-2 rounded">
              <option>Select a series</option>
            </select>
            <select className="w-full border text-xs p-1 mb-3 rounded">
              <option>Select an event</option>
            </select>
            <div className="text-xs font-bold mb-1">Select Criteria</div>
            <div className="text-xs text-gray-600 mb-1">I am verifying access to ...</div>
            <div className="bg-white border rounded p-2 mb-2 max-h-24 overflow-auto">
              <div className="grid grid-cols-3 gap-1 text-xs">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <input type="checkbox" className="mr-1" />
                    <span className="text-xs">Option</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="bg-gray-500 text-white px-3 py-1 rounded text-xs mb-2 w-full">Set</button>
            <button className="border border-gray-300 px-3 py-1 rounded text-xs mb-1 w-full flex items-center justify-between">
              <span>Verify using name</span>
              <span>&gt;</span>
            </button>
            <button className="border border-gray-300 px-3 py-1 rounded text-xs w-full flex items-center justify-between">
              <span>Scan without criteria</span>
              <span>&gt;</span>
            </button>
          </div>
        );
      
      case 'scan':
        return (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center justify-between mb-3">
              <Menu size={16} />
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <Wifi size={14} className="text-red-500" />
            </div>
            <div className="bg-white px-3 py-1 rounded mb-3 text-center">
              <div className="text-xs font-bold">NASCAR</div>
            </div>
            <div className="text-center mb-2">
              <div className="text-sm font-bold">EVENT NAME</div>
              <div className="text-xs">location | Date</div>
              <div className="inline-block bg-red-500 text-white px-2 py-0.5 rounded text-xs mt-1">Race Control</div>
            </div>
            <div className="border-2 border-gray-400 rounded p-4 mb-3 flex flex-col items-center justify-center bg-white flex-1">
              <Camera size={32} className="text-gray-400 mb-2" />
              <div className="text-xs">Camera inactive</div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <button className="bg-white border-2 border-gray-300 px-6 py-1.5 rounded text-xs font-bold flex-1">SCAN</button>
              <div className="ml-2 text-center">
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mb-0.5">
                  <div className="text-xs">⟲</div>
                </div>
                <div className="text-xs">Sync</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">Use sync icon to manually update app data. Otherwise system syncs every minute when connectivity is available.</div>
            <div className="mt-2 flex justify-center">
              <Home size={16} className="text-gray-400" />
            </div>
          </div>
        );
      
      case 'scan-valid':
        return (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center justify-between mb-3">
              <Menu size={16} />
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <Wifi size={14} className="text-red-500" />
            </div>
            <div className="bg-white px-3 py-1 rounded mb-3 text-center">
              <div className="text-xs font-bold">NASCAR</div>
            </div>
            <div className="text-center mb-2">
              <div className="text-sm font-bold">EVENT NAME</div>
              <div className="text-xs">location | Date</div>
              <div className="inline-block bg-gray-500 text-white px-2 py-0.5 rounded text-xs mt-1">Race Control</div>
            </div>
            <div className="bg-white border-2 border-gray-300 rounded p-3 flex-1 overflow-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-black rounded-full mr-2"></div>
                  <div>
                    <div className="text-xs font-bold flex items-center">
                      CREDENTIAL
                      <CheckCircle size={14} className="text-green-500 ml-1" />
                    </div>
                    <div className="text-xs font-bold text-green-600">VALID</div>
                  </div>
                </div>
                <X size={16} />
              </div>
              <div className="text-xs font-bold mb-1">Jane Doe</div>
              <div className="flex gap-1 mb-2">
                <div className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">RC</div>
                <div className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">STAFF</div>
              </div>
              <div className="text-xs space-y-0.5">
                <div><span className="font-semibold">Series:</span> Cup</div>
                <div><span className="font-semibold">Pass type:</span> Weekend Staff</div>
                <div><span className="font-semibold">Credential:</span> Full season</div>
                <div><span className="font-semibold">Member ID:</span> 1234567</div>
                <div><span className="font-semibold">Affiliate:</span> Joe Gibbs Racing</div>
                <div><span className="font-semibold">Affiliate contact:</span> John Doe</div>
                <div><span className="font-semibold">Issue status:</span> Issued</div>
                <div><span className="font-semibold">Date of issue:</span> 12/28/25</div>
              </div>
            </div>
          </div>
        );
      
      case 'scan-invalid':
        return (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center justify-between mb-3">
              <Menu size={16} />
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <Wifi size={14} className="text-red-500" />
            </div>
            <div className="bg-white px-3 py-1 rounded mb-3 text-center">
              <div className="text-xs font-bold">NASCAR</div>
            </div>
            <div className="text-center mb-2">
              <div className="text-sm font-bold">EVENT NAME</div>
              <div className="text-xs">location | Date</div>
              <div className="inline-block bg-gray-500 text-white px-2 py-0.5 rounded text-xs mt-1">Race Control</div>
            </div>
            <div className="bg-white border-2 border-gray-300 rounded p-3 flex-1 overflow-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-black rounded-full mr-2"></div>
                  <div>
                    <div className="text-xs font-bold flex items-center">
                      CREDENTIAL
                      <XCircle size={14} className="text-red-500 ml-1" />
                    </div>
                    <div className="text-xs font-bold text-red-600">INVALID</div>
                  </div>
                </div>
                <X size={16} />
              </div>
              <div className="text-xs font-bold mb-1">Jane Doe</div>
              <div className="flex gap-1 mb-2">
                <div className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">STAFF</div>
              </div>
              <div className="text-xs space-y-0.5">
                <div><span className="font-semibold">Series:</span> Cup</div>
                <div><span className="font-semibold">Pass type:</span> Weekend Staff</div>
                <div><span className="font-semibold">Credential:</span> Full season</div>
                <div><span className="font-semibold">Member ID:</span> 1234567</div>
                <div><span className="font-semibold">Affiliate:</span> Joe Gibbs Racing</div>
                <div><span className="font-semibold">Affiliate contact:</span> John Doe</div>
                <div><span className="font-semibold">Issue status:</span> Issued</div>
                <div><span className="font-semibold">Date of issue:</span> 12/28/25</div>
              </div>
            </div>
          </div>
        );
      
      case 'direct-scan':
        return (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center justify-between mb-3">
              <Menu size={16} />
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <Wifi size={14} className="text-red-500" />
            </div>
            <div className="bg-white px-3 py-1 rounded mb-3 text-center">
              <div className="text-xs font-bold">NASCAR</div>
            </div>
            <div className="text-center mb-2">
              <div className="text-sm font-bold">DIRECT SCAN</div>
              <div className="text-xs">Scan to display credential information</div>
            </div>
            <div className="border-2 border-gray-400 rounded p-4 mb-3 flex flex-col items-center justify-center bg-white flex-1">
              <Camera size={32} className="text-gray-400 mb-2" />
              <div className="text-xs">Camera inactive</div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <button className="bg-white border-2 border-gray-300 px-6 py-1.5 rounded text-xs font-bold flex-1">SCAN</button>
              <div className="ml-2 text-center">
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mb-0.5">
                  <div className="text-xs">⟲</div>
                </div>
                <div className="text-xs">Sync</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">Use sync icon to manually update app data. Otherwise system syncs every minute when connectivity is available.</div>
            <div className="mt-2 flex justify-center">
              <Home size={16} className="text-gray-400" />
            </div>
          </div>
        );
      
      case 'toast':
        return (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center justify-between mb-3">
              <Menu size={16} />
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <Wifi size={14} className="text-red-500" />
            </div>
            <div className="bg-white px-3 py-1 rounded mb-3 text-center relative">
              <div className="text-xs font-bold">NASCAR</div>
              <div className="absolute -right-1 -top-1 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                <div className="text-xs">⟲</div>
              </div>
            </div>
            <div className="text-center mb-2">
              <div className="text-sm font-bold">DIRECT SCAN</div>
              <div className="text-xs">Scan to display credential information</div>
            </div>
            <div className="border-2 border-gray-400 rounded p-4 mb-3 flex flex-col items-center justify-center bg-white flex-1">
              <Camera size={32} className="text-gray-400 mb-2" />
              <div className="text-xs font-semibold">Sync complete</div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <button className="bg-white border-2 border-gray-300 px-6 py-1.5 rounded text-xs font-bold flex-1">SCAN</button>
              <div className="ml-2 text-center">
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mb-0.5">
                  <div className="text-xs">⟲</div>
                </div>
                <div className="text-xs">Sync</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">Use sync icon to manually update app data. Otherwise system syncs every minute when connectivity is available.</div>
            <div className="mt-2 flex justify-center">
              <Home size={16} className="text-gray-400" />
            </div>
          </div>
        );
      
      case 'direct-scan-results':
        return (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center justify-between mb-3">
              <Menu size={16} />
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <Wifi size={14} className="text-red-500" />
            </div>
            <div className="bg-white px-3 py-1 rounded mb-3 text-center">
              <div className="text-xs font-bold">NASCAR</div>
            </div>
            <div className="text-center mb-2">
              <div className="text-sm font-bold">DIRECT SCAN</div>
              <div className="text-xs">Scan to display credential information</div>
            </div>
            <div className="bg-white border-2 border-gray-300 rounded p-3 flex-1 overflow-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-black rounded-full"></div>
                <X size={16} />
              </div>
              <div className="text-xs font-bold mb-1">Jane Doe</div>
              <div className="flex gap-1 mb-2">
                <div className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">RC</div>
                <div className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">STAFF</div>
              </div>
              <div className="text-xs space-y-0.5">
                <div><span className="font-semibold">Series:</span> Cup</div>
                <div><span className="font-semibold">Pass type:</span> Weekend Staff</div>
                <div><span className="font-semibold">Credential:</span> Full season</div>
                <div><span className="font-semibold">Member ID:</span> 1234567</div>
                <div><span className="font-semibold">Affiliate:</span> Joe Gibbs Racing</div>
                <div><span className="font-semibold">Affiliate contact:</span> John Doe</div>
                <div><span className="font-semibold">Issue status:</span> Issued</div>
                <div><span className="font-semibold">Date of issue:</span> 12/28/25</div>
              </div>
            </div>
            <div className="mt-2 flex justify-center">
              <Home size={16} className="text-gray-400" />
            </div>
          </div>
        );
      
      case 'verify-input':
        return (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center justify-between mb-3">
              <Menu size={16} />
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <Wifi size={14} className="text-red-500" />
            </div>
            <div className="bg-white px-3 py-1 rounded mb-3 text-center">
              <div className="text-xs font-bold">NASCAR</div>
            </div>
            <div className="text-center mb-2">
              <div className="text-sm font-bold">Verify Using Name</div>
              <div className="text-xs">Enter credential holder's name</div>
            </div>
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="first name, last name"
                className="w-full border border-gray-300 rounded px-3 py-2 text-xs"
              />
              <Search size={14} className="absolute right-2 top-2 text-gray-400" />
            </div>
            <div className="flex-1"></div>
            <div className="mt-2 flex justify-center">
              <Home size={16} className="text-gray-400" />
            </div>
          </div>
        );
      
      case 'verify-search':
        return (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center justify-between mb-3">
              <Menu size={16} />
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <Wifi size={14} className="text-red-500" />
            </div>
            <div className="bg-white px-3 py-1 rounded mb-3 text-center">
              <div className="text-xs font-bold">NASCAR</div>
            </div>
            <div className="text-center mb-2">
              <div className="text-sm font-bold">Verify Using Name</div>
              <div className="text-xs flex items-center justify-center">
                Enter credential holder's name
                <div className="ml-2 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                  <div className="text-xs">⟲</div>
                </div>
              </div>
            </div>
            <div className="relative mb-3">
              <input 
                type="text" 
                placeholder="first name, last name"
                className="w-full border border-gray-300 rounded px-3 py-2 text-xs"
              />
              <Search size={14} className="absolute right-2 top-2 text-gray-400" />
            </div>
            <div className="space-y-2 flex-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-gray-200 rounded p-2">
                  <div className="text-xs font-semibold">Jane Doe, pass type</div>
                  <div className="text-xs text-gray-600">Event name | affiliate name</div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-center">
              <Home size={16} className="text-gray-400" />
            </div>
          </div>
        );
      
      case 'verify-detail':
        return (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center justify-between mb-3">
              <Menu size={16} />
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <Wifi size={14} className="text-red-500" />
            </div>
            <div className="bg-white px-3 py-1 rounded mb-3 text-center">
              <div className="text-xs font-bold">NASCAR</div>
            </div>
            <div className="text-center mb-2">
              <div className="text-sm font-bold">Verify Using Name</div>
              <div className="text-xs">Enter credential holder's name</div>
            </div>
            <div className="bg-white border-2 border-gray-300 rounded p-3 flex-1 overflow-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-black rounded-full"></div>
                <X size={16} />
              </div>
              <div className="text-xs font-bold mb-1">Jane Doe</div>
              <div className="flex gap-1 mb-2">
                <div className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">RC</div>
                <div className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">STAFF</div>
              </div>
              <div className="text-xs space-y-0.5">
                <div><span className="font-semibold">Series:</span> Cup</div>
                <div><span className="font-semibold">Pass type:</span> Weekend Staff</div>
                <div><span className="font-semibold">Credential:</span> Full season</div>
                <div><span className="font-semibold">Member ID:</span> 1234567</div>
                <div><span className="font-semibold">Affiliate:</span> Joe Gibbs Racing</div>
                <div><span className="font-semibold">Affiliate contact:</span> John Doe</div>
                <div><span className="font-semibold">Issue status:</span> Issued</div>
                <div><span className="font-semibold">Date of issue:</span> 12/28/25</div>
              </div>
            </div>
            <div className="mt-2 flex justify-center">
              <Home size={16} className="text-gray-400" />
            </div>
          </div>
        );
      
      case 'error':
        return (
          <div className="h-full flex flex-col p-3">
            <div className="flex items-center justify-between mb-3">
              <Menu size={16} />
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <Wifi size={14} className="text-red-500" />
            </div>
            <div className="bg-white px-3 py-1 rounded mb-3 text-center">
              <div className="text-xs font-bold">NASCAR</div>
            </div>
            <div className="text-center mb-2">
              <div className="text-sm font-bold">EVENT NAME</div>
              <div className="text-xs">location | Date</div>
              <div className="inline-block bg-gray-500 text-white px-2 py-0.5 rounded text-xs mt-1">Race Control</div>
            </div>
            <div className="bg-white border-2 border-gray-300 rounded p-3 flex-1">
              <div className="flex items-center justify-between mb-3">
                <div></div>
                <X size={16} />
              </div>
              <div className="text-center mb-3">
                <div className="flex items-center justify-center mb-2">
                  <div className="text-xs font-bold mr-2">CREDENTIAL</div>
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <X size={16} className="text-white" />
                  </div>
                </div>
                <div className="text-xs font-bold">NOT FOUND</div>
              </div>
              <div className="text-xs text-center mb-3">
                Credential does not exist in NASCAR systems
              </div>
              <div className="text-xs mb-2">
                <div className="font-semibold">App last synced to systems:</div>
                <div>today at 1:43 p.m.</div>
              </div>
              <div className="text-xs">
                <div className="font-semibold">Note:</div>
                <div>If this credential was recently issued, try connecting to Wi-Fi or cellular data to sync the latest updates.</div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="h-full flex items-center justify-center text-gray-400 text-xs">
            Screen Content
          </div>
        );
    }
  };

  const handleScreenClick = (screen) => {
    setSelectedScreen(screen);
    setShowApiForm(true);
    setEditingCard(null);
    setApiFormData({ endpoint: '', method: 'POST', payload: '', response: '', status: 'available', arrowTo: null });
  };

  const handleAddApiCard = () => {
    if (!selectedScreen || !apiFormData.endpoint) return;

    const newCard = {
      id: Date.now(),
      screenId: selectedScreen.id,
      x: selectedScreen.x + 200,
      y: selectedScreen.y - 60,
      ...apiFormData
    };

    setApiCards([...apiCards, newCard]);
    setShowApiForm(false);
    setApiFormData({ endpoint: '', method: 'POST', payload: '' });
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setApiFormData({
      endpoint: card.endpoint,
      method: card.method,
      payload: card.payload,
      response: card.response || '',
      status: card.status || 'available',
      arrowTo: card.arrowTo || null
    });
    setShowApiForm(true);
  };

  const handleUpdateCard = () => {
    if (!editingCard) return;

    const updatedCards = apiCards.map(card => 
      card.id === editingCard.id 
        ? { ...card, ...apiFormData }
        : card
    );
    setApiCards(updatedCards);
    saveToGitHub(updatedCards);
    setShowApiForm(false);
    setEditingCard(null);
    setApiFormData({ endpoint: '', method: 'POST', payload: '', response: '', status: 'available', arrowTo: null });
  };

  const handleDeleteCard = (cardId) => {
    const updatedCards = apiCards.filter(card => card.id !== cardId);
    setApiCards(updatedCards);
    saveToGitHub(updatedCards);
  };

  const toggleCardExpanded = (cardId, e) => {
    if (e) e.stopPropagation();
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const handleCardMouseDown = (e, card) => {
    if (e.target.closest('.no-drag')) return;
    e.stopPropagation();
    const rect = boardRef.current.getBoundingClientRect();
    setCardDragOffset({
      x: (e.clientX - rect.left - pan.x) / zoom - card.x,
      y: (e.clientY - rect.top - pan.y) / zoom - card.y
    });
    setDraggingCard(card);
  };

  const startDrawingArrow = (e, card) => {
    e.stopPropagation();
    setDrawingArrow(card);
    setArrowStart({ x: card.x + 110, y: card.y + 40 });
  };

  const removeArrow = (cardId, e) => {
    e.stopPropagation();
    const updatedCards = apiCards.map(card =>
      card.id === cardId ? { ...card, arrowTo: null } : card
    );
    setApiCards(updatedCards);
    saveToGitHub(updatedCards);
  };

  return (
    <div className="w-full h-screen bg-gray-50 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-4 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-red-600">NASCAR CSA - Credential Scanning Application Wireframes</h1>
            <p className="text-sm text-gray-600 mt-1">Click on any screen to add API endpoint information</p>
          </div>
          <div className="flex items-center gap-3">
            {lastSyncTime && (
              <div className="text-xs text-gray-500">
                Last sync: {lastSyncTime.toLocaleTimeString()}
              </div>
            )}
            {syncStatus && (
              <div className="text-xs font-semibold text-green-600">
                {syncStatus}
              </div>
            )}
            {isSyncing && (
              <div className="text-xs text-blue-600">Syncing...</div>
            )}
            <button
              onClick={() => setShowGithubSetup(true)}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub Setup
            </button>
            <button
              onClick={loadFromGitHub}
              disabled={isSyncing || !githubConfig.token}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm disabled:bg-gray-400"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="absolute top-20 right-6 bg-white border border-gray-200 rounded-lg p-2 z-20 shadow-lg">
        <button 
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          className="block px-3 py-1 hover:bg-gray-100 rounded"
        >
          +
        </button>
        <div className="text-center py-1 text-sm">{Math.round(zoom * 100)}%</div>
        <button 
          onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
          className="block px-3 py-1 hover:bg-gray-100 rounded"
        >
          −
        </button>
      </div>

      <div 
        ref={boardRef}
        className="board-container w-full h-full pt-24"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div 
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '2500px',
            height: '2000px',
            position: 'relative'
          }}
        >
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '2500px', height: '2000px', zIndex: 10 }}>
            {/* Screen connection lines */}
            <line x1="220" y1="200" x2="350" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <line x1="500" y1="200" x2="650" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <line x1="770" y1="200" x2="900" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <line x1="1020" y1="200" x2="1150" y2="200" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
            
            <line x1="470" y1="300" x2="710" y2="450" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <line x1="770" y1="550" x2="900" y2="550" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <line x1="1020" y1="550" x2="1150" y2="550" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
            
            <line x1="470" y1="300" x2="710" y2="800" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <line x1="770" y1="900" x2="900" y2="900" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <line x1="1020" y1="900" x2="1150" y2="900" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
            
            <line x1="1020" y1="300" x2="1020" y2="1150" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)" />
            
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#666" />
              </marker>
              <marker id="redArrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#EF4444" />
              </marker>
            </defs>
          </svg>

          {/* Screens */}
          {screens.map(screen => (
            <div
              key={screen.id}
              onClick={() => handleScreenClick(screen)}
              className="absolute bg-gray-200 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow border-4 border-gray-400 overflow-hidden"
              style={{
                left: `${screen.x}px`,
                top: `${screen.y}px`,
                width: '170px',
                height: '300px',
                zIndex: 5
              }}
            >
              <div className="absolute -top-9 left-0 bg-gray-800 text-white px-3 py-1 rounded-t text-xs font-bold">
                {screen.title}
              </div>
              {renderScreenContent(screen)}
            </div>
          ))}

          {/* API Card arrows - rendered on top */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '2500px', height: '2000px', zIndex: 15 }}>
            
            {/* API Card arrows */}
            {apiCards.map(card => {
              if (card.arrowTo) {
                return (
                  <g key={`arrow-${card.id}`}>
                    <line 
                      x1={card.x + 110} 
                      y1={card.y + 40} 
                      x2={card.arrowTo.x} 
                      y2={card.arrowTo.y} 
                      stroke="#EF4444" 
                      strokeWidth="3" 
                      markerEnd="url(#redArrowhead)"
                      strokeDasharray="5,5"
                    />
                    <circle cx={card.x + 110} cy={card.y + 40} r="4" fill="#EF4444" />
                    <circle cx={card.arrowTo.x} cy={card.arrowTo.y} r="6" fill="#EF4444" />
                  </g>
                );
              }
              return null;
            })}
            
            {/* Temporary arrow while drawing */}
            {drawingArrow && arrowStart && tempArrowEnd && (
              <g>
                <line 
                  x1={arrowStart.x} 
                  y1={arrowStart.y} 
                  x2={tempArrowEnd.x} 
                  y2={tempArrowEnd.y} 
                  stroke="#EF4444" 
                  strokeWidth="3" 
                  markerEnd="url(#redArrowhead)"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
                <circle cx={arrowStart.x} cy={arrowStart.y} r="4" fill="#EF4444" />
              </g>
            )}
            
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#666" />
              </marker>
              <marker id="redArrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#EF4444" />
              </marker>
            </defs>
          </svg>

          {screens.map(screen => (
            <div
              key={screen.id}
              onClick={() => handleScreenClick(screen)}
              className="absolute bg-gray-200 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow border-4 border-gray-400 overflow-hidden"
              style={{
                left: `${screen.x}px`,
                top: `${screen.y}px`,
                width: '170px',
                height: '300px'
              }}
            >
              <div className="absolute -top-9 left-0 bg-gray-800 text-white px-3 py-1 rounded-t text-xs font-bold">
                {screen.title}
              </div>
              {renderScreenContent(screen)}
            </div>
          ))}

          {apiCards.map(card => {
            const statusColors = {
              available: 'bg-green-500',
              'not-available': 'bg-red-500',
              'in-progress': 'bg-orange-500'
            };
            const statusLabels = {
              available: 'Available',
              'not-available': 'Not Available',
              'in-progress': 'In Progress'
            };
            
            const isExpanded = expandedCards[card.id];
            
            return (
            <div
              key={card.id}
              className="absolute bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow"
              style={{
                left: `${card.x}px`,
                top: `${card.y}px`,
                width: '220px',
                minHeight: isExpanded ? '120px' : '80px',
                cursor: draggingCard?.id === card.id ? 'grabbing' : 'grab',
                zIndex: draggingCard?.id === card.id ? 1000 : 20
              }}
              onMouseDown={(e) => handleCardMouseDown(e, card)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <Move size={14} className="text-gray-400 cursor-grab" />
                  <span className="text-xs font-bold text-blue-600">{card.method}</span>
                  <span className={`${statusColors[card.status]} text-white px-2 py-0.5 rounded text-xs font-semibold`}>
                    {statusLabels[card.status]}
                  </span>
                </div>
                <div className="flex gap-1 no-drag">
                  {card.arrowTo ? (
                    <button
                      onClick={(e) => removeArrow(card.id, e)}
                      className="p-1 hover:bg-red-200 rounded"
                      title="Remove arrow"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => startDrawingArrow(e, card)}
                      className="p-1 hover:bg-blue-200 rounded"
                      title="Draw arrow to element"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => toggleCardExpanded(card.id, e)}
                    className="p-1 hover:bg-yellow-200 rounded"
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCard(card);
                    }}
                    className="p-1 hover:bg-yellow-200 rounded"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCard(card.id);
                    }}
                    className="p-1 hover:bg-red-200 rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              
              <div className="text-xs font-mono break-all mb-2 font-semibold">{card.endpoint}</div>
              
              {isExpanded && (
                <>
                  {card.payload && (
                    <div className="text-xs text-gray-700 mt-2">
                      <div className="font-semibold mb-1">Payload:</div>
                      <pre className="text-xs overflow-auto max-h-20 bg-yellow-50 p-2 rounded border border-yellow-300">{card.payload}</pre>
                    </div>
                  )}
                  {card.response && (
                    <div className="text-xs text-gray-700 mt-2">
                      <div className="font-semibold mb-1">Response:</div>
                      <pre className="text-xs overflow-auto max-h-20 bg-yellow-50 p-2 rounded border border-yellow-300">{card.response}</pre>
                    </div>
                  )}
                </>
              )}
              
              {!isExpanded && (card.payload || card.response) && (
                <div 
                  className="text-xs text-gray-500 italic cursor-pointer hover:text-gray-700 no-drag"
                  onClick={(e) => toggleCardExpanded(card.id, e)}
                >
                  Click ▼ to view details
                </div>
              )}
            </div>
          )})}

        </div>
      </div>

      {showApiForm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto shadow-xl">
            <h3 className="text-lg font-bold mb-4">
              {editingCard ? 'Edit API Card' : `Add API Card for ${selectedScreen?.title}`}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">HTTP Method</label>
                <select
                  value={apiFormData.method}
                  onChange={(e) => setApiFormData({ ...apiFormData, method: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                  <option>PATCH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={apiFormData.status}
                  onChange={(e) => setApiFormData({ ...apiFormData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="available">✓ Available (Green)</option>
                  <option value="not-available">✗ Not Available (Red)</option>
                  <option value="in-progress">◐ In Progress (Orange)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">API Endpoint URL</label>
                <input
                  type="text"
                  value={apiFormData.endpoint}
                  onChange={(e) => setApiFormData({ ...apiFormData, endpoint: e.target.value })}
                  placeholder="/api/v1/scan"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payload (JSON)</label>
                <textarea
                  value={apiFormData.payload}
                  onChange={(e) => setApiFormData({ ...apiFormData, payload: e.target.value })}
                  placeholder={'{\n  "key": "value"\n}'}
                  className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                  rows="6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Response (JSON)</label>
                <textarea
                  value={apiFormData.response}
                  onChange={(e) => setApiFormData({ ...apiFormData, response: e.target.value })}
                  placeholder={'{\n  "status": "success",\n  "data": {...}\n}'}
                  className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                  rows="6"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={editingCard ? handleUpdateCard : handleAddApiCard}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {editingCard ? 'Update' : 'Add Card'}
                </button>
                <button
                  onClick={() => {
                    setShowApiForm(false);
                    setEditingCard(null);
                    setApiFormData({ endpoint: '', method: 'POST', payload: '', response: '', status: 'available' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Setup Modal */}
      {showGithubSetup && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto shadow-xl">
            <h3 className="text-lg font-bold mb-4">GitHub Repository Setup</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <div className="font-semibold mb-2">How to get GitHub Token:</div>
                <ol className="list-decimal ml-4 space-y-1 text-xs">
                  <li>Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)</li>
                  <li>Click "Generate new token (classic)"</li>
                  <li>Give it a name like "NASCAR Wireframe App"</li>
                  <li>Select scope: <code className="bg-white px-1 rounded">repo</code> (full control of private repositories)</li>
                  <li>Click "Generate token" and copy it</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">GitHub Personal Access Token</label>
                <input
                  type="password"
                  value={githubConfig.token}
                  onChange={(e) => setGithubConfig({ ...githubConfig, token: e.target.value })}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Repository Owner (username or org)</label>
                <input
                  type="text"
                  value={githubConfig.owner}
                  onChange={(e) => setGithubConfig({ ...githubConfig, owner: e.target.value })}
                  placeholder="your-username"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Repository Name</label>
                <input
                  type="text"
                  value={githubConfig.repo}
                  onChange={(e) => setGithubConfig({ ...githubConfig, repo: e.target.value })}
                  placeholder="nascar-wireframe-board"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">File Path</label>
                <input
                  type="text"
                  value={githubConfig.path}
                  onChange={(e) => setGithubConfig({ ...githubConfig, path: e.target.value })}
                  placeholder="api-cards.json"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                <div className="font-semibold mb-1">⚠️ Important:</div>
                <ul className="list-disc ml-4 space-y-1 text-xs">
                  <li>Your token is stored in browser localStorage</li>
                  <li>Keep your token secure - don't share it</li>
                  <li>All team members need their own tokens with access to the same repo</li>
                  <li>Cards auto-sync every 30 seconds</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    saveGithubConfig(githubConfig);
                    setShowGithubSetup(false);
                    loadFromGitHub();
                  }}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Save & Connect
                </button>
                <button
                  onClick={() => setShowGithubSetup(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}