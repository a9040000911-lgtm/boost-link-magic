import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

interface BotButton {
  id: string;
  row: number;
}

interface ButtonDef {
  id: string;
  label: string;
  icon: string;
  action_type: string;
  action_value: string;
  category: string;
  description: string;
}

interface Props {
  buttons: BotButton[];
  setButtons: (buttons: BotButton[]) => void;
  buttonLibrary: ButtonDef[];
}

export function BotButtonLayoutEditor({ buttons, setButtons, buttonLibrary }: Props) {
  const getButtonDef = (id: string) => buttonLibrary.find(b => b.id === id);

  // Group buttons by row
  const groupedButtons = buttons.reduce<Record<number, (BotButton & { idx: number })[]>>((acc, btn, idx) => {
    if (!acc[btn.row]) acc[btn.row] = [];
    acc[btn.row].push({ ...btn, idx });
    return acc;
  }, {});

  const rows = Object.keys(groupedButtons).map(Number).sort((a, b) => a - b);

  const addRow = () => {
    const maxRow = rows.length > 0 ? Math.max(...rows) + 1 : 0;
    // Add empty row marker — we'll add a button to it
    setButtons([...buttons]);
    // Actually we need to prompt to add a button. Let's just create the row number reference
    // We'll show an "add button to row" UI
  };

  const addButtonToRow = (row: number, btnId: string) => {
    const rowBtns = buttons.filter(b => b.row === row);
    if (rowBtns.length >= 3) return; // max 3 per row
    setButtons([...buttons, { id: btnId, row }]);
  };

  const addButtonToNewRow = (btnId: string) => {
    const maxRow = rows.length > 0 ? Math.max(...rows) + 1 : 0;
    setButtons([...buttons, { id: btnId, row: maxRow }]);
  };

  const removeButton = (idx: number) => {
    setButtons(buttons.filter((_, i) => i !== idx));
  };

  const moveRowUp = (row: number) => {
    const rowIdx = rows.indexOf(row);
    if (rowIdx <= 0) return;
    const prevRow = rows[rowIdx - 1];
    setButtons(buttons.map(b => {
      if (b.row === row) return { ...b, row: prevRow };
      if (b.row === prevRow) return { ...b, row: row };
      return b;
    }));
  };

  const moveRowDown = (row: number) => {
    const rowIdx = rows.indexOf(row);
    if (rowIdx >= rows.length - 1) return;
    const nextRow = rows[rowIdx + 1];
    setButtons(buttons.map(b => {
      if (b.row === row) return { ...b, row: nextRow };
      if (b.row === nextRow) return { ...b, row: row };
      return b;
    }));
  };

  const deleteRow = (row: number) => {
    setButtons(buttons.filter(b => b.row !== row));
  };

  const categoryLabels: Record<string, string> = {
    navigation: "🧭 Навигация",
    support: "🎧 Поддержка",
    orders: "🛒 Заказы",
    account: "👤 Аккаунт",
    general: "⚙️ Общее",
  };

  const groupedLibrary = buttonLibrary.reduce<Record<string, ButtonDef[]>>((acc, btn) => {
    if (!acc[btn.category]) acc[btn.category] = [];
    acc[btn.category].push(btn);
    return acc;
  }, {});

  const usedIds = new Set(buttons.map(b => b.id));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Current layout */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Раскладка кнопок ({buttons.length})</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => {
                // Find first unused button
                const unused = buttonLibrary.find(b => !usedIds.has(b.id));
                if (unused) addButtonToNewRow(unused.id);
              }}
            >
              <Plus className="h-3 w-3 mr-1" /> Новая линия
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((row, rowIdx) => {
            const rowBtns = groupedButtons[row];
            const canAddMore = rowBtns.length < 3;
            return (
              <div key={row} className="border rounded-lg p-2 bg-muted/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Линия {rowIdx + 1} ({rowBtns.length}/3)
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveRowUp(row)} disabled={rowIdx === 0}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveRowDown(row)} disabled={rowIdx === rows.length - 1}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteRow(row)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {rowBtns.map(btn => {
                    const def = getButtonDef(btn.id);
                    return (
                      <div key={btn.idx} className="flex items-center gap-1 bg-background border rounded-md px-2 py-1.5 text-xs">
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                        <span>{def?.icon || "?"} {def?.label || btn.id}</span>
                        <button onClick={() => removeButton(btn.idx)} className="text-destructive hover:text-destructive/80 ml-1">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                  {canAddMore && (
                    <DropdownAddButton
                      buttonLibrary={buttonLibrary}
                      usedIds={usedIds}
                      onSelect={(btnId) => addButtonToRow(row, btnId)}
                      categoryLabels={categoryLabels}
                      groupedLibrary={groupedLibrary}
                    />
                  )}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Добавьте кнопки из библиотеки справа →
            </p>
          )}
        </CardContent>
      </Card>

      {/* Button library */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Библиотека кнопок</CardTitle>
          <p className="text-xs text-muted-foreground">Нажмите на кнопку чтобы добавить в новую линию</p>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
          {Object.entries(groupedLibrary).map(([cat, btns]) => (
            <div key={cat}>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{categoryLabels[cat] || cat}</p>
              <div className="flex flex-wrap gap-1.5">
                {btns.map(btn => {
                  const isAdded = usedIds.has(btn.id);
                  return (
                    <Button
                      key={btn.id}
                      size="sm"
                      variant={isAdded ? "secondary" : "outline"}
                      className="text-xs h-7"
                      onClick={() => !isAdded && addButtonToNewRow(btn.id)}
                      disabled={isAdded}
                      title={btn.description || ""}
                    >
                      {btn.icon} {btn.label.replace(btn.icon || "", "").trim()}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Small inline "add button" dropdown
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

function DropdownAddButton({
  buttonLibrary,
  usedIds,
  onSelect,
  categoryLabels,
  groupedLibrary,
}: {
  buttonLibrary: ButtonDef[];
  usedIds: Set<string>;
  onSelect: (id: string) => void;
  categoryLabels: Record<string, string>;
  groupedLibrary: Record<string, ButtonDef[]>;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 border border-dashed rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
          <Plus className="h-3 w-3" /> Добавить
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {Object.entries(groupedLibrary).map(([cat, btns]) => (
              <div key={cat}>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">{categoryLabels[cat] || cat}</p>
                <div className="flex flex-wrap gap-1">
                  {btns.filter(b => !usedIds.has(b.id)).map(btn => (
                    <Button
                      key={btn.id}
                      size="sm"
                      variant="ghost"
                      className="text-[11px] h-6 px-2"
                      onClick={() => onSelect(btn.id)}
                    >
                      {btn.icon} {btn.label.replace(btn.icon || "", "").trim()}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
