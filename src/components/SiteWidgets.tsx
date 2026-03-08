import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Bug, X, Send, MessageSquareHeart, ImagePlus, Camera, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ─── File Upload Component ───
interface FileUploadProps {
  file: File | null;
  preview: string | null;
  onFileChange: (file: File | null, preview: string | null) => void;
  accent?: string;
  onBeforeScreenshot?: () => void;
  onAfterScreenshot?: () => void;
}

const FileUpload = ({ file, preview, onFileChange, accent = "primary", onBeforeScreenshot, onAfterScreenshot }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.error("Поддерживаются только изображения (PNG, JPG, WEBP)");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Максимальный размер файла — 5 МБ");
      return;
    }
    const url = URL.createObjectURL(f);
    onFileChange(f, url);
  }, [onFileChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) handleFile(f);
        break;
      }
    }
  }, [handleFile]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const takeScreenshot = async () => {
    try {
      // Hide the widget modal before screenshot prompt
      onBeforeScreenshot?.();
      // Small delay to let the modal animate out
      await new Promise(r => setTimeout(r, 300));

      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" } as any });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);

      stream.getTracks().forEach((t) => t.stop());

      canvas.toBlob((blob) => {
        if (blob) {
          const f = new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" });
          handleFile(f);
        }
        // Show the widget modal again
        onAfterScreenshot?.();
      }, "image/png");
    } catch {
      onAfterScreenshot?.();
      toast.error("Скриншот отменён или не поддерживается браузером");
    }
  };

  const remove = () => {
    if (preview) URL.revokeObjectURL(preview);
    onFileChange(null, null);
  };

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-border/60 bg-muted/20">
        <img src={preview} alt="Прикреплённое изображение" className="w-full max-h-40 object-contain bg-muted/10" />
        <button
          onClick={remove}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
        <p className="text-[10px] text-muted-foreground px-2 py-1 truncate">{file?.name}</p>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/50 hover:border-border hover:bg-muted/20"
        }`}
      >
        <Upload className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">
          Перетащите изображение сюда или <span className="text-primary font-medium">выберите файл</span>
        </p>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">PNG, JPG, WEBP до 5 МБ • Ctrl+V для вставки</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
        e.target.value = "";
      }} />
      <button
        type="button"
        onClick={takeScreenshot}
        className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        <Camera className="w-3.5 h-3.5" /> Сделать скриншот экрана
      </button>
    </div>
  );
};

// ─── Upload helper ───
async function uploadAttachment(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("widget-uploads").upload(path, file, { upsert: true });
  if (error) {
    toast.error("Ошибка загрузки файла");
    return null;
  }
  const { data } = supabase.storage.from("widget-uploads").getPublicUrl(path);
  return data.publicUrl;
}

// ─── Main Widget ───
const SiteWidgets = () => {
  const { user } = useAuth();
  const [reviewsEnabled, setReviewsEnabled] = useState(false);
  const [bugreportEnabled, setBugreportEnabled] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [bugOpen, setBugOpen] = useState(false);
  const [screenshotHidden, setScreenshotHidden] = useState(false);

  // Review form
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [reviewPreview, setReviewPreview] = useState<string | null>(null);

  // Bug form
  const [bugTitle, setBugTitle] = useState("");
  const [bugDesc, setBugDesc] = useState("");
  const [bugPriority, setBugPriority] = useState("normal");
  const [bugSending, setBugSending] = useState(false);
  const [bugFile, setBugFile] = useState<File | null>(null);
  const [bugPreview, setBugPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("app_settings").select("key, value")
        .in("key", ["widget_reviews_enabled", "widget_bugreport_enabled"]);
      if (data) {
        data.forEach(s => {
          if (s.key === "widget_reviews_enabled") setReviewsEnabled(s.value === "true");
          if (s.key === "widget_bugreport_enabled") setBugreportEnabled(s.value === "true");
        });
      }
    };
    fetchSettings();
  }, []);

  const submitReview = async () => {
    if (!user) { toast.error("Войдите чтобы оставить отзыв"); return; }
    if (!reviewMessage.trim()) { toast.error("Напишите отзыв"); return; }
    setReviewSending(true);

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    if (reviewFile) {
      attachmentUrl = await uploadAttachment(reviewFile, user.id);
      attachmentName = reviewFile.name;
      if (!attachmentUrl) { setReviewSending(false); return; }
    }

    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      name: reviewName || user.user_metadata?.display_name || "Пользователь",
      rating: reviewRating,
      message: reviewMessage,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    });
    if (error) toast.error("Ошибка отправки");
    else {
      toast.success("Спасибо за отзыв! Он будет опубликован после модерации.");
      setReviewOpen(false);
      setReviewName(""); setReviewRating(5); setReviewMessage("");
      setReviewFile(null); setReviewPreview(null);
    }
    setReviewSending(false);
  };

  const submitBug = async () => {
    if (!user) { toast.error("Войдите чтобы отправить баг-репорт"); return; }
    if (!bugTitle.trim() || !bugDesc.trim()) { toast.error("Заполните все поля"); return; }
    setBugSending(true);

    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    if (bugFile) {
      attachmentUrl = await uploadAttachment(bugFile, user.id);
      attachmentName = bugFile.name;
      if (!attachmentUrl) { setBugSending(false); return; }
    }

    const { error } = await supabase.from("bug_reports").insert({
      user_id: user.id,
      title: bugTitle,
      description: bugDesc,
      priority: bugPriority,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    });
    if (error) toast.error("Ошибка отправки");
    else {
      toast.success("Баг-репорт отправлен! Спасибо за помощь.");
      setBugOpen(false);
      setBugTitle(""); setBugDesc(""); setBugPriority("normal");
      setBugFile(null); setBugPreview(null);
    }
    setBugSending(false);
  };

  const hasAnyWidget = reviewsEnabled || bugreportEnabled;
  if (!hasAnyWidget) return null;

  return (
    <>
      {/* Floating buttons */}
      <div className="fixed bottom-20 right-4 z-[9999] flex flex-col gap-2 items-end">
        {bugreportEnabled && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setBugOpen(true); setReviewOpen(false); }}
            className="w-11 h-11 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center hover:bg-orange-600 transition-colors"
            title="Сообщить о баге"
          >
            <Bug className="w-5 h-5" />
          </motion.button>
        )}
        {reviewsEnabled && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setReviewOpen(true); setBugOpen(false); }}
            className="w-11 h-11 rounded-full bg-pink-500 text-white shadow-lg shadow-pink-500/30 flex items-center justify-center hover:bg-pink-600 transition-colors"
            title="Оставить отзыв"
          >
            <MessageSquareHeart className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Review modal */}
      <AnimatePresence>
        {reviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setReviewOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border/60 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-gradient-to-r from-pink-500/10 to-purple-500/10">
                <div className="flex items-center gap-2">
                  <MessageSquareHeart className="w-5 h-5 text-pink-500" />
                  <h3 className="font-semibold text-foreground">Оставить отзыв</h3>
                </div>
                <button onClick={() => setReviewOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Ваше имя</label>
                  <Input value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Необязательно" className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Оценка</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <button key={i} onClick={() => setReviewRating(i)} className="p-0.5">
                        <Star className={`w-6 h-6 transition-colors ${i <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Отзыв *</label>
                  <Textarea value={reviewMessage} onChange={(e) => setReviewMessage(e.target.value)} placeholder="Расскажите о вашем опыте..." rows={3} className="text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Прикрепить фото</label>
                  <FileUpload
                    file={reviewFile}
                    preview={reviewPreview}
                    onFileChange={(f, p) => { setReviewFile(f); setReviewPreview(p); }}
                    onBeforeScreenshot={() => setScreenshotHidden(true)}
                    onAfterScreenshot={() => setScreenshotHidden(false)}
                  />
                </div>
                <Button onClick={submitReview} disabled={reviewSending || !reviewMessage.trim()} className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                  <Send className="w-4 h-4 mr-2" /> {reviewSending ? "Отправка..." : "Отправить"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bug report modal */}
      <AnimatePresence>
        {bugOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setBugOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border/60 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-gradient-to-r from-orange-500/10 to-red-500/10">
                <div className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-foreground">Сообщить о баге</h3>
                </div>
                <button onClick={() => setBugOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Заголовок *</label>
                  <Input value={bugTitle} onChange={(e) => setBugTitle(e.target.value)} placeholder="Кратко опишите баг" className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Описание *</label>
                  <Textarea value={bugDesc} onChange={(e) => setBugDesc(e.target.value)} placeholder="Шаги для воспроизведения, ожидаемое/фактическое поведение..." rows={4} className="text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Скриншот / фото</label>
                  <FileUpload
                    file={bugFile}
                    preview={bugPreview}
                    onFileChange={(f, p) => { setBugFile(f); setBugPreview(p); }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Приоритет</label>
                  <select
                    value={bugPriority}
                    onChange={(e) => setBugPriority(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="low">Низкий</option>
                    <option value="normal">Обычный</option>
                    <option value="high">Высокий</option>
                    <option value="critical">Критический</option>
                  </select>
                </div>
                <Button onClick={submitBug} disabled={bugSending || !bugTitle.trim() || !bugDesc.trim()} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <Send className="w-4 h-4 mr-2" /> {bugSending ? "Отправка..." : "Отправить баг-репорт"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SiteWidgets;
