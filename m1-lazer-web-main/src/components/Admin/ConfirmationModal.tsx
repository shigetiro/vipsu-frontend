import React, { useState, useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText: string;
  requireConfirmationText?: string; // If provided, user must type this to enable confirm button
  username?: string; // Optional username to display prominently
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmButtonText,
  cancelButtonText,
  requireConfirmationText,
  username,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(false);

  useEffect(() => {
    if (requireConfirmationText) {
      setIsConfirmEnabled(confirmationInput === requireConfirmationText);
    } else {
      setIsConfirmEnabled(true);
    }
  }, [confirmationInput, requireConfirmationText]);

  useEffect(() => {
    if (isOpen) {
      const input = document.getElementById('confirmation-input');
      if (input) {
        input.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-w-full mx-4">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {/* Warning icon */}
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.529 0-2.492-1.646-1.742-2.98l5.58-9.92zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              {username && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">Username:</p>
                  <p className="text-lg font-semibold text-gray-900">{username}</p>
                </div>
              )}
              <h2 className="text-lg font-medium text-gray-900">{title}</h2>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              {requireConfirmationText && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type "{requireConfirmationText}" to confirm:
                  </label>
                  <input
                    id="confirmation-input"
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  {!isConfirmEnabled && (
                    <p className="mt-1 text-sm text-red-500">
                      Please type "{requireConfirmationText}" exactly to proceed
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:shadow-outline"
            >
              {cancelButtonText}
            </button>
            <button
              onClick={onConfirm}
              disabled={!isConfirmEnabled}
              className={`px-4 py-2 ${
                isConfirmEnabled
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:shadow-outline'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;