import { useAllCountries } from "@/hooks/useSettings";
import { calculateCbm } from "@/lib/cargoCalculations";
import { ShipmentContainer, ShipmentCargo } from "@/services/api/shipment";
import { PackageType } from "@/services/api/settings";
import { Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

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
  marksNumbers: string;
  hsCode: string;
  countryOfOriginId: string;
  isDangerousGoods: boolean;
  imcoClass: string;
  unNo: string;
}

export interface CargoContainerTabProps {
  isReadOnly?: boolean;
  showContainers: boolean;
  containers: Array<Partial<ShipmentContainer> & { sNo?: number | string }>;
  containerSummary: string;
  onAddContainer: () => void;
  onEditContainer: (container: Partial<ShipmentContainer> & { sNo?: number | string }, index: number) => void;
  onDeleteContainer: (id: number, containerNumber?: string) => void;
  cargoDetails: ShipmentCargo[];
  newCargoEntry: CargoFormEntry;
  onNewCargoEntryChange: (entry: CargoFormEntry) => void;
  cargoCalculationMode: string;
  onCargoCalculationModeChange: (mode: string) => void;
  onAddCargo: () => void;
  onEditCargo: (cargo: ShipmentCargo) => void;
  onCancelCargoEdit: () => void;
  onDeleteCargo: (id: number, description?: string) => void;
  isSavingCargo: boolean;
  isShipmentSaved: boolean;
  packageTypesByCategory: Record<string, PackageType[]>;
  editingCargoId?: number | null;
}

