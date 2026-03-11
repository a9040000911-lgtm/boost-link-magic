import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, Smartphone, SmartphoneNfc } from "lucide-react";

export function TelegramAlbumGuide() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="text-sky-700 hover:text-sky-900 underline font-semibold inline-flex items-center gap-1 ml-1 transition-colors">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Как копировать?
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Инструкция: Копирование ссылок в альбомах</DialogTitle>
                    <DialogDescription>
                        Для корректной накрутки просмотров в альбомах Telegram нужно копировать ссылки на отдельные медиа-файлы.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="ios" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="ios" className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            iPhone (iOS)
                        </TabsTrigger>
                        <TabsTrigger value="android" className="flex items-center gap-2">
                            <SmartphoneNfc className="w-4 h-4" />
                            Android
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="ios" className="space-y-4 py-4 text-sm leading-relaxed">
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Откройте пост с альбомом в канале.</li>
                            <li><span className="text-foreground font-medium">Зажмите палец</span> на конкретном фото или видео.</li>
                            <li>В появившемся меню выберите <span className="text-sky-600 font-semibold">«Скопировать ссылку»</span>.</li>
                            <li>Повторите действия для <span className="underline italic">первого</span> и <span className="underline italic">последнего</span> элемента в альбоме.</li>
                        </ol>
                    </TabsContent>
                    <TabsContent value="android" className="space-y-4 py-4 text-sm leading-relaxed">
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                            <li>Откройте пост с альбомом в канале.</li>
                            <li><span className="text-foreground font-medium">Нажмите на фото</span>, чтобы открыть его на весь экран.</li>
                            <li>Нажмите на иконку <span className="text-foreground font-medium">«Поделиться»</span> (или три точки в углу).</li>
                            <li>Выберите пункт <span className="text-sky-600 font-semibold">«Копировать ссылку»</span>.</li>
                            <li>Повторите действия для <span className="underline italic">первого</span> и <span className="underline italic">последнего</span> элемента в альбоме.</li>
                        </ol>
                    </TabsContent>
                </Tabs>
                <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground border border-muted italic">
                    Важно: ссылки на разные фото в одном альбоме будут отличаться (например, .../123 и .../123?single).
                </div>
            </DialogContent>
        </Dialog>
    );
}
