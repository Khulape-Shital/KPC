import React, { useState } from 'react';
import { FileText, Download, Maximize2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const DocumentReviewPanel = ({ documents }) => {
  const [selectedDoc, setSelectedDoc] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified':
        return '#10b981';
      case 'Re-upload Required':
        return '#ef4444';
      case 'Rejected':
        return '#ef4444';
      case 'Missing':
        return '#94a3b8';
      default:
        return '#3b82f6';
    }
  };

  const handleDownload = (doc) => {
    console.log("DOWNLOAD DOC =", doc);

    if (doc.file instanceof File) {
      // Local File object (from in-session upload)
      const url = URL.createObjectURL(doc.file);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.name || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (doc.file_url) {
      // Supabase Storage URL — open in new tab for download/preview
      window.open(doc.file_url, '_blank', 'noopener,noreferrer');
    } else {
      alert("Original file not found");
    }
  };
console.log("ALL DOCUMENTS =", documents);
  return (
    <div className="card" style={{ padding: '20px', backgroundColor: '#fff', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText size={18} color="var(--primary-blue)" /> Document Review Center
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {documents && documents.length > 0 ? (
          documents.map((doc, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="#4f46e5" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{doc.type}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{doc.size || 'N/A'}</span>
                    <span style={{ color: doc.quality === 'Low' ? '#ef4444' : '#10b981', fontWeight: 500 }}>
                      Quality: {doc.quality || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: getStatusColor(doc.status), display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {doc.status === 'Re-upload Required' ? <AlertTriangle size={14} /> : doc.status === 'Verified' ? <CheckCircle2 size={14} /> : null}
                  {doc.status}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline" onClick={() => setSelectedDoc(doc)} style={{ padding: '6px', fontSize: '12px' }} title="Preview">
                    <Maximize2 size={14} />
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleDownload(doc)}
                    style={{ padding: '6px', fontSize: '12px' }}
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-gray)', fontSize: '13px' }}>
            No documents available.
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (() => {
        const previewUrl = selectedDoc.file instanceof File
          ? URL.createObjectURL(selectedDoc.file)
          : selectedDoc.file_url;
        const isImage = previewUrl && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(previewUrl);
        const isPdf = previewUrl && /\.pdf(\?.*)?$/i.test(previewUrl);

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '80%', height: '80%', backgroundColor: '#fff', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{selectedDoc.type} Preview</h3>
                <button onClick={() => setSelectedDoc(null)} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-gray)' }}>&times;</button>
              </div>
              <div style={{ flex: 1, backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
                {!previewUrl ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <FileText size={64} />
                    <p style={{ marginTop: '12px', fontSize: '14px' }}>No preview available</p>
                  </div>
                ) : isImage ? (
                  <img src={previewUrl} alt={selectedDoc.type} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                ) : isPdf ? (
                  <iframe src={previewUrl} title={selectedDoc.type} style={{ width: '100%', height: '100%', border: 'none' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <FileText size={64} />
                    <p style={{ marginTop: '12px', fontSize: '14px' }}>Cannot preview this file type.</p>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-blue)', fontSize: '13px', marginTop: '8px', display: 'inline-block' }}>Open in new tab</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
