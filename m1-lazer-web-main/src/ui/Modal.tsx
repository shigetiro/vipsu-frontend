import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--bg-primary, #1a1a1a);
          border-radius: 12px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
          z-index: 1001;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color, #333);
        }
        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
        .modal-close {
          background: none;
          border: none;
          color: var(--text-secondary, #888);
          font-size: 28px;
          cursor: pointer;
          line-height: 1;
        }
        .modal-close:hover {
          color: var(--text-primary, #fff);
        }
        .modal-body {
          padding: 24px;
        }
      `}</style>
    </>
  );
};

export default Modal;
export { Modal };