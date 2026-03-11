
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Link as LinkIcon, Gift, Copy, Check, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function ReferralsPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [tiers, setTiers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profRes, refRes, tierRes] = await Promise.all([
                supabase.from("profiles").select("*").eq("id", user.id).single(),
                supabase.from("referrals").select("*, referred_profiles:referred_id(display_name, email)").eq("referrer_id", user.id),
                supabase.from("referral_tiers").select("*").order("level", { ascending: true })
            ]);

            if (profRes.data) setProfile(profRes.data);
            if (refRes.data) setReferrals(refRes.data);
            if (tierRes.data) setTiers(tierRes.data);
        } catch (e) {
            console.error("Error loading referrals:", e);
        }
        setLoading(false);
    };

    const referralLink = `${window.location.origin}/auth?ref=${profile?.referral_code || ""}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success("Ссылка скопирована!");
        setTimeout(() => setCopied(false), 2000);
    };

    const totalEarned = referrals.reduce((acc, r) => acc + (Number(r.total_bonus_earned) || 0), 0);
    const activeReferrals = referrals.length;

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
    }

    const currentTier = tiers.find(t => t.id === referrals[0]?.current_tier_id) || tiers[0];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Реферальная программа</h1>
                    <p className="text-muted-foreground">Приглашайте друзей и получайте до 20% от их заказов пожизненно.</p>
                </div>
                <Badge variant="outline" className="px-3 py-1 text-sm gap-1.5 bg-primary/5 border-primary/20">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Ваш уровень: {currentTier?.name || "Бронза"} ({currentTier?.bonus_percent || 10}%)
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" /> Приглашено
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeReferrals}</div>
                        <p className="text-xs text-muted-foreground mt-1">активных пользователей</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Всего заработано
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{totalEarned.toFixed(2)} ₽</div>
                        <p className="text-xs text-muted-foreground mt-1">за всё время</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-1 bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                            <Gift className="h-4 w-4" /> Текущая ставка
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currentTier?.bonus_percent || 10}%</div>
                        <p className="text-xs text-muted-foreground mt-1">от суммы пополнений</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/20 bg-primary/[0.02]">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-primary" /> Ваша реферальная ссылка
                    </CardTitle>
                    <CardDescription>
                        Поделитесь этой ссылкой. Каждый, кто зарегистрируется по ней, станет вашим рефералом.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            readOnly
                            value={referralLink}
                            className="font-mono text-sm bg-background border-primary/20"
                        />
                        <Button onClick={copyToClipboard} variant={copied ? "outline" : "default"} className="min-w-[120px]">
                            {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                            {copied ? "Готово" : "Копировать"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>История вознаграждений</CardTitle>
                    <CardDescription>Список приглашенных вами пользователей и доход от них.</CardDescription>
                </CardHeader>
                <CardContent>
                    {referrals.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>У вас пока нет рефералов. Самое время пригласить первого!</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Пользователь</TableHead>
                                    <TableHead>Дата регистрации</TableHead>
                                    <TableHead>Оборот (LTV)</TableHead>
                                    <TableHead>Ваш доход</TableHead>
                                    <TableHead>Статус</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {referrals.map((ref: any) => (
                                    <TableRow key={ref.id}>
                                        <TableCell>
                                            <div className="font-medium text-sm">
                                                {ref.referred_profiles?.display_name || "Пользователь"}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {ref.referred_profiles?.email?.slice(0, 3)}***@{ref.referred_profiles?.email?.split('@')[1]}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">{new Date(ref.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-sm font-mono">{Number(ref.ltv_accumulated).toFixed(2)} ₽</TableCell>
                                        <TableCell className="text-sm font-bold text-green-600">+{Number(ref.total_bonus_earned).toFixed(2)} ₽</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-[10px]">Активен</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tiers.map((tier) => (
                    <Card key={tier.id} className={tier.id === currentTier?.id ? "border-primary ring-1 ring-primary/20" : "opacity-75"}>
                        <CardHeader className="p-4 text-center">
                            <CardTitle className="text-base">{tier.name}</CardTitle>
                            <div className="text-2xl font-bold text-primary">{tier.bonus_percent}%</div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-center text-xs text-muted-foreground">
                            <p>Порог LTV: от {tier.ltv_threshold} ₽</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
