import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, HelpCircle, Search, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface FaqItem {
    id: string;
    question: string;
    answer: string;
    sort_order: number;
}

const fallbackItems: FaqItem[] = [
    {
        id: "f1",
        question: "Как работает сервис CoolLike?",
        answer: "Мы предоставляем инструменты для повышения показателей в соцсетях. Вы вставляете ссылку, выбираете услугу, и наша система автоматически запускает процесс продвижения через сеть проверенных провайдеров.",
        sort_order: 1
    },
    {
        id: "f2",
        question: "Безопасно ли это для моего профиля?",
        answer: "Да, мы используем собственные алгоритмы безопасной доставки, которые имитируют поведение реальных пользователей. Мы не запрашиваем пароли и работаем только с публичными данными.",
        sort_order: 2
    },
    {
        id: "f3",
        question: "Как быстро начнется выполнение заказа?",
        answer: "Старт большинства услуг происходит автоматически в течение 5-30 минут после оплаты. В редких случаях (высокая нагрузка или техработы соцсети) старт может занять до 2-4 часов.",
        sort_order: 3
    },
    {
        id: "f4",
        question: "Что такое «Рефил» (Гарантия)?",
        answer: "Рефил — это бесплатное восстановление подписчиков или лайков в случае списаний со стороны социальной сети. Если в течение гарантийного срока показатели упали, система восстановит их бесплатно.",
        sort_order: 4
    },
    {
        id: "f5",
        question: "Почему мой профиль должен быть открытым?",
        answer: "Наши системы и системы провайдеров не могут получить доступ к закрытым (приватным) аккаунтам. Обязательно откройте профиль перед заказом.",
        sort_order: 5
    },
    {
        id: "f6",
        question: "Нужно ли давать пароль от аккаунта?",
        answer: "НЕТ. Мы никогда не запрашиваем пароли. Для работы нам нужна только публичная ссылка на ваш профиль или конкретную публикацию.",
        sort_order: 6
    },
    {
        id: "f7",
        question: "Какие требования к YouTube каналу?",
        answer: "Для успешного старта на вашем канале должно быть загружено минимум 3 видео, а самому старому видео должно быть не менее 2 суток. Это необходимо для корректной работы алгоритмов.",
        sort_order: 7
    },
    {
        id: "f8",
        question: "Что делать, если заказ не запустился через час?",
        answer: "Если статус заказа не изменился в течение часа, пожалуйста, напишите в нашу службу поддержки в Telegram @coollike_support. Мы проверим параметры и поможем ускорить процесс.",
        sort_order: 8
    },
    {
        id: "f9",
        question: "Как правильно копировать ссылку на пост в Telegram?",
        answer: "Для каналов: нажмите на время публикации поста или на кнопку «Поделиться», затем выберите «Копировать ссылку». Для закрытых групп используйте пригласительные ссылки.",
        sort_order: 9
    },
    {
        id: "f10",
        question: "Можно ли отменить заказ?",
        answer: "Если выполнение уже началось, отмена технически невозможна. Если заказ в статусе «В очереди», вы можете обратиться в поддержку для его отмены.",
        sort_order: 10
    },
    {
        id: "f11",
        question: "Как повысить шансы на попадание в рекомендации?",
        answer: "Алгоритмы любят комплексность. Мы советуем заказывать одновременно подписчиков, лайки, сохранения и комментарии в пропорции 10:1.",
        sort_order: 11
    },
    {
        id: "f12",
        question: "Зачем нужна регистрация на сайте?",
        answer: "Регистрация происходит автоматически. Это позволяет хранить историю заказов, предоставлять скидки и отправлять чеки об оплате.",
        sort_order: 12
    },
    {
        id: "f13",
        question: "Что будет, если я сменю никнейм во время заказа?",
        answer: "Ссылка станет недействительной, и поставка прекратится. Не меняйте никнейм до завершения заказа.",
        sort_order: 13
    },
    {
        id: "f14",
        question: "Где я могу увидеть чек об оплате?",
        answer: "Все финансовые документы доступны в Личном кабинете в разделе «История транзакций» сразу после оплаты.",
        sort_order: 14
    },
    {
        id: "f15",
        question: "Есть ли у вас партнерская программа?",
        answer: "Да, у нас есть 3-уровневая реферальная система. Вы можете получать процент от пополнений приглашенных пользователей. Подробности в разделе «Рефералы».",
        sort_order: 15
    }
];

const FAQ = () => {
    const [items, setItems] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from("faq_items")
                .select("*")
                .eq("is_published", true)
                .order("sort_order", { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                setItems(data);
            } else {
                // Use fallback items if DB is empty
                setItems(fallbackItems);
            }
        } catch (err) {
            console.error("Error fetching FAQ:", err);
            setItems(fallbackItems);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const filteredItems = items.filter(item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Header */}
            <div className="border-b border-border/60 bg-card/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" /> На главную
                    </Link>
                    <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground/60">Помощь и поддержка</div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6"
                    >
                        <HelpCircle className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h1 className="text-4xl font-black mb-4">Часто задаваемые вопросы</h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        Здесь мы собрали ответы на самые популярные вопросы о работе нашего сервиса.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-12">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Поиск по вопросам..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card border border-border/50 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-lg"
                    />
                </div>

                {/* FAQ Items */}
                <div className="space-y-3">
                    {loading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-20 rounded-2xl bg-muted/30 animate-pulse" />
                        ))
                    ) : filteredItems.length > 0 ? (
                        filteredItems.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`rounded-2xl border transition-all ${expandedId === item.id
                                    ? "bg-card border-primary/50 shadow-lg shadow-primary/5"
                                    : "bg-card/50 border-border/50 hover:border-border"
                                    }`}
                            >
                                <button
                                    onClick={() => toggleExpand(item.id)}
                                    className="w-full flex items-center justify-between p-6 text-left"
                                >
                                    <span className="font-bold text-lg md:text-xl pr-4">{item.question}</span>
                                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedId === item.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                        }`}>
                                        {expandedId === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {expandedId === item.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pb-6 pt-0 text-muted-foreground text-lg leading-relaxed whitespace-pre-line border-t border-border/10 mt-2 pt-4">
                                                {item.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-muted/10 rounded-[2.5rem] border border-dashed border-border/50">
                            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Ничего не найдено</h3>
                            <p className="text-muted-foreground">Попробуйте изменить запрос или обратитесь в поддержку.</p>
                        </div>
                    )}
                </div>

                {/* Support Section */}
                <div className="mt-20 p-8 rounded-[2.5rem] bg-gradient-to-br from-card to-card border border-border/50 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                            <MessageSquare className="w-7 h-7 text-secondary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Не нашли ответ на свой вопрос?</h2>
                        <p className="text-muted-foreground mb-8 text-lg">
                            Наша служба поддержки работает 24/7 и готова помочь с любым вопросом.
                        </p>
                        <Link
                            to="https://t.me/coollike_support"
                            target="_blank"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-foreground text-background font-black hover:scale-[1.02] transition-transform active:scale-95"
                        >
                            Связаться в Telegram
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
