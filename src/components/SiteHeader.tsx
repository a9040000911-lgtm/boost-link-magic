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

    const scrollToReviews = () => {
        if (!isHomePage) {
            navigate('/?scroll=testimonials');
            return;
        }
        const element = document.getElementById('testimonials');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-4 py-4 ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-lg' : 'bg-transparent border-none shadow-none'
                }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Left: Branding */}
                <div className="flex items-center gap-8">
                    <div
                        onClick={() => navigate('/')}
                        className="cursor-pointer flex items-center gap-2.5 group"
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${scrolled
                            ? 'bg-primary shadow-lg shadow-primary/20 rotate-0 group-hover:rotate-12'
                            : 'bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/20'
                            }`}>
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col -gap-1">
                            <span className={`text-xl font-black tracking-tighter transition-colors ${scrolled ? 'text-foreground' : 'text-white'}`}>
                                COOLLIKE
                            </span>
                            <div className="flex items-center gap-1.5 grayscale opacity-70">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                </span>
                                <span className={`text-[10px] font-medium uppercase tracking-widest ${scrolled ? 'text-muted-foreground' : 'text-white/60'}`}>
                                    Live: 142
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Navigation (Center-left) */}
                    <nav className="hidden lg:flex items-center gap-6">
                        <button
                            onClick={() => navigate('/catalog')}
                            className={`text-sm font-semibold transition-colors hover:text-primary ${scrolled ? 'text-muted-foreground' : 'text-white/70'}`}
                        >
                            Каталог
                        </button>
                        <button
                            onClick={scrollToReviews}
                            className={`text-sm font-semibold transition-colors hover:text-primary ${scrolled ? 'text-muted-foreground' : 'text-white/70'}`}
                        >
                            Отзывы
                        </button>
                        <button
                            onClick={() => navigate('/about')}
                            className={`text-sm font-semibold transition-colors hover:text-primary ${scrolled ? 'text-muted-foreground' : 'text-white/70'}`}
                        >
                            О нас
                        </button>
                        <button
                            onClick={() => navigate('/faq')}
                            className={`text-sm font-semibold transition-colors hover:text-primary ${scrolled ? 'text-muted-foreground' : 'text-white/70'}`}
                        >
                            FAQ
                        </button>
                        <button
                            onClick={() => navigate('/glossary')}
                            className={`text-sm font-semibold transition-colors hover:text-primary ${scrolled ? 'text-muted-foreground' : 'text-white/70'}`}
                        >
                            Глоссарий
                        </button>
                        <button
                            onClick={() => navigate('/support')}
                            className={`text-sm font-semibold transition-colors hover:text-primary ${scrolled ? 'text-muted-foreground' : 'text-white/70'}`}
                        >
                            Поддержка
                        </button>
                    </nav>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">

                    <button
                        onClick={() => navigate(session ? '/dashboard' : '/auth')}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all active:scale-95 group shadow-lg ${scrolled
                            ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                            : 'bg-white text-black hover:bg-white/90'
                            }`}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${scrolled ? 'bg-white/20' : 'bg-black/5'
                            }`}>
                            {session ? <User className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs font-heavy tracking-wide uppercase">{session ? 'Кабинет' : 'Войти'}</span>
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
