import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let typeClass = 'toast-success';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          typeClass = 'toast-error';
        } else if (toast.type === 'info') {
          Icon = Info;
          typeClass = 'toast-info';
        }

        return (
          <div key={toast.id} className={`toast ${typeClass}`} role="alert">
            <Icon size={18} style={{ flexShrink: 0 }} />
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="modal-close"
              style={{ marginLeft: 'auto' }}
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