export function CargoContainerTab({
  isReadOnly = false,
  showContainers,
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
  onEditCargo,
  onCancelCargoEdit,
  onDeleteCargo,
  isSavingCargo,
  isShipmentSaved,
  packageTypesByCategory,
  editingCargoId,
}: CargoContainerTabProps) {
  const { data: countries = [] } = useAllCountries();

  const setField = (field: keyof CargoFormEntry, value: string) => {
    onNewCargoEntryChange({ ...newCargoEntry, [field]: value });
  };

  const setBoolField = (field: keyof CargoFormEntry, value: boolean) => {
    onNewCargoEntryChange({ ...newCargoEntry, [field]: value });
  };

  const currentCbm = cargoCalculationMode === "units"
    ? calculateCbm(
        parseFloat(newCargoEntry.length) || undefined,
        parseFloat(newCargoEntry.width) || undefined,
        parseFloat(newCargoEntry.height) || undefined,
        newCargoEntry.volumeUnit
      )
    : undefined;

  const totalVolume = cargoDetails.reduce((sum, row) => sum + (row.cbm || 0) * row.quantity, 0);
  const totalCbm = cargoDetails.reduce((sum, row) => sum + (row.totalCBM || row.cbm || 0), 0);
  const totalWeight = cargoDetails.reduce(
    (sum, row) => sum + (row.totalWeight || (row.weight || 0) * row.quantity),
    0
  );

  const packageTypeOptions = Object.entries(packageTypesByCategory).flatMap(([, types]) =>
    types.map((pt) => ({ value: pt.id.toString(), label: `${pt.code} - ${pt.name}` }))
  );
  const countryOptions = countries.map((country) => ({
    value: country.id.toString(),
    label: `${country.name} (${country.code})`,
  }));

  const dgLabel = (cargo: ShipmentCargo) => {
    if (!cargo.isDangerousGoods) return "Non DG";

    const details = [cargo.imcoClass, cargo.unNo].filter(Boolean).join(" / ");
    return details ? `DG (${details})` : "DG";
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      {showContainers && (
        <>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-emerald-600 font-semibold text-lg">Containers</h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{containerSummary}</span>
                {!isReadOnly && (
                  <Button className="btn-success" onClick={onAddContainer}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Container
                  </Button>
                )}
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
                        {!isReadOnly && (
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
                        )}
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

      <div className="space-y-4">
        <h3 className="text-emerald-600 font-semibold text-lg">Cargo Details</h3>

        <div className="flex gap-2">
          <Button
            size="sm"
            className={cargoCalculationMode === "units" ? "btn-success" : "bg-transparent text-primary hover:bg-primary/10 border border-border"}
            variant={cargoCalculationMode === "units" ? "default" : "ghost"}
            onClick={() => onCargoCalculationModeChange("units")}
            disabled={isReadOnly}
          >
            Calculate by Units
          </Button>
          <Button
            size="sm"
            className={cargoCalculationMode === "shipment" ? "btn-success" : "bg-transparent text-primary hover:bg-primary/10 border border-border"}
            variant={cargoCalculationMode === "shipment" ? "default" : "ghost"}
            onClick={() => onCargoCalculationModeChange("shipment")}
            disabled={isReadOnly}
          >
            Calculate by Total Shipment
          </Button>
        </div>

        {cargoCalculationMode === "units" && (
          <div className="space-y-3">
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
            <div className="grid grid-cols-11 gap-2">
              <Input type="number" placeholder="Qty" value={newCargoEntry.quantity} onChange={(e) => setField("quantity", e.target.value)} disabled={isReadOnly} />
              <SearchableSelect options={packageTypeOptions} value={newCargoEntry.packageTypeId} onValueChange={(v) => setField("packageTypeId", v)} disabled={isReadOnly} placeholder="Select" searchPlaceholder="Search..." />
              <Input type="number" placeholder="L" value={newCargoEntry.length} onChange={(e) => setField("length", e.target.value)} disabled={isReadOnly} />
              <Input type="number" placeholder="W" value={newCargoEntry.width} onChange={(e) => setField("width", e.target.value)} disabled={isReadOnly} />
              <Input type="number" placeholder="H" value={newCargoEntry.height} onChange={(e) => setField("height", e.target.value)} disabled={isReadOnly} />
              <SearchableSelect
                options={[
                  { value: "cm", label: "CM" },
                  { value: "meter", label: "Meter" },
                  { value: "inch", label: "Inch" },
                ]}
                value={newCargoEntry.volumeUnit}
                onValueChange={(v) => setField("volumeUnit", v)}
                disabled={isReadOnly}
                placeholder="CM"
                searchPlaceholder=""
              />
              <Input type="number" placeholder="CBM" value={currentCbm !== undefined ? currentCbm.toFixed(6) : ""} disabled className="bg-muted" />
              <Input type="number" placeholder="Weight" value={newCargoEntry.weight} onChange={(e) => setField("weight", e.target.value)} disabled={isReadOnly} />
              <SearchableSelect
                options={[
                  { value: "kg", label: "KG" },
                  { value: "lb", label: "LB" },
                ]}
                value={newCargoEntry.weightUnit}
                onValueChange={(v) => setField("weightUnit", v)}
                disabled={isReadOnly}
                placeholder="KG"
                searchPlaceholder=""
              />
              <Input placeholder="Description" value={newCargoEntry.description} onChange={(e) => setField("description", e.target.value)} disabled={isReadOnly} />
              <Button className="btn-success" onClick={onAddCargo} disabled={isReadOnly || isSavingCargo || !isShipmentSaved}>
                {isSavingCargo ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCargoId ? "Update" : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {cargoCalculationMode === "shipment" && (
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-4 items-end">
              <div>
                <Label className="text-sm font-semibold">Qty *</Label>
                <Input type="number" placeholder="Qty" value={newCargoEntry.quantity} onChange={(e) => setField("quantity", e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <Label className="text-sm font-semibold">Package Type</Label>
                <SearchableSelect options={packageTypeOptions} value={newCargoEntry.packageTypeId} onValueChange={(v) => setField("packageTypeId", v)} disabled={isReadOnly} placeholder="Select" searchPlaceholder="Search..." />
              </div>
              <div>
                <Label className="text-sm font-semibold">Total CBM</Label>
                <Input type="number" step="0.001" placeholder="0.000" value={newCargoEntry.totalCBM} onChange={(e) => setField("totalCBM", e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <Label className="text-sm font-semibold">Total Weight (KG)</Label>
                <Input type="number" step="0.001" placeholder="0.000" value={newCargoEntry.totalWeight} onChange={(e) => setField("totalWeight", e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <Label className="text-sm font-semibold">Description</Label>
                <Textarea placeholder="Description" value={newCargoEntry.description} onChange={(e) => setField("description", e.target.value)} className="min-h-[38px] h-[38px]" disabled={isReadOnly} />
              </div>
              <div>
                <Button className="btn-success w-full" onClick={onAddCargo} disabled={isReadOnly || isSavingCargo || !isShipmentSaved}>
                  {isSavingCargo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {editingCargoId ? "Update Cargo" : "Add Cargo"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 items-start">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Marks & Nos</Label>
            <Input value={newCargoEntry.marksNumbers} onChange={(e) => setField("marksNumbers", e.target.value)} disabled={isReadOnly} placeholder="Marks and numbers" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-semibold">HS Code</Label>
            <Input value={newCargoEntry.hsCode} onChange={(e) => setField("hsCode", e.target.value)} disabled={isReadOnly} placeholder="HS code" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Country of Origin</Label>
            <SearchableSelect
              options={countryOptions}
              value={newCargoEntry.countryOfOriginId}
              onValueChange={(v) => setField("countryOfOriginId", v)}
              disabled={isReadOnly}
              placeholder="Select country"
              searchPlaceholder="Search countries..."
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Dangerous Goods</Label>
            <div className="flex min-h-10 items-center rounded-md border border-input bg-background px-3">
              <div className="flex items-center space-x-2">
                <Checkbox checked={newCargoEntry.isDangerousGoods} onCheckedChange={(checked) => setBoolField("isDangerousGoods", checked === true)} disabled={isReadOnly} />
                <Label className="text-sm font-medium">Mark cargo as DG</Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">If enabled, fill IMCO class and UN No.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <Label className="text-sm font-semibold">IMCO Class</Label>
            <Input value={newCargoEntry.imcoClass} onChange={(e) => setField("imcoClass", e.target.value)} disabled={isReadOnly || !newCargoEntry.isDangerousGoods} placeholder="IMCO class" />
          </div>
          <div>
            <Label className="text-sm font-semibold">UN No</Label>
            <Input value={newCargoEntry.unNo} onChange={(e) => setField("unNo", e.target.value)} disabled={isReadOnly || !newCargoEntry.isDangerousGoods} placeholder="UN number" />
          </div>
          <div className="flex items-end justify-end">
            {editingCargoId && (
              <Button variant="outline" onClick={onCancelCargoEdit} disabled={isReadOnly || isSavingCargo}>
                Cancel Edit
              </Button>
            )}
          </div>
        </div>

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
              <TableHead className="text-table-header-foreground">Marks & Nos</TableHead>
              <TableHead className="text-table-header-foreground">HS Code</TableHead>
              <TableHead className="text-table-header-foreground">Origin</TableHead>
              <TableHead className="text-table-header-foreground">DG</TableHead>
              <TableHead className="text-table-header-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargoDetails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={18} className="text-center text-muted-foreground py-8">
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
                    <TableCell>{cargo.packageTypeName || "-"}</TableCell>
                    {isUnitsMode ? (
                      <>
                        <TableCell>{cargo.length?.toFixed(2) || "-"}</TableCell>
                        <TableCell>{cargo.width?.toFixed(2) || "-"}</TableCell>
                        <TableCell>{cargo.height?.toFixed(2) || "-"}</TableCell>
                        <TableCell>{cargo.volumeUnit?.toUpperCase() || "CM"}</TableCell>
                        <TableCell className="text-emerald-600">{cargo.cbm?.toFixed(6) || "-"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                      </>
                    )}
                    <TableCell className="text-emerald-600">{computedTotalCbm.toFixed(3)}</TableCell>
                    {isUnitsMode ? (
                      <>
                        <TableCell>{cargo.weight?.toFixed(3) || "-"}</TableCell>
                        <TableCell>{cargo.weightUnit?.toUpperCase() || "KG"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                      </>
                    )}
                    <TableCell>{computedTotalWeight.toFixed(3)}</TableCell>
                    <TableCell>{cargo.description || "-"}</TableCell>
                    <TableCell>{cargo.marksNumbers || "-"}</TableCell>
                    <TableCell>{cargo.hsCode || "-"}</TableCell>
                    <TableCell>{cargo.countryOfOriginName || "-"}</TableCell>
                    <TableCell>{dgLabel(cargo)}</TableCell>
                    <TableCell>
                      {!isReadOnly && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 btn-success rounded"
                            onClick={() => onEditCargo(cargo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                            onClick={() => onDeleteCargo(cargo.id, cargo.description)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {cargoDetails.length > 0 && (
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Total Volume (CBM x Qty)</Label>
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
