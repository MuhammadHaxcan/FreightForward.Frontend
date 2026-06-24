import { useState } from "react";
import { Package, Plus, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Unit = "cm" | "mm" | "m" | "in" | "ft";
type Mode = "air" | "courier" | "sea_lcl" | "sea_fcl";

interface Row {
  id: string;
  length: string;
  width: string;
  height: string;
  qty: string;
  weight: string;
}

const UNIT_DIVISORS: Record<Unit, number> = {
  cm: 1_000_000,
  mm: 1_000_000_000,
  m: 1,
  in: 61_023.7,
  ft: 35.3147,
};

const CONTAINERS = [
  { name: "20'GP", cbm: 25,  kg: 21_700 },
  { name: "40'GP", cbm: 67,  kg: 26_500 },
  { name: "40'HC", cbm: 76,  kg: 28_690 },
];

const UNITS: Unit[] = ["cm", "mm", "m", "in", "ft"];

const MODES: { value: Mode; label: string }[] = [
  { value: "air", label: "Air" },
  { value: "courier", label: "Courier" },
  { value: "sea_lcl", label: "Sea LCL" },
  { value: "sea_fcl", label: "Sea FCL" },
];

function newRow(): Row {
  return {
    id: Math.random().toString(36).slice(2),
    length: "",
    width: "",
    height: "",
    qty: "1",
    weight: "",
  };
}

function toPositive(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) || n < 0 ? 0 : n;
}

function calcRowCbm(row: Row, unit: Unit): number {
  const l = toPositive(row.length);
  const w = toPositive(row.width);
  const h = toPositive(row.height);
  const q = toPositive(row.qty);
  return (l * w * h * q) / UNIT_DIVISORS[unit];
}

