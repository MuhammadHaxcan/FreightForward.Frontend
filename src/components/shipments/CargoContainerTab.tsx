import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { calculateCbm } from "@/lib/cargoCalculations";
import { ShipmentContainer, ShipmentCargo } from "@/services/api/shipment";
import { PackageType } from "@/services/api/settings";

export interface CargoFormEntry {
  quantity: string;
  packageTypeId: string;
  loadType: string;
  length: string;
  width: string;
  height: string;
  volumeUnit: string;
  weight: string;
  weightUnit: string;
  totalCBM: string;
  totalWeight: string;
  description: string;
}

export interface CargoContainerTabProps {
  isFCL: boolean;
  // Container props
  containers: Array<Partial<ShipmentContainer> & { sNo?: number | string }>;
  containerSummary: string;
  onAddContainer: () => void;
  onEditContainer: (container: Partial<ShipmentContainer> & { sNo?: number | string }, index: number) => void;
  onDeleteContainer: (id: number, containerNumber?: string) => void;
  // Cargo props
  cargoDetails: ShipmentCargo[];
  newCargoEntry: CargoFormEntry;
  onNewCargoEntryChange: (entry: CargoFormEntry) => void;
  cargoCalculationMode: string;
  onCargoCalculationModeChange: (mode: string) => void;
  onAddCargo: () => void;
  onDeleteCargo: (id: number, description?: string) => void;
  isSavingCargo: boolean;
  isShipmentSaved: boolean;
  packageTypesByCategory: Record<string, PackageType[]>;
}

