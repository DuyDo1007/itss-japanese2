export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Xác nhận", cancelText = "Hủy" }) {
  if (!isOpen) return null;

  return (
    <div className="quiz-backdrop" onClick={onCancel}>
      <div className="quiz-modal" onClick={e => e.stopPropagation()} style={{ width: 'min(400px, 90vw)', textAlign: 'center', padding: '2rem' }}>
        <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={onCancel}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#f87171', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
