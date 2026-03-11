import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Zap, TrendingUp, Users, Globe, Award } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
    { label: "Заказов выполнено", value: "1.2M+", icon: Award },
    { label: "Активных клиентов", value: "45K+", icon: Users },
    { label: "Среднее время старта", value: "2 мин", icon: Zap },
    { label: "Поддерживаемых платформ", value: "15+", icon: Globe },
];

const features = [
    {
        title: "Умный анализатор ссылок",
        description: "Наша уникальная технология автоматически распознает тип контента (пост, канал, сторис, товар) и предлагает только релевантные услуги. Больше никаких ошибок при заказе.",
        icon: Zap,
        color: "text-amber-500",
        bg: "bg-amber-500/10"
    },
    {
        title: "Безопасность прежде всего",
        description: "Мы используем собственные алгоритмы постепенной доставки, которые имитируют органический рост. Это минимизирует риски блокировок со стороны социальных сетей.",
        icon: Shield,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    },
    {
        title: "Профессиональная аналитика",
        description: "Отслеживайте статус каждого заказа в реальном времени. Наша система предоставляет подробную отчетность по выполнению и помогает планировать стратегию продвижения.",
        icon: TrendingUp,
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    }
];

const About = () => {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Background decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="border-b border-border/60 bg-card/50 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="w-4 h-4" /> На главную
                        </Link>
                        <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground/60">О компании CoolLike</div>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-br from-foreground via-foreground to-foreground/40 bg-clip-text text-transparent">
                            Мы меняем правила игры в SMM
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            CoolLike — это не просто сервис накрутки. Это высокотехнологичная платформа для эффективного управления социальным доказательством.
                        </p>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.1 * i }}
                                className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <stat.icon className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-2xl font-black text-foreground mb-1">{stat.value}</div>
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-5xl mx-auto px-4 py-16">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-3xl font-bold mb-6">Наша миссия</h2>
                            <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
                                <p>
                                    В мире, где успех аккаунта часто зависит от цифр, мы помогаем преодолеть "барьер нуля". Наша цель — дать вашему контенту тот стартовый импульс, который необходим для органического роста.
                                </p>
                                <p>
                                    Мы верим в прозрачность, качество и технологичный подход. Именно поэтому мы разрабатываем собственные инструменты автоматизации, которые делают процесс продвижения простым и безопасным.
                                </p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative rounded-3xl overflow-hidden aspect-video bg-gradient-to-br from-primary/20 via-primary/5 to-secondary/20 border border-border/50 flex items-center justify-center group"
                        >
                            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                                <Shield className="w-10 h-10 text-primary" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Features */}
                    <div className="mt-32">
                        <h2 className="text-3xl font-bold mb-12 text-center">Почему выбирают нас</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {features.map((feature, i) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="p-8 rounded-3xl bg-secondary/5 border border-border/50 hover:border-primary/50 transition-all group"
                                >
                                    <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        <feature.icon className={`w-7 h-7 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Closing CTA */}
                <div className="max-w-5xl mx-auto px-4 py-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="p-12 rounded-[2.5rem] bg-gradient-to-br from-primary to-secondary relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-black text-primary-foreground mb-6">Готовы к новому уровню?</h2>
                            <p className="text-primary-foreground/80 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
                                Доверьте продвижение профессионалам. Начните работу с CoolLike прямо сейчас и увидите результат уже сегодня.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    to="/catalog"
                                    className="px-10 py-4 rounded-2xl bg-white text-primary font-black shadow-xl shadow-black/10 hover:scale-[1.02] transition-transform active:scale-95"
                                >
                                    Открыть каталог
                                </Link>
                                <Link
                                    to="/faq"
                                    className="px-10 py-4 rounded-2xl bg-white/10 backdrop-blur-md text-white font-bold border border-white/20 hover:bg-white/20 transition-all"
                                >
                                    Частые вопросы
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default About;
