import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, LayoutGrid, Home } from 'lucide-react';

const SiteHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [session, setSession] = useState<any>(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession);
        });

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            subscription.unsubscribe();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const isHomePage = location.pathname === '/';
    const isCatalogPage = location.pathname === '/catalog';

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-4 py-3 ${scrolled ? 'bg-background/80 backdrop-blur-lg border-b border-border/40 shadow-sm' : 'bg-transparent border-none shadow-none'
                }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {!isHomePage && (
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 md:hidden"
                        >
                            <Home className="w-5 h-5" />
                        </button>
                    )}
                    <div
                        onClick={() => navigate('/')}
                        className="cursor-pointer flex items-center gap-2"
                    >
                        <div className={`w-8 h-8 rounded-lg bg-primary hidden md:flex items-center justify-center shadow-lg shadow-primary/20`}>
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className={`text-xl font-black tracking-tighter ${scrolled ? 'text-foreground' : 'text-white'} hidden sm:block`}>
                            COOLLIKE
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isCatalogPage && (
                        <button
                            onClick={() => navigate('/catalog')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${scrolled
                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>Каталог</span>
                        </button>
                    )}

                    <button
                        onClick={() => navigate(session ? '/dashboard' : '/auth')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all active:scale-95 group shadow-lg ${scrolled
                            ? 'bg-primary text-white hover:bg-primary/90'
                            : 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20'
                            }`}
                    >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${scrolled ? 'bg-white/20' : 'bg-primary/20 group-hover:bg-primary/30'
                            }`}>
                            {session ? <User className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs font-bold pr-1">{session ? 'Кабинет' : 'Вход'}</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

// Simple import for Sparkles if not available globally in the file context
const Sparkles = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m12 3 1.912 5.886L20.243 9l-4.707 4.114L16.485 19 12 15.886 7.515 19l.949-5.886L3.757 9l6.331-.114L12 3Z" />
    </svg>
);

export default SiteHeader;