export function CBMCalculatorWidget() {
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<Unit>("cm");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [mode, setMode] = useState<Mode>("air");
  const [rows, setRows] = useState<Row[]>([newRow()]);

  const totalCbm = rows.reduce((sum, r) => sum + calcRowCbm(r, unit), 0);
  const totalWeightKg = rows.reduce((sum, r) => {
    const q = toPositive(r.qty);
    const w = toPositive(r.weight);
    const wKg = weightUnit === "lbs" ? w * 0.453592 : w;
    return sum + q * wKg;
  }, 0);

  let volWeight = 0;
  let volLabel = "";
  if (mode === "air") { volWeight = totalCbm * (1_000_000 / 6_000); volLabel = "÷6000"; }
  else if (mode === "courier") { volWeight = totalCbm * (1_000_000 / 5_000); volLabel = "÷5000"; }
  else if (mode === "sea_lcl") { volWeight = totalCbm * 1000; volLabel = "×1000 kg/CBM"; }

  const chargeableWeight = mode === "sea_fcl" ? totalWeightKg : Math.max(totalWeightKg, volWeight);
  const chargeableIsVol = mode !== "sea_fcl" && volWeight > 0 && chargeableWeight === volWeight;

  const updateRow = (id: string, field: keyof Row, value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const removeRow = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  const reset = () => { setRows([newRow()]); setUnit("cm"); setWeightUnit("kg"); setMode("air"); };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            aria-label="Open CBM calculator"
            className="fixed right-5 top-1/2 z-40 h-12 w-12 -translate-y-1/2 rounded-full p-0 shadow-lg hover:shadow-xl"
          >
            <Package size={22} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">CBM Calculator</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Package size={17} />
              CBM Calculator
            </DialogTitle>
          </DialogHeader>

          {/* Unit + Mode selectors */}
          <div className="flex flex-wrap gap-4 items-center pb-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium mr-1">Unit:</span>
              {UNITS.map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded border transition-colors",
                    unit === u
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium mr-1">Mode:</span>
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded border transition-colors",
                    mode === m.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium mr-1">Weight:</span>
              {(["kg", "lbs"] as const).map((wu) => (
                <button
                  key={wu}
                  onClick={() => setWeightUnit(wu)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded border transition-colors",
                    weightUnit === wu
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {wu}
                </button>
              ))}
            </div>
          </div>

          {/* Rows table */}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left py-2 pl-3 w-7">#</th>
                  <th className="text-center py-2 px-1">L ({unit})</th>
                  <th className="text-center py-2 px-1">W ({unit})</th>
                  <th className="text-center py-2 px-1">H ({unit})</th>
                  <th className="text-center py-2 px-1">Qty</th>
                  <th className="text-center py-2 px-1">Wt/unit ({weightUnit})</th>
                  <th className="text-center py-2 px-2">CBM</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const rowCbm = calcRowCbm(row, unit);
                  return (
                    <tr key={row.id} className="border-t">
                      <td className="py-1.5 pl-3 text-muted-foreground text-xs">{i + 1}</td>
                      {(["length", "width", "height", "qty", "weight"] as const).map((field) => (
                        <td key={field} className="py-1.5 px-1">
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={row[field]}
                            onChange={(e) => updateRow(row.id, field, e.target.value)}
                            className="h-7 text-xs text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                      ))}
                      <td className="py-1.5 px-2 text-center text-xs font-semibold tabular-nums text-foreground">
                        {rowCbm > 0 ? rowCbm.toFixed(4) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-1.5 pr-2">
                        <button
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                          className="text-muted-foreground hover:text-destructive disabled:opacity-25 transition-colors flex items-center justify-center w-6 h-6"
                        >
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Button variant="outline" size="sm" onClick={addRow} className="w-fit gap-1.5 text-xs h-7">
            <Plus size={13} /> Add Row
          </Button>

          {/* Results */}
          <div className="border-t pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Results
            </p>
            <div className={cn(
              "grid gap-3",
              mode === "sea_fcl" ? "grid-cols-2 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
            )}>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Total CBM</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">
                  {totalCbm > 0 ? totalCbm.toFixed(4) : <span className="text-muted-foreground text-lg">—</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">m³</p>
              </div>

              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Actual Weight</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">
                  {totalWeightKg > 0 ? totalWeightKg.toFixed(2) : <span className="text-muted-foreground text-lg">—</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">kg</p>
              </div>

              {mode !== "sea_fcl" && (
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Vol. Weight</p>
                  <p className="text-2xl font-bold mt-1 tabular-nums">
                    {volWeight > 0 ? volWeight.toFixed(2) : <span className="text-muted-foreground text-lg">—</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">kg ({volLabel})</p>
                </div>
              )}

              <div className={cn(
                "rounded-lg p-3 border",
                chargeableIsVol
                  ? "bg-amber-500/10 border-amber-500/40"
                  : "bg-primary/10 border-primary/30"
              )}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Chargeable Wt
                </p>
                <p className="text-2xl font-bold mt-1 tabular-nums">
                  {chargeableWeight > 0 ? chargeableWeight.toFixed(2) : <span className="text-muted-foreground text-lg">—</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  kg
                  {mode !== "sea_fcl" && chargeableWeight > 0 && (
                    <span className="ml-1 font-medium">
                      ({chargeableIsVol ? "volumetric" : "actual"})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Container utilisation — FCL mode only */}
          {mode === "sea_fcl" && totalCbm > 0 && (
            <div className="border-t pt-4 space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Container Utilisation
              </p>
              {CONTAINERS.map((c) => {
                const cbmRaw = (totalCbm / c.cbm) * 100;
                const wgtRaw = (totalWeightKg / c.kg) * 100;
                const cbmPct = Math.min(cbmRaw, 100);
                const wgtPct = Math.min(wgtRaw, 100);
                const cbmOver = cbmRaw >= 100;
                const wgtOver = wgtRaw >= 100;
                return (
                  <div key={c.name} className="space-y-1.5">
                    <span className="text-xs font-semibold">{c.name}</span>
                    {/* CBM bar */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Volume</span>
                        <span className={cn("tabular-nums", cbmOver && "text-destructive font-medium")}>
                          {totalCbm.toFixed(2)} / {c.cbm} CBM ({cbmRaw.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-300", cbmOver ? "bg-destructive" : "bg-primary")}
                          style={{ width: `${cbmPct}%` }}
                        />
                      </div>
                    </div>
                    {/* Weight bar */}
                    {totalWeightKg > 0 && (
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Weight</span>
                          <span className={cn("tabular-nums", wgtOver && "text-destructive font-medium")}>
                            {totalWeightKg.toFixed(0)} / {c.kg.toLocaleString()} kg ({wgtRaw.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-300", wgtOver ? "bg-destructive" : "bg-amber-500")}
                            style={{ width: `${wgtPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end border-t pt-3 mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="gap-1.5 text-xs text-muted-foreground h-7"
            >
              <RotateCcw size={12} /> Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
