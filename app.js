const { useState, useRef, useEffect } = React;
const { Camera, MapPin, MessageCircle, Database, X, Upload, Navigation, Download, Share2, Trash2 } = lucide;

const ArtifactScannerApp = () => {
  const [view, setView] = useState('scan');
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    loadArtifacts();
    checkInstallPrompt();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (artifacts.length > 0) {
      saveArtifacts();
    }
  }, [artifacts, chatMessages]);

  const checkInstallPrompt = () => {
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(true);
    }
  };

  const loadArtifacts = () => {
    try {
      const stored = localStorage.getItem('artifacts-database');
      if (stored) {
        const data = JSON.parse(stored);
        setArtifacts(data.artifacts || []);
        setChatMessages(data.chatMessages || {});
      }
    } catch (error) {
      console.log('Starting fresh database');
    }
  };

  const saveArtifacts = () => {
    try {
      localStorage.setItem('artifacts-database', JSON.stringify({
        artifacts,
        chatMessages
      }));
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Location error:', error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (error) {
      console.error('Camera error:', error);
      alert('Camera access denied or unavailable. Please use upload instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      await processImage(blob);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await processImage(file);
    }
  };

  const processImage = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const location = await getUserLocation();
        const newArtifact = {
          id: Date.now().toString(),
          image: e.target.result,
          location: location,
          timestamp: new Date().toISOString(),
          name: `Artifact ${artifacts.length + 1}`,
          description: '',
          tags: []
        };
        setArtifacts(prev => [...prev, newArtifact]);
        setChatMessages(prev => ({ ...prev, [newArtifact.id]: [] }));
        
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        alert('✓ Artifact scanned and saved successfully!');
      } catch (error) {
        const newArtifact = {
          id: Date.now().toString(),
          image: e.target.result,
          location: null,
          timestamp: new Date().toISOString(),
          name: `Artifact ${artifacts.length + 1}`,
          description: '',
          tags: []
        };
        setArtifacts(prev => [...prev, newArtifact]);
        setChatMessages(prev => ({ ...prev, [newArtifact.id]: [] }));
        alert('✓ Artifact saved (location unavailable)');
      }
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedArtifact) return;
    
    const message = {
      id: Date.now().toString(),
      text: newMessage,
      timestamp: new Date().toISOString(),
      user: 'You'
    };
    
    setChatMessages(prev => ({
      ...prev,
      [selectedArtifact.id]: [...(prev[selectedArtifact.id] || []), message]
    }));
    setNewMessage('');
  };

  const deleteArtifact = (id) => {
    if (confirm('Are you sure you want to delete this artifact? This cannot be undone.')) {
      setArtifacts(prev => prev.filter(a => a.id !== id));
      setChatMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[id];
        return newMessages;
      });
      if (selectedArtifact?.id === id) {
        setSelectedArtifact(null);
      }
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ artifacts, chatMessages }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `artifact-scanner-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareArtifact = async (artifact) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: artifact.name,
          text: `Check out this artifact I found!`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      alert('Sharing not supported on this device');
    }
  };

  const renderScanView = () => (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {showInstallPrompt && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 max-w-md">
          <div className="flex items-start gap-2">
            <Download className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Install App</p>
              <p className="text-xs text-blue-700 mt-1">
                Add to home screen for the best experience!
              </p>
            </div>
            <button onClick={() => setShowInstallPrompt(false)} className="text-blue-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {cameraActive ? (
        <div className="w-full max-w-2xl">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={capturePhoto}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Capture Photo
            </button>
            <button
              onClick={stopCamera}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <Camera className="w-24 h-24 mx-auto mb-6 text-blue-600" />
          <h2 className="text-3xl font-bold text-center mb-3">Scan Artifact</h2>
          <p className="text-gray-600 text-center mb-6">
            Capture or upload a photo to document and track your archaeological finds
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <div className="space-y-3">
            <button
              onClick={startCamera}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold transition"
            >
              <Camera size={20} />
              Open Camera
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 font-semibold transition"
            >
              <Upload size={20} />
              Upload Photo
            </button>
          </div>
          {artifacts.length > 0 && (
            <button
              onClick={exportData}
              className="w-full mt-4 border-2 border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
            >
              <Download size={16} />
              Export Backup
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderDatabaseView = () => (
    <div className="h-full overflow-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database size={28} />
          Collection ({artifacts.length})
        </h2>
        {artifacts.length > 0 && (
          <button
            onClick={exportData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            Export
          </button>
        )}
      </div>
      {artifacts.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <Database size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">No artifacts yet</p>
          <p className="text-sm">Start scanning to build your collection</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {artifacts.map(artifact => (
            <div key={artifact.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
              <img src={artifact.image} alt={artifact.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{artifact.name}</h3>
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <p className="flex items-center gap-1">
                    <MapPin size={14} />
                    {artifact.location 
                      ? `${artifact.location.lat.toFixed(4)}, ${artifact.location.lng.toFixed(4)}`
                      : 'Location unavailable'}
                  </p>
                  <p>{new Date(artifact.timestamp).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedArtifact(artifact);
                      setView('chat');
                    }}
                    className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-1 text-sm"
                  >
                    <MessageCircle size={14} />
                    Chat
                  </button>
                  <button
                    onClick={() => {
                      setSelectedArtifact(artifact);
                      setView('map');
                    }}
                    className="bg-green-600 text-white py-2 rounded hover:bg-green-700 flex items-center justify-center gap-1 text-sm"
                  >
                    <MapPin size={14} />
                    Map
                  </button>
                  <button
                    onClick={() => shareArtifact(artifact)}
                    className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700 flex items-center justify-center gap-1 text-sm"
                  >
                    <Share2 size={14} />
                    Share
                  </button>
                  <button
                    onClick={() => deleteArtifact(artifact.id)}
                    className="bg-red-600 text-white py-2 rounded hover:bg-red-700 flex items-center justify-center gap-1 text-sm"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMapView = () => {
    const artifact = selectedArtifact;
    if (!artifact) return null;

    return (
      <div className="h-full flex flex-col">
        <div className="bg-white shadow-md p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPin size={24} className="text-green-600" />
            Location Details
          </h2>
          <button onClick={() => setView('database')} className="text-gray-600 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          {artifact.location ? (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
              <img src={artifact.image} alt={artifact.name} className="w-full h-64 object-cover rounded-lg mb-4 shadow" />
              <h3 className="font-bold text-2xl mb-2">{artifact.name}</h3>
              <p className="text-sm text-gray-600 mb-4">Discovered: {new Date(artifact.timestamp).toLocaleString()}</p>
              
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 mb-4">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Navigation size={20} className="text-green-600" />
                  GPS Coordinates
                </h4>
                <div className="space-y-2 font-mono text-sm">
                  <p><span className="font-semibold">Latitude:</span> {artifact.location.lat.toFixed(6)}°</p>
                  <p><span className="font-semibold">Longitude:</span> {artifact.location.lng.toFixed(6)}°</p>
                  {artifact.location.accuracy && (
                    <p><span className="font-semibold">Accuracy:</span> ±{artifact.location.accuracy.toFixed(0)}m</p>
                  )}
                </div>
              </div>

              <a
                href={`https://www.google.com/maps?q=${artifact.location.lat},${artifact.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-600 text-white text-center px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition"
              >
                Open in Google Maps →
              </a>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-20">
              <MapPin size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Location Unavailable</p>
              <p className="text-sm mt-2">GPS data was not captured for this artifact</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChatView = () => {
    const artifact = selectedArtifact;
    if (!artifact) return null;

    const messages = chatMessages[artifact.id] || [];

    return (
      <div className="h-full flex flex-col">
        <div className="bg-white shadow-md p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle size={24} className="text-blue-600" />
            {artifact.name}
          </h2>
          <button onClick={() => setView('database')} className="text-gray-600 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <img src={artifact.image} alt={artifact.name} className="w-full h-40 object-cover rounded-lg mb-3" />
            <p className="text-sm text-gray-600">
              <MapPin size={12} className="inline mr-1" />
              {artifact.location 
                ? `${artifact.location.lat.toFixed(4)}, ${artifact.location.lng.toFixed(4)}`
                : 'Location unknown'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{new Date(artifact.timestamp).toLocaleString()}</p>
          </div>
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-12">
              <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm mt-1">Share your thoughts about this artifact</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="bg-white rounded-lg p-3 shadow">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm text-blue-600">{msg.user}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-800">{msg.text}</p>
              </div>
            ))
          )}
        </div>
        <div className="bg-white border-t p-4 shadow-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Add a note or observation..."
              className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center tracking-wide">📸 Artifact Scanner</h1>
      </header>
      
      <main className="flex-1 overflow-hidden">
        {view === 'scan' && renderScanView()}
        {view === 'database' && renderDatabaseView()}
        {view === 'map' && renderMapView()}
        {view === 'chat' && renderChatView()}
      </main>

      <nav className="bg-white border-t shadow-lg flex">
        <button
          onClick={() => setView('scan')}
          className={`flex-1 py-4 flex flex-col items-center gap-1 transition ${
            view === 'scan' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Camera size={24} />
          <span className="text-xs font-semibold">Scan</span>
        </button>
        <button
          onClick={() => setView('database')}
          className={`flex-1 py-4 flex flex-col items-center gap-1 transition ${
            view === 'database' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Database size={24} />
          <span className="text-xs font-semibold">Collection</span>
        </button>
      </nav>
    </div>
  );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ArtifactScannerApp />);
