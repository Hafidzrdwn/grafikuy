// src/components/ui/Modal.jsx
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      modalRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        tabIndex="-1"
        className="bg-white dark:bg-[#112D4E] w-full max-w-lg mx-4 rounded-xl shadow-lg border border-(--color-muted) dark:border-[#3F72AF]/30 outline-none"
      >
        <div className="flex justify-between items-center p-4 border-b border-(--color-muted) dark:border-[#3F72AF]/30">
          <h2 className="text-lg font-semibold text-(--color-dark) dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 text-(--color-dark) dark:text-(--color-light)">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
