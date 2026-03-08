import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  name?: string;
}

export function VideoPlayer({ src, name }: VideoPlayerProps) {
  const [fullscreen, setFullscreen] = useState(false);

  const videoElement = (className: string) => (
    <video
      src={src}
      controls
      className={className}
      preload="metadata"
    />
  );

  return (
    <div className="max-w-[280px]">
      {name && <p className="text-[10px] text-muted-foreground truncate mb-1">🎬 {name}</p>}
      <div className="relative rounded-lg overflow-hidden bg-black">
        {videoElement("w-full max-h-[200px]")}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
          onClick={() => setFullscreen(true)}
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-none">
          <div className="w-[90vw] h-[85vh] flex items-center justify-center">
            {videoElement("max-w-full max-h-full")}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