export function CargoContainerTab({
  isFCL,
  containers,
  containerSummary,
  onAddContainer,
  onEditContainer,
  onDeleteContainer,
  cargoDetails,
  newCargoEntry,
  onNewCargoEntryChange,
  cargoCalculationMode,
  onCargoCalculationModeChange,
  onAddCargo,
  onDeleteCargo,
  isSavingCargo,
  isShipmentSaved,
  packageTypesByCategory,
}: CargoContainerTabProps) {
  const setField = (field: keyof CargoFormEntry, value: string) => {
    onNewCargoEntryChange({ ...newCargoEntry, [field]: value });
  };

  // Compute per-unit CBM from current form values (units mode)
  const currentCbm = cargoCalculationMode === "units"
    ? calculateCbm(
        parseFloat(newCargoEntry.length) || undefined,
        parseFloat(newCargoEntry.width) || undefined,
        parseFloat(newCargoEntry.height) || undefined,
        newCargoEntry.volumeUnit
      )
    : undefined;

  // Totals from saved cargo rows
  const totalVolume = cargoDetails.reduce((sum, row) => sum + (row.cbm || 0) * row.quantity, 0);
  const totalCbm = cargoDetails.reduce((sum, row) => sum + (row.totalCBM || row.cbm || 0), 0);
  const totalWeight = cargoDetails.reduce(
    (sum, row) => sum + (row.totalWeight || (row.weight || 0) * row.quantity),
    0
  );

  const packageTypeOptions = Object.entries(packageTypesByCategory).flatMap(([, types]) =>
    types.map((pt) => ({ value: pt.id.toString(), label: `${pt.code} - ${pt.name}` }))
  );

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      {/* ── CONTAINERS SECTION (FCL only) ── */}
      {isFCL && (
        <>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-emerald-600 font-semibold text-lg">Containers</h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{containerSummary}</span>
                <Button className="btn-success" onClick={onAddContainer}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Container
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead className="text-table-header-foreground">S.No</TableHead>
                  <TableHead className="text-table-header-foreground">Container</TableHead>
                  <TableHead className="text-table-header-foreground">Type</TableHead>
                  <TableHead className="text-table-header-foreground">Seal No.</TableHead>
                  <TableHead className="text-table-header-foreground">No. of Pcs</TableHead>
                  <TableHead className="text-table-header-foreground">Package Type</TableHead>
                  <TableHead className="text-table-header-foreground">Gross Weight</TableHead>
                  <TableHead className="text-table-header-foreground">Volume</TableHead>
                  <TableHead className="text-table-header-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No containers
                    </TableCell>
                  </TableRow>
                ) : (
                  containers.map((container, index) => (
                    <TableRow key={container.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="text-emerald-600">{container.containerNumber}</TableCell>
                      <TableCell>{container.containerTypeName || "-"}</TableCell>
                      <TableCell className="text-emerald-600">{container.sealNo}</TableCell>
                      <TableCell>{container.noOfPcs}</TableCell>
                      <TableCell>{container.packageTypeName || "-"}</TableCell>
                      <TableCell>{(container.grossWeight || 0).toFixed(3)}</TableCell>
                      <TableCell className="text-emerald-600">{(container.volume || 0).toFixed(3)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 btn-success rounded"
                            onClick={() => onEditContainer(container, index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                            onClick={() => onDeleteContainer(container.id as number, container.containerNumber)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="border-t border-border" />
        </>
      )}

      {/* ── CARGO SECTION (always shown) ── */}
      <div className="space-y-4">
        <h3 className="text-emerald-600 font-semibold text-lg">Cargo Details</h3>

        {/* Calculation mode toggle */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className={cargoCalculationMode === "units" ? "btn-success" : "bg-transparent text-primary hover:bg-primary/10 border border-border"}
            variant={cargoCalculationMode === "units" ? "default" : "ghost"}
            onClick={() => onCargoCalculationModeChange("units")}
          >
            Calculate by Units
          </Button>
          <Button
            size="sm"
            className={cargoCalculationMode === "shipment" ? "btn-success" : "bg-transparent text-primary hover:bg-primary/10 border border-border"}
            variant={cargoCalculationMode === "shipment" ? "default" : "ghost"}
            onClick={() => onCargoCalculationModeChange("shipment")}
          >
            Calculate by Total Shipment
          </Button>
        </div>

        {/* ── UNITS MODE FORM ── */}
        {cargoCalculationMode === "units" && (
          <div className="space-y-3">
            {/* Column headers */}
            <div className="grid grid-cols-11 gap-2 text-sm font-medium text-muted-foreground">
              <div>Qty *</div>
              <div>Package Type</div>
              <div>Length</div>
              <div>Width</div>
              <div>Height</div>
              <div>Unit</div>
              <div>CBM (auto)</div>
              <div>Weight</div>
              <div>Unit</div>
              <div>Description</div>
              <div></div>
            </div>
            {/* Input row */}
            <div className="grid grid-cols-11 gap-2">
              <Input
                type="number"
                placeholder="Qty"
                value={newCargoEntry.quantity}
                onChange={(e) => setField("quantity", e.target.value)}
              />
              <SearchableSelect
                options={packageTypeOptions}
                value={newCargoEntry.packageTypeId}
                onValueChange={(v) => setField("packageTypeId", v)}
                placeholder="Select"
                searchPlaceholder="Search..."
              />
              <Input
                type="number"
                placeholder="L"
                value={newCargoEntry.length}
                onChange={(e) => setField("length", e.target.value)}
              />
              <Input
                type="number"
                placeholder="W"
                value={newCargoEntry.width}
                onChange={(e) => setField("width", e.target.value)}
              />
              <Input
                type="number"
                placeholder="H"
                value={newCargoEntry.height}
                onChange={(e) => setField("height", e.target.value)}
              />
              <SearchableSelect
                options={[
                  { value: "cm", label: "CM" },
                  { value: "meter", label: "Meter" },
                  { value: "inch", label: "Inch" },
                ]}
                value={newCargoEntry.volumeUnit}
                onValueChange={(v) => setField("volumeUnit", v)}
                placeholder="CM"
                searchPlaceholder=""
              />
              <Input
                type="number"
                placeholder="CBM"
                value={currentCbm !== undefined ? currentCbm.toFixed(6) : ""}
                disabled
                className="bg-muted"
              />
              <Input
                type="number"
                placeholder="Weight"
                value={newCargoEntry.weight}
                onChange={(e) => setField("weight", e.target.value)}
              />
              <SearchableSelect
                options={[
                  { value: "kg", label: "KG" },
                  { value: "lb", label: "LB" },
                ]}
                value={newCargoEntry.weightUnit}
                onValueChange={(v) => setField("weightUnit", v)}
                placeholder="KG"
                searchPlaceholder=""
              />
              <Input
                placeholder="Description"
                value={newCargoEntry.description}
                onChange={(e) => setField("description", e.target.value)}
              />
              <Button
                className="btn-success"
                onClick={onAddCargo}
                disabled={isSavingCargo || !isShipmentSaved}
              >
                {isSavingCargo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── SHIPMENT MODE FORM ── */}
        {cargoCalculationMode === "shipment" && (
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-4 items-end">
              <div>
                <Label className="text-sm font-semibold">Qty *</Label>
                <Input
                  type="number"
                  placeholder="Qty"
                  value={newCargoEntry.quantity}
                  onChange={(e) => setField("quantity", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Package Type</Label>
                <SearchableSelect
                  options={packageTypeOptions}
                  value={newCargoEntry.packageTypeId}
                  onValueChange={(v) => setField("packageTypeId", v)}
                  placeholder="Select"
                  searchPlaceholder="Search..."
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Total CBM</Label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={newCargoEntry.totalCBM}
                  onChange={(e) => setField("totalCBM", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Total Weight (KG)</Label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={newCargoEntry.totalWeight}
                  onChange={(e) => setField("totalWeight", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Description</Label>
                <Textarea
                  placeholder="Description"
                  value={newCargoEntry.description}
                  onChange={(e) => setField("description", e.target.value)}
                  className="min-h-[38px] h-[38px]"
                />
              </div>
              <div>
                <Button
                  className="btn-success w-full"
                  onClick={onAddCargo}
                  disabled={isSavingCargo || !isShipmentSaved}
                >
                  {isSavingCargo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Cargo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── CARGO TABLE ── */}
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header">
              <TableHead className="text-table-header-foreground">S.No</TableHead>
              <TableHead className="text-table-header-foreground">Qty</TableHead>
              <TableHead className="text-table-header-foreground">Package Type</TableHead>
              <TableHead className="text-table-header-foreground">L</TableHead>
              <TableHead className="text-table-header-foreground">W</TableHead>
              <TableHead className="text-table-header-foreground">H</TableHead>
              <TableHead className="text-table-header-foreground">Unit</TableHead>
              <TableHead className="text-table-header-foreground">CBM/Unit</TableHead>
              <TableHead className="text-table-header-foreground">Total CBM</TableHead>
              <TableHead className="text-table-header-foreground">Weight</TableHead>
              <TableHead className="text-table-header-foreground">Wt. Unit</TableHead>
              <TableHead className="text-table-header-foreground">Total Weight</TableHead>
              <TableHead className="text-table-header-foreground">Description</TableHead>
              <TableHead className="text-table-header-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargoDetails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                  No cargo details
                </TableCell>
              </TableRow>
            ) : (
              cargoDetails.map((cargo, index) => {
                const isUnitsMode = (cargo.calculationMode || "units") === "units";
                const computedTotalCbm = isUnitsMode
                  ? (cargo.cbm || 0) * cargo.quantity
                  : (cargo.totalCBM || 0);
                const computedTotalWeight = isUnitsMode
                  ? (cargo.weight || 0) * cargo.quantity
                  : (cargo.totalWeight || 0);
                return (
                  <TableRow key={cargo.id ?? `new-${index}`} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{cargo.quantity}</TableCell>
                    <TableCell>{cargo.packageTypeName || "—"}</TableCell>
                    {isUnitsMode ? (
                      <>
                        <TableCell>{cargo.length?.toFixed(2) || "—"}</TableCell>
                        <TableCell>{cargo.width?.toFixed(2) || "—"}</TableCell>
                        <TableCell>{cargo.height?.toFixed(2) || "—"}</TableCell>
                        <TableCell>{cargo.volumeUnit?.toUpperCase() || "CM"}</TableCell>
                        <TableCell className="text-emerald-600">{cargo.cbm?.toFixed(6) || "—"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                      </>
                    )}
                    <TableCell className="text-emerald-600">{computedTotalCbm.toFixed(3)}</TableCell>
                    {isUnitsMode ? (
                      <>
                        <TableCell>{cargo.weight?.toFixed(3) || "—"}</TableCell>
                        <TableCell>{cargo.weightUnit?.toUpperCase() || "KG"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                      </>
                    )}
                    <TableCell>{computedTotalWeight.toFixed(3)}</TableCell>
                    <TableCell>{cargo.description || "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                        onClick={() => onDeleteCargo(cargo.id, cargo.description)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* ── TOTALS ── */}
        {cargoDetails.length > 0 && (
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Total Volume (CBM × Qty)</Label>
              <Input value={totalVolume.toFixed(3)} readOnly className="bg-muted" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Total CBM</Label>
              <Input value={totalCbm.toFixed(3)} readOnly className="bg-muted" />
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Total Weight</Label>
              <Input value={totalWeight.toFixed(3)} readOnly className="bg-muted" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
