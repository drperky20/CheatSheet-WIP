'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Save, 
  Edit3, 
  Eye,
  Maximize2,
  Minimize2,
  Type
} from 'lucide-react';

interface Assignment {
  id: string;
  name: string;
  description: string;
  due_at: string | null;
  points_possible: number;
}

interface DocumentBlockProps {
  content: string;
  editable: boolean;
  assignment: Assignment;
}

export function DocumentBlock({ content, editable, assignment }: DocumentBlockProps) {
  const [localContent, setLocalContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local content when prop changes
  useEffect(() => {
    setLocalContent(content);
    setHasUnsavedChanges(false);
  }, [content]);

  // Calculate word count
  useEffect(() => {
    const words = localContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [localContent]);

  const handleContentChange = (value: string) => {
    setLocalContent(value);
    setHasUnsavedChanges(value !== content);
  };

  const handleSave = async () => {
    // In production, this would save to the agent session
    console.log('Saving document...', localContent);
    setHasUnsavedChanges(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localContent);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([localContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assignment.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
    if (!isEditing && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  // Mock content for development
  const mockContent = localContent || `# ${assignment.name}

## Introduction

This research paper explores the fascinating world of quantum computing, examining recent breakthroughs and their potential implications for various fields of study and industry applications.

## Background

Quantum computing represents a paradigm shift from classical computing, leveraging quantum mechanical phenomena such as superposition and entanglement to process information in fundamentally new ways.

### Key Concepts

1. **Quantum Bits (Qubits)**: Unlike classical bits that exist in states of 0 or 1, qubits can exist in superposition states.

2. **Quantum Entanglement**: A phenomenon where qubits become correlated in such a way that the quantum state of each qubit cannot be described independently.

3. **Quantum Supremacy**: The theoretical point at which quantum computers can solve problems that classical computers cannot solve in a reasonable time frame.

## Recent Developments

### Hardware Advances

Recent years have seen significant improvements in quantum hardware:

- **Superconducting Qubits**: Companies like IBM and Google have made substantial progress in creating stable superconducting qubit systems.
- **Trapped Ion Systems**: IonQ and other companies have developed systems using trapped ions as qubits.
- **Photonic Systems**: Xanadu and PsiQuantum are pioneering photonic approaches to quantum computing.

### Software and Algorithms

The quantum software landscape has also evolved rapidly:

- **Quantum Programming Languages**: Languages like Qiskit, Cirq, and Q# have made quantum programming more accessible.
- **Hybrid Algorithms**: QAOA and VQE represent promising hybrid quantum-classical approaches.

## Applications

### Cryptography
Quantum computers pose both opportunities and threats to cryptography...

### Drug Discovery
Quantum simulation could revolutionize pharmaceutical research...

### Financial Modeling
Quantum algorithms may provide advantages in portfolio optimization...

## Conclusion

The field of quantum computing continues to advance at an unprecedented pace, with significant implications for multiple industries and scientific disciplines.

---

*Word Count: ${wordCount} words*
*Status: Draft - AI Generated Content*
*Last Updated: ${new Date().toLocaleDateString()}*`;

  const displayContent = mockContent;

  return (
    <div className={`glass-card h-full flex flex-col ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Document Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-medium text-white">Document</h3>
            <p className="text-sm text-gray-400">{wordCount} words</p>
          </div>
          {hasUnsavedChanges && (
            <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Unsaved changes" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleEditing}
            className={`glass-button p-2 ${isEditing ? 'text-blue-400' : 'text-gray-400'}`}
            disabled={!editable}
            title={isEditing ? 'View mode' : 'Edit mode'}
          >
            {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleCopy}
            className="glass-button p-2 text-gray-400 hover:text-white"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleDownload}
            className="glass-button p-2 text-gray-400 hover:text-white"
            title="Download document"
          >
            <Download className="w-4 h-4" />
          </button>
          
          {hasUnsavedChanges && (
            <button
              onClick={handleSave}
              className="glass-button p-2 text-green-400 hover:text-green-300"
              title="Save changes"
            >
              <Save className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={toggleFullscreen}
            className="glass-button p-2 text-gray-400 hover:text-white"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <textarea
              ref={textareaRef}
              value={displayContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="flex-1 w-full p-4 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none font-mono text-sm leading-relaxed"
              placeholder="Start writing your document..."
              disabled={!editable}
            />
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                <span>Editing mode</span>
                <span>{wordCount} words</span>
              </div>
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2">
                  <Type className="w-3 h-3" />
                  <span>Unsaved changes</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <div className="p-4 prose prose-invert max-w-none">
              {/* Rendered markdown-style content */}
              <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                {displayContent.split('\n').map((line, index) => {
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={index} className="text-2xl font-bold text-white mb-4 mt-6">
                        {line.substring(2)}
                      </h1>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-xl font-semibold text-white mb-3 mt-5">
                        {line.substring(3)}
                      </h2>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={index} className="text-lg font-medium text-white mb-2 mt-4">
                        {line.substring(4)}
                      </h3>
                    );
                  }
                  if (line.startsWith('- ') || line.match(/^\d+\./)) {
                    return (
                      <li key={index} className="text-gray-300 mb-1 ml-4">
                        {line.replace(/^[-\d.]\s*/, '')}
                      </li>
                    );
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={index} className="font-semibold text-white mb-2">
                        {line.slice(2, -2)}
                      </p>
                    );
                  }
                  if (line.trim() === '') {
                    return <br key={index} />;
                  }
                  if (line.startsWith('*') && line.endsWith('*')) {
                    return (
                      <p key={index} className="text-gray-500 text-sm italic mb-1">
                        {line.slice(1, -1)}
                      </p>
                    );
                  }
                  return (
                    <p key={index} className="text-gray-300 mb-3 leading-relaxed">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>
            {editable ? (isEditing ? 'Editing' : 'Read-only') : 'Agent generating...'}
          </span>
          <span>{assignment.points_possible} points</span>
        </div>
        <div className="flex items-center space-x-4">
          {assignment.due_at && (
            <span>
              Due: {new Date(assignment.due_at).toLocaleDateString()}
            </span>
          )}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Auto-saving</span>
          </div>
        </div>
      </div>
    </div>
  );
}