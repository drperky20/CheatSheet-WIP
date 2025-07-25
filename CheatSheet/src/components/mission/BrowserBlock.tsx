'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  ArrowLeft, 
  ArrowRight, 
  Globe, 
  Maximize2, 
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';

interface BrowserBlockProps {
  sessionId: string;
}

export function BrowserBlock({ sessionId }: BrowserBlockProps) {
  const [url, setUrl] = useState('https://example.com');
  const [title, setTitle] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  // const iframeRef = useRef<HTMLIFrameElement>(null); // Currently unused - for future VNC integration

  // Mock browser state for development
  useEffect(() => {
    // In production, this would connect to the browser MCP server
    // and receive real-time updates about the browser state
    
    const mockUrls = [
      'https://www.google.com/search?q=quantum+computing+research',
      'https://arxiv.org/search/?query=quantum+computing',
      'https://www.nature.com/subjects/quantum-physics'
    ];
    
    const simulateBrowsing = () => {
      const randomUrl = mockUrls[Math.floor(Math.random() * mockUrls.length)];
      setUrl(randomUrl);
      setTitle(`Research: ${randomUrl.split('/')[2]}`);
      setIsLoading(true);
      
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };

    // Simulate browsing activity every 10 seconds
    const interval = setInterval(simulateBrowsing, 10000);
    
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className={`glass-card h-full flex flex-col ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Browser Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <button 
              className="p-1 rounded hover:bg-white/10 transition-colors"
              disabled
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button 
              className="p-1 rounded hover:bg-white/10 transition-colors"
              disabled
            >
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </button>
            <button 
              onClick={handleRefresh}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex items-center space-x-2 bg-white/5 rounded-lg px-3 py-1 flex-1 min-w-0">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-300 truncate">{url}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={toggleVisibility}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title={isVisible ? 'Hide browser' : 'Show browser'}
          >
            {isVisible ? (
              <EyeOff className="w-4 h-4 text-gray-400" />
            ) : (
              <Eye className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 relative overflow-hidden">
        {isVisible ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                  <p className="text-white text-sm">Loading page...</p>
                </div>
              </div>
            )}
            
            {/* In production, this would be a live browser stream */}
            <div className="w-full h-full bg-white rounded-b-lg relative overflow-hidden">
              {/* Mock browser content */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white p-8">
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    Quantum Computing Research
                  </h1>
                  
                  <div className="space-y-4 text-gray-700">
                    <p className="text-lg">
                      Recent advances in quantum computing have shown promising developments 
                      in quantum supremacy, error correction, and practical applications.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                      <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-semibold text-blue-900 mb-2">Quantum Algorithms</h3>
                        <p className="text-sm">
                          Exploration of Shor&apos;s and Grover&apos;s algorithms and their 
                          implications for cryptography and search problems.
                        </p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-semibold text-blue-900 mb-2">Hardware Development</h3>
                        <p className="text-sm">
                          Current progress in superconducting qubits, trapped ions, 
                          and photonic quantum systems.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Key Findings:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Quantum advantage demonstrated in specific problem domains</li>
                        <li>Error rates continue to decrease with improved hardware</li>
                        <li>Hybrid quantum-classical algorithms show practical promise</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                AI Agent Active
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-black/20 rounded-b-lg">
            <div className="text-center">
              <EyeOff className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Browser hidden</p>
              <p className="text-gray-500 text-sm mt-2">
                Agent continues working in the background
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 text-xs text-gray-400">
        <span>{title}</span>
        <div className="flex items-center space-x-4">
          <span>Session: {sessionId.slice(0, 8)}</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}