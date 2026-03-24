import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ParticleFieldBackground from '../components/backgrounds/ParticleFieldBackground';
import { LockKeyhole, UserRound } from 'lucide-react';
import { checkSupabaseHealth, type SupabaseHealthStatus } from '../services/supabase';

interface LoginPageProps {
    onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const { login, isAuthLoading } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [healthStatus, setHealthStatus] = useState<SupabaseHealthStatus>('missing_config');

    useEffect(() => {
        let isMounted = true;

        const runHealthCheck = async () => {
            const status = await checkSupabaseHealth();
            if (isMounted) {
                setHealthStatus(status);
            }
        };

        void runHealthCheck();

        return () => {
            isMounted = false;
        };
    }, []);

    const healthStyles: Record<SupabaseHealthStatus, { label: string; color: string; background: string; border: string }> = {
        connected: {
            label: 'Supabase connected',
            color: '#bbf7d0',
            background: 'rgba(20, 83, 45, 0.35)',
            border: '1px solid rgba(74, 222, 128, 0.35)'
        },
        unavailable: {
            label: 'Supabase unreachable',
            color: '#fecaca',
            background: 'rgba(127, 29, 29, 0.35)',
            border: '1px solid rgba(248, 113, 113, 0.35)'
        },
        missing_config: {
            label: 'Supabase config missing',
            color: '#fde68a',
            background: 'rgba(120, 53, 15, 0.35)',
            border: '1px solid rgba(251, 191, 36, 0.35)'
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = login(username, password);
        if (success) {
            onLogin();
        } else {
            setError('Invalid username or password.');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 18px',
            overflow: 'hidden',
            fontFamily: 'var(--font-family, system-ui, sans-serif)'
        }}>
            <ParticleFieldBackground />

            <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '430px',
                padding: '34px 30px 26px',
                borderRadius: '24px',
                border: '1px solid rgba(148, 163, 184, 0.26)',
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.72) 0%, rgba(15, 23, 42, 0.58) 100%)',
                boxShadow: '0 25px 80px rgba(2, 6, 23, 0.45)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                color: '#e5eefc'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <img
                        src="/logo.png"
                        alt="OceanWharf Logo"
                        style={{
                            height: '72px',
                            width: '72px',
                            marginBottom: '16px',
                            display: 'block',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            filter: 'drop-shadow(0 10px 22px rgba(14, 165, 233, 0.28))'
                        }}
                    />
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.03em' }}>
                        OceanWharf
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.82)', marginTop: '6px', lineHeight: 1.5 }}>
                        Marine Procurement System
                    </div>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        marginTop: '14px',
                        padding: '6px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                        color: healthStyles[healthStatus].color,
                        background: healthStyles[healthStatus].background,
                        border: healthStyles[healthStatus].border
                    }}>
                        {healthStyles[healthStatus].label}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                            Username
                        </label>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '0 12px',
                            border: '1px solid rgba(148, 163, 184, 0.28)',
                            borderRadius: '14px',
                            background: 'rgba(15, 23, 42, 0.42)'
                        }}>
                            <UserRound size={16} color="#93c5fd" />
                            <input
                                type="text"
                                value={username}
                                onChange={e => { setUsername(e.target.value); setError(''); }}
                                autoFocus
                                required
                                style={{
                                    width: '100%',
                                    padding: '13px 0',
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    color: '#f8fafc',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="Enter username"
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                            Password
                        </label>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '0 12px',
                            border: '1px solid rgba(148, 163, 184, 0.28)',
                            borderRadius: '14px',
                            background: 'rgba(15, 23, 42, 0.42)'
                        }}>
                            <LockKeyhole size={16} color="#93c5fd" />
                            <input
                                type="password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError(''); }}
                                required
                                style={{
                                    width: '100%',
                                    padding: '13px 0',
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    color: '#f8fafc',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="Enter password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            color: '#fecaca',
                            fontSize: '12px',
                            marginBottom: '14px',
                            padding: '10px 12px',
                            backgroundColor: 'rgba(127, 29, 29, 0.38)',
                            border: '1px solid rgba(248, 113, 113, 0.35)',
                            borderRadius: '12px'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isAuthLoading}
                        style={{
                            width: '100%',
                            padding: '13px 16px',
                            background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '14px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 16px 36px rgba(37, 99, 235, 0.28)',
                            opacity: isAuthLoading ? 0.7 : 1
                        }}
                    >
                        {isAuthLoading ? 'Connecting to Supabase...' : 'Sign In'}
                    </button>
                </form>

                <div style={{
                    marginTop: '22px',
                    padding: '14px 16px',
                    background: 'rgba(15, 23, 42, 0.38)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '14px',
                    fontSize: '11px',
                    color: '#cbd5e1',
                    lineHeight: 1.7
                }}>
                    <strong style={{ color: '#f8fafc' }}>Demo Credentials</strong><br />
                    Company: <code style={{ color: '#bfdbfe' }}>admin / admin123</code><br />
                    Vendor: <code style={{ color: '#bfdbfe' }}>vendor1 / vendor123</code>
                </div>
            </div>
        </div>
    );
}
