
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Shield, Edit, Trash2, Save, X, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminReferrals() {
    const [referrals, setReferrals] = useState<any[]>([]);
    const [tiers, setTiers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTier, setEditingTier] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<any>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [refRes, tierRes] = await Promise.all([
            supabase.from("referrals").select("*, referrer:referrer_id(display_name, email), referred:referred_id(display_name, email), tier:current_tier_id(name)"),
            supabase.from("referral_tiers").select("*").order("level", { ascending: true })
        ]);

        if (refRes.data) setReferrals(refRes.data);
        if (tierRes.data) setTiers(tierRes.data);
        setLoading(false);
    };

    const handleEditTier = (tier: any) => {
        setEditingTier(tier.id);
        setEditValues({ ...tier });
    };

    const handleSaveTier = async () => {
        const { error } = await supabase
            .from("referral_tiers")
            .update({
                name: editValues.name,
                ltv_threshold: parseFloat(editValues.ltv_threshold),
                bonus_percent: parseFloat(editValues.bonus_percent)
            })
            .eq("id", editingTier);

        if (error) {
            toast.error("Ошибка сохранения: " + error.message);
        } else {
            toast.success("Уровень обновлен");
            setEditingTier(null);
            loadData();
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Загрузка...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" /> Реферальная система
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiers.map((tier) => (
                    <Card key={tier.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Уровень {tier.level}: {tier.name}</CardTitle>
                            {editingTier === tier.id ? (
                                <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveTier}><Save className="h-3 w-3 text-green-600" /></Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingTier(null)}><X className="h-3 w-3 text-destructive" /></Button>
                                </div>
                            ) : (
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEditTier(tier)}><Edit className="h-3 w-3" /></Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {editingTier === tier.id ? (
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Название"
                                        value={editValues.name}
                                        onChange={e => setEditValues({ ...editValues, name: e.target.value })}
                                        className="h-7 text-xs"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            type="number"
                                            placeholder="LTV"
                                            value={editValues.ltv_threshold}
                                            onChange={e => setEditValues({ ...editValues, ltv_threshold: e.target.value })}
                                            className="h-7 text-xs"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="%"
                                            value={editValues.bonus_percent}
                                            onChange={e => setEditValues({ ...editValues, bonus_percent: e.target.value })}
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-primary">{tier.bonus_percent}%</div>
                                    <p className="text-xs text-muted-foreground mt-1">Порог LTV: {tier.ltv_threshold} ₽</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Активные связи</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Реферер (кто пригласил)</TableHead>
                                <TableHead>Реферал (кого пригласили)</TableHead>
                                <TableHead>LTV</TableHead>
                                <TableHead>Уровень</TableHead>
                                <TableHead>Заработок</TableHead>
                                <TableHead>Дата</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referrals.map((ref) => (
                                <TableRow key={ref.id}>
                                    <TableCell>
                                        <div className="font-medium text-xs">{ref.referrer?.display_name || "—"}</div>
                                        <div className="text-[10px] text-muted-foreground">{ref.referrer?.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-xs">{ref.referred?.display_name || "—"}</div>
                                        <div className="text-[10px] text-muted-foreground">{ref.referred?.email}</div>
                                    </TableCell>
                                    <TableCell className="text-xs font-mono">{Number(ref.ltv_accumulated).toFixed(2)} ₽</TableCell>
                                    <TableCell><Badge variant="outline" className="text-[10px]">{ref.tier?.name || "—"}</Badge></TableCell>
                                    <TableCell className="text-xs font-bold text-green-600">+{Number(ref.total_bonus_earned).toFixed(2)} ₽</TableCell>
                                    <TableCell className="text-[10px] text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
