import { useMemo, useState } from 'react';
import type { NotificationRecord } from '../../types';
import { Bell } from 'lucide-react';
import { Button } from './Button';

interface NotificationBellProps {
    notifications: NotificationRecord[];
    onMarkAllRead: () => void;
}

export function NotificationBell({ notifications, onMarkAllRead }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = useMemo(
        () => notifications.filter(notification => !notification.isRead).length,
        [notifications]
    );

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                style={{
                    position: 'relative',
                    background: 'none',
                    border: '1px solid #94a3b8',
                    color: '#fff',
                    padding: '5px 9px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                title="Notifications"
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        minWidth: '18px',
                        height: '18px',
                        padding: '0 4px',
                        borderRadius: '999px',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: '360px',
                    maxHeight: '420px',
                    overflowY: 'auto',
                    backgroundColor: '#fff',
                    color: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
                    zIndex: 1000
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderBottom: '1px solid #e2e8f0'
                    }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700 }}>Notifications</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                {unreadCount} unread
                            </div>
                        </div>
                        <Button variant="secondary" onClick={onMarkAllRead} style={{ fontSize: '12px', padding: '6px 10px' }}>
                            Mark all read
                        </Button>
                    </div>

                    {notifications.length === 0 ? (
                        <div style={{ padding: '20px 16px', fontSize: '13px', color: '#64748b' }}>
                            No notifications yet.
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <div
                                key={notification.id}
                                style={{
                                    padding: '14px 16px',
                                    borderBottom: '1px solid #f1f5f9',
                                    backgroundColor: notification.isRead ? '#fff' : '#eff6ff'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                                            {notification.title}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: 1.5 }}>
                                            {notification.message}
                                        </div>
                                    </div>
                                    {!notification.isRead && (
                                        <span style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '999px',
                                            backgroundColor: '#2563eb',
                                            flexShrink: 0,
                                            marginTop: '5px'
                                        }} />
                                    )}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                                    {new Date(notification.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
