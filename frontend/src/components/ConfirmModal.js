import React from 'react';
import styled from 'styled-components';

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const StyledWrapper = styled.div`
  .card {
    overflow: hidden;
    position: relative;
    text-align: left;
    border-radius: 0.75rem;
    max-width: 320px;
    width: 90vw;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    background-color: #fff;
    animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes scaleIn {
    from { transform: scale(0.92); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .dismiss {
    position: absolute;
    right: 12px;
    top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background-color: #fff;
    color: #64748b;
    border: 1px solid #D1D5DB;
    font-size: 1.2rem;
    font-weight: 300;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    transition: 0.2s ease;
    cursor: pointer;
    line-height: 1;
  }

  .dismiss:hover {
    background-color: #ee0d0d;
    border: 1px solid #ee0d0d;
    color: #fff;
  }

  .header {
    padding: 1.5rem 1.25rem 1.25rem 1.25rem;
  }

  .image {
    display: flex;
    margin-left: auto;
    margin-right: auto;
    background-color: #e2feee;
    flex-shrink: 0;
    justify-content: center;
    align-items: center;
    width: 3.25rem;
    height: 3.25rem;
    border-radius: 9999px;
    animation: animate 0.6s linear alternate-reverse infinite;
    transition: 0.6s ease;
  }

  .image.danger {
    background-color: #fee2e2;
  }

  .image svg {
    color: #0afa2a;
    width: 2rem;
    height: 2rem;
  }

  .content {
    margin-top: 0.85rem;
    text-align: center;
  }

  .title {
    color: #066e29;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.4rem;
    display: block;
  }

  .title.danger {
    color: #b91c1c;
  }

  .message {
    margin-top: 0.5rem;
    color: #595b5f;
    font-size: 0.875rem;
    line-height: 1.35rem;
    word-break: break-word;
  }

  .actions {
    margin: 1.25rem 0 0.25rem 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .history {
    display: inline-flex;
    padding: 0.65rem 1rem;
    background-color: #1aa06d;
    color: #ffffff;
    font-size: 0.95rem;
    line-height: 1.5rem;
    font-weight: 600;
    justify-content: center;
    align-items: center;
    width: 100%;
    border-radius: 0.375rem;
    border: none;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: all 0.2s;
  }

  .history:hover {
    background-color: #15803d;
  }

  .history.danger {
    background-color: #dc2626;
  }

  .history.danger:hover {
    background-color: #b91c1c;
  }

  .track {
    display: inline-flex;
    padding: 0.65rem 1rem;
    color: #242525;
    font-size: 0.95rem;
    line-height: 1.5rem;
    font-weight: 600;
    justify-content: center;
    align-items: center;
    width: 100%;
    border-radius: 0.375rem;
    border: 1px solid #D1D5DB;
    background-color: #fff;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: all 0.2s;
  }

  .track:hover {
    background-color: #f8fafc;
    border-color: #cbd5e1;
  }

  @keyframes animate {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.08);
    }
  }
`;

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Send",
  cancelText = "Cancel",
  isDanger = false,
}) {
  if (!isOpen) return null;

  return (
    <ModalBackdrop onClick={onClose}>
      <StyledWrapper onClick={(e) => e.stopPropagation()}>
        <div className="card">
          <button type="button" className="dismiss" onClick={onClose} aria-label="Close">
            ×
          </button>
          <div className="header">
            <div className={`image ${isDanger ? 'danger' : ''}`}>
              {isDanger ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#ef4444">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <g strokeLinejoin="round" strokeLinecap="round">
                    <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="#16a34a" d="M20 7L9.00004 18L3.99994 13" />
                  </g>
                </svg>
              )}
            </div>
            <div className="content">
              <span className={`title ${isDanger ? 'danger' : ''}`}>{title}</span>
              <p className="message">{message}</p>
            </div>
            <div className="actions">
              <button
                type="button"
                className={`history ${isDanger ? 'danger' : ''}`}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                {confirmText}
              </button>
              <button type="button" className="track" onClick={onClose}>
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </StyledWrapper>
    </ModalBackdrop>
  );
}
