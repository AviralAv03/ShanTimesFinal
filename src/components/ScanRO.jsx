import React, { useState, useRef, useEffect } from 'react';
import { scanReleaseOrder } from '../utils/ocr';

const ScanRO = ({ onScanSuccess }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const fileInputRef = useRef(null);

  // Load API key from local storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('shantimes_gemini_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!apiKey) {
      setShowKeyModal(true);
      // Reset input so the same file can be selected again
      e.target.value = '';
      return;
    }

    setIsScanning(true);
    setError('');

    try {
      const data = await scanReleaseOrder(file, apiKey);
      onScanSuccess(data);
    } catch (err) {
      setError(err.message || 'Failed to scan the document.');
    } finally {
      setIsScanning(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const saveApiKey = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('shantimes_gemini_key', apiKey.trim());
    setShowKeyModal(false);
  };

  return (
    <div className="bill-scan-container">
      <div className="bill-scan-header">
        <button
          type="button"
          className="bill-btn-primary bill-scan-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
        >
          {isScanning ? (
            <><i className="fas fa-spinner fa-spin"></i> Scanning AI...</>
          ) : (
            <><i className="fas fa-magic"></i> Upload RO (AI Scan)</>
          )}
        </button>
        <button
          type="button"
          className="bill-btn-ghost bill-scan-settings-btn"
          onClick={() => setShowKeyModal(true)}
          title="AI Settings"
        >
          <i className="fas fa-cog"></i>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="application/pdf,image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {error && (
        <div className="bill-scan-error">
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="bill-modal-overlay">
          <div className="bill-modal-content">
            <h3 className="bill-modal-title">AI Scanner Settings</h3>
            <p className="bill-modal-desc">
              To use the AI Scanner, please enter your Google Gemini API Key. This key is saved securely in your browser's local storage and is never sent to our servers.
            </p>
            <div className="bill-field">
              <label className="bill-label">Gemini API Key</label>
              <input
                type="password"
                className="bill-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
              />
            </div>
            <div className="bill-modal-actions">
              <button
                type="button"
                className="bill-btn-ghost"
                onClick={() => setShowKeyModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bill-btn-primary"
                onClick={saveApiKey}
                disabled={!apiKey.trim()}
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanRO;
