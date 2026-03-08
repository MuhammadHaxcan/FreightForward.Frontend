import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { shipmentApi } from "@/services/api/shipment";
import type { ShipmentParty } from "@/services/api/shipment";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Printer, Minus, Plus, FileText } from "lucide-react";

// Find party by category keyword match
function findParty(parties: ShipmentParty[], ...keywords: string[]) {
  for (const kw of keywords) {
    const found = parties.find((p) =>
      p.customerCategoryName
        ?.toLowerCase()
        .replace(/[^a-z]/g, "")
        .includes(kw.toLowerCase().replace(/[^a-z]/g, ""))
    );
    if (found) return found;
  }
  return undefined;
}

// Format party: name + contact details
function formatParty(party?: ShipmentParty) {
  if (!party) return "";
  const lines = [party.customerName];
  const contact: string[] = [];
  if (party.phone) contact.push(`Tel: ${party.phone}`);
  if (party.mobile) contact.push(`Mob: ${party.mobile}`);
  if (contact.length > 0) lines.push(contact.join("  "));
  if (party.email) lines.push(party.email);
  return lines.join("\n");
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
  } catch {
    return dateStr;
  }
}

// Truncate text at maxLines, return [visible, overflow]
function splitOverflow(
  text: string,
  maxLines: number
): [string, string] {
  if (!text) return ["", ""];
  const lines = text.split("\n");
  if (lines.length <= maxLines) return [text, ""];
  return [
    lines.slice(0, maxLines - 1).join("\n") + "\n***",
    "***\n" + lines.slice(maxLines - 1).join("\n"),
  ];
}

// Shared cell style
const cell: React.CSSProperties = {
  border: "1px solid #bbb",
  padding: "1mm 2mm",
  verticalAlign: "top",
  boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  fontSize: "6.5pt",
  color: "#888",
  marginBottom: "0.5mm",
  fontFamily: "Arial, sans-serif",
};

export default function BillOfLadingViewer() {
  const [jobInput, setJobInput] = useState("");
  const [searchJob, setSearchJob] = useState("");
  const [fontSize, setFontSize] = useState(9);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [topOffset, setTopOffset] = useState(0);
  const [leftOffset, setLeftOffset] = useState(0);

  // Search by job number
  const { data: searchRes, isLoading: searching } = useQuery({
    queryKey: ["bl-search", searchJob],
    queryFn: () => shipmentApi.getAll({ searchTerm: searchJob, pageSize: 20 }),
    enabled: searchJob.length > 0,
  });

  const matched = useMemo(() => {
    const items = searchRes?.data?.items;
    if (!items?.length) return null;
    return items.find((s) => s.jobNumber === searchJob) || items[0];
  }, [searchRes, searchJob]);

  // Get full detail
  const { data: detailRes, isLoading: loadingDetail } = useQuery({
    queryKey: ["bl-detail", matched?.id],
    queryFn: () => shipmentApi.getById(matched!.id),
    enabled: !!matched?.id,
  });

  const ship = detailRes?.data;
  const loading = searching || loadingDetail;
  const notFound = searchJob && !searching && !matched;

  const doSearch = () => {
    const v = jobInput.trim();
    if (v) setSearchJob(v);
  };

  // Parties
  const shipper = ship ? findParty(ship.parties, "shipper") : undefined;
  const consignee = ship ? findParty(ship.parties, "consignee") : undefined;
  const notify = ship
    ? findParty(ship.parties, "notifyparty", "notify")
    : undefined;
  const deliveryAgent = ship
    ? findParty(ship.parties, "deliveryagent", "delivery")
    : undefined;

  // Cargo data — build aligned marks & description per container
  const cargo = useMemo(() => {
    if (!ship)
      return { marks: "", desc: "", wt: "", meas: "" };

    const markLines: string[] = [];
    const descLines: string[] = [];

    if (ship.containers.length > 0) {
      // Marks & Numbers header (if present) on its own aligned line
      if (ship.marksNumbers) {
        markLines.push(ship.marksNumbers);
        descLines.push("");
      }

      for (let i = 0; i < ship.containers.length; i++) {
        const c = ship.containers[i];
        // Per-container block
        const cMark: string[] = [];
        const cDesc: string[] = [];

        // Container number + package/type line
        cMark.push(c.containerNumber);
        const pkg = [c.noOfPcs && `${c.noOfPcs}`, c.packageTypeName]
          .filter(Boolean)
          .join(" ");
        if (c.containerTypeName) cDesc.push(`${pkg} (${c.containerTypeName})`);
        else if (pkg) cDesc.push(pkg);
        else cDesc.push("");

        // Seal + description line
        if (c.sealNo) cMark.push(`S/N: ${c.sealNo}`);
        if (c.description) cDesc.push(c.description);

        // Per-container weight / volume
        const wtVol: string[] = [];
        if (c.grossWeight) wtVol.push(`${c.grossWeight.toLocaleString()} KGS`);
        if (c.volume) wtVol.push(`${c.volume.toFixed(3)} CBM`);
        if (wtVol.length) cDesc.push(wtVol.join(" / "));

        // Pad so both columns have same line count for this container
        const max = Math.max(cMark.length, cDesc.length);
        while (cMark.length < max) cMark.push("");
        while (cDesc.length < max) cDesc.push("");

        markLines.push(...cMark);
        descLines.push(...cDesc);

        // Blank separator between containers
        if (i < ship.containers.length - 1) {
          markLines.push("");
          descLines.push("");
        }
      }
    } else {
      // Cargo items (no containers)
      if (ship.marksNumbers) {
        markLines.push(ship.marksNumbers);
        descLines.push("");
      }
      for (const c of ship.cargos) {
        const ln = [c.quantity && `${c.quantity}`, c.packageTypeName]
          .filter(Boolean)
          .join(" ");
        if (ln) descLines.push(ln);
        if (c.description) descLines.push(c.description);
      }
    }

    // Notes at the end
    if (ship.notes) {
      markLines.push("");
      descLines.push("");
      descLines.push(ship.notes);
      markLines.push("");
    }

    // Totals
    const tw =
      ship.containers.length > 0
        ? ship.containers.reduce((s, c) => s + (c.grossWeight || 0), 0)
        : ship.cargos.reduce((s, c) => s + (c.totalWeight || 0), 0);
    const tm =
      ship.containers.length > 0
        ? ship.containers.reduce((s, c) => s + (c.volume || 0), 0)
        : ship.cargos.reduce((s, c) => s + (c.totalCBM || 0), 0);

    return {
      marks: markLines.join("\n"),
      desc: descLines.join("\n"),
      wt: tw > 0 ? `${tw.toLocaleString()} KGS` : "",
      meas: tm > 0 ? `${tm.toFixed(3)} CBM` : "",
    };
  }, [ship]);

  // Overflow calc (~93mm cargo area)
  const lineHMm = fontSize * lineHeight * 0.3528;
  const maxLines = Math.max(5, Math.floor(93 / lineHMm));
  const [marksShow, marksOver] = splitOverflow(cargo.marks, maxLines);
  const [descShow, descOver] = splitOverflow(cargo.desc, maxLines);
  const hasOverflow = !!(marksOver || descOver);

  return (
    <MainLayout>
      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          aside { display: none !important; }
          main { overflow: visible !important; }
          .no-print { display: none !important; }
          .bl-wrapper { background: white !important; padding: 0 !important; justify-content: start !important; }
          .bl-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding-top: ${8 + topOffset}mm !important;
            padding-left: ${8 + leftOffset}mm !important;
            padding-right: 8mm !important;
            padding-bottom: 8mm !important;
          }
          .bl-border { border-color: transparent !important; }
          .bl-lbl { visibility: hidden !important; }
        }
      `}</style>

      <div className="p-6 space-y-4 no-print">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Bill of Lading</h1>
        </div>

        {/* Controls */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Job search */}
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-muted-foreground">Job No.</Label>
              <Input
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Enter job number..."
                className="w-44 h-9"
              />
              <Button
                size="sm"
                className="h-9"
                onClick={doSearch}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-1" />
                )}
                Search
              </Button>
              {ship && (
                <span className="text-sm text-emerald-600 font-medium ml-1">
                  {ship.jobNumber}
                </span>
              )}
              {notFound && (
                <span className="text-sm text-red-500 ml-1">Not found</span>
              )}
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-border hidden md:block" />

            {/* Font size */}
            <div className="flex items-center gap-1">
              <Label className="text-xs font-medium text-muted-foreground">Font</Label>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => setFontSize((f) => Math.max(6, f - 0.5))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-xs w-8 text-center font-mono">{fontSize}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => setFontSize((f) => Math.min(14, f + 0.5))}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Line height */}
            <div className="flex items-center gap-1">
              <Label className="text-xs font-medium text-muted-foreground">Line</Label>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() =>
                  setLineHeight((l) => Math.max(1, +(l - 0.1).toFixed(1)))
                }
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-xs w-8 text-center font-mono">
                {lineHeight.toFixed(1)}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() =>
                  setLineHeight((l) => Math.min(2.5, +(l + 0.1).toFixed(1)))
                }
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Offsets */}
            <div className="flex items-center gap-1">
              <Label className="text-xs font-medium text-muted-foreground">Top</Label>
              <Input
                type="number"
                value={topOffset}
                onChange={(e) => setTopOffset(+e.target.value)}
                className="w-16 h-9 text-sm"
                step={0.5}
              />
              <Label className="text-xs font-medium text-muted-foreground ml-1">Left</Label>
              <Input
                type="number"
                value={leftOffset}
                onChange={(e) => setLeftOffset(+e.target.value)}
                className="w-16 h-9 text-sm"
                step={0.5}
              />
              <span className="text-xs text-muted-foreground">mm</span>
            </div>

            {/* Print button */}
            <Button
              size="sm"
              variant="outline"
              className="h-9 ml-auto"
              onClick={() => window.print()}
              disabled={!ship}
            >
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        </div>
      </div>

      {/* BL Document */}
      {ship ? (
        <div className="bl-wrapper flex justify-center py-6 bg-gray-100">
          <div
            className="bl-page bg-white shadow-lg"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "8mm",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: `${fontSize}pt`,
              lineHeight,
            }}
          >
            {/* === HEADER: Ocean Bill of Lading (screen only) === */}
            <div
              className="bl-lbl"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "0.5mm 3mm",
                borderBottom: "1px solid #bbb",
              }}
            >
              <div>
                <span style={{ fontSize: "14pt", fontWeight: "bold", fontFamily: "Arial, sans-serif", color: "#000" }}>
                  Ocean Bill of Lading{" "}
                </span>
                <span style={{ fontSize: "7pt", fontFamily: "Arial, sans-serif", color: "#444" }}>
                  FOR COMBINED TRANSPORT OR PORT-TO-PORT SHIPMENT
                </span>
              </div>
              <div style={{ fontSize: "12pt", fontWeight: "bold", fontFamily: "Arial, sans-serif", color: "#000" }}>
                NON-NEGOTIABLE
              </div>
            </div>

            {/* === ROW 1+2: Shipper & Consignee (left 57.7%) + Booking/BL & Logo (right 42.3%) === */}
            <div style={{ display: "flex" }}>
              {/* Left: Shipper (33mm) + Consignee (33mm) */}
              <div style={{ width: "57.7%", display: "flex", flexDirection: "column" }}>
                <div
                  className="bl-border"
                  style={{ ...cell, minHeight: "33mm" }}
                >
                  <div className="bl-lbl" style={lbl}>
                    Shipper
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {formatParty(shipper)}
                  </div>
                </div>
                <div
                  className="bl-border"
                  style={{ ...cell, minHeight: "33mm" }}
                >
                  <div className="bl-lbl" style={lbl}>
                    Consignee (if 'To Order' so indicate)
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {formatParty(consignee)}
                  </div>
                </div>
              </div>
              {/* Right: Booking (43.4%) + BL (56.6%) on top (10mm), Logo below (55mm) */}
              <div style={{ width: "42.3%", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex" }}>
                  <div
                    className="bl-border"
                    style={{ ...cell, width: "43.4%", minHeight: "10mm" }}
                  >
                    <div className="bl-lbl" style={lbl}>
                      Booking No.
                    </div>
                    <div>{ship.jobNumber}</div>
                  </div>
                  <div
                    className="bl-border"
                    style={{ ...cell, width: "56.6%", minHeight: "10mm" }}
                  >
                    <div className="bl-lbl" style={lbl}>
                      B/L No.
                    </div>
                    <div>{ship.houseBLNo || ""}</div>
                  </div>
                </div>
                {/* Logo (55mm) */}
                <div
                  className="bl-border bl-lbl"
                  style={{
                    ...cell,
                    flex: 1,
                    minHeight: "55mm",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingTop: "5mm",
                  }}
                >
                  <img
                    src="/tfs-logo.jpg"
                    alt="Transparent Freight Services"
                    style={{ width: "75%", objectFit: "contain" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{ fontSize: "6.5pt", color: "#888", textAlign: "center", marginTop: "2mm" }}>
                    INFO@TFS-GLOBAL.COM
                  </div>
                  <div style={{ fontSize: "6.5pt", color: "#888" }}>
                    WWW.TFS-GLOBAL.COM
                  </div>
                </div>
              </div>
            </div>

            {/* === ROW 3: Notify (33mm) + transport (11mm each) left, Delivery Agent (55mm) right === */}
            <div style={{ display: "flex" }}>
              {/* Left: Notify + Pre-Carriage + Vessel */}
              <div style={{ width: "57.7%", display: "flex", flexDirection: "column" }}>
                <div
                  className="bl-border"
                  style={{ ...cell, minHeight: "33mm" }}
                >
                  <div className="bl-lbl" style={lbl}>
                    Notify Party (No claim shall attach for failure to notify)
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {formatParty(notify)}
                  </div>
                </div>
                <div style={{ display: "flex" }}>
                  <div
                    className="bl-border"
                    style={{ ...cell, width: "57.5%", minHeight: "11mm" }}
                  >
                    <div className="bl-lbl" style={lbl}>
                      Pre-Carriage by
                    </div>
                    <div>{ship.carrier || ""}</div>
                  </div>
                  <div
                    className="bl-border"
                    style={{ ...cell, width: "42.5%", minHeight: "11mm" }}
                  >
                    <div className="bl-lbl" style={lbl}>
                      Place of Receipt
                    </div>
                    <div>
                      {ship.placeOfReceiptName || ship.placeOfReceipt || ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex" }}>
                  <div
                    className="bl-border"
                    style={{ ...cell, width: "57.5%", minHeight: "11mm" }}
                  >
                    <div className="bl-lbl" style={lbl}>
                      Vessel/Voyage
                    </div>
                    <div>
                      {[ship.vessel, ship.voyage].filter(Boolean).join(" V.") ||
                        ""}
                    </div>
                  </div>
                  <div
                    className="bl-border"
                    style={{ ...cell, width: "42.5%", minHeight: "11mm" }}
                  >
                    <div className="bl-lbl" style={lbl}>
                      Port of Loading
                    </div>
                    <div>{ship.portOfLoadingName || ""}</div>
                  </div>
                </div>
              </div>
              {/* Right: Delivery Agent (55mm) */}
              <div
                className="bl-border"
                style={{ ...cell, width: "42.3%", minHeight: "55mm", alignSelf: "stretch" }}
              >
                <div className="bl-lbl" style={lbl}>
                  Delivery Agent at Destination
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {formatParty(deliveryAgent)}
                </div>
              </div>
            </div>

            {/* === ROW 4: 4 port columns (10mm) === */}
            <div style={{ display: "flex" }}>
              <div
                className="bl-border"
                style={{ ...cell, width: "23%", minHeight: "10mm" }}
              >
                <div className="bl-lbl" style={lbl}>
                  Port of Discharge
                </div>
                <div>{ship.portOfDischargeName || ""}</div>
              </div>
              <div
                className="bl-border"
                style={{ ...cell, width: "28%", minHeight: "10mm" }}
              >
                <div className="bl-lbl" style={lbl}>
                  Place of Delivery/Final Destination
                </div>
                <div>
                  {ship.portOfFinalDestinationName ||
                    ship.placeOfDeliveryName ||
                    ship.placeOfDelivery ||
                    ""}
                </div>
              </div>
              <div
                className="bl-border"
                style={{ ...cell, width: "19%", minHeight: "10mm" }}
              >
                <div className="bl-lbl" style={lbl}>
                  Freight Payable at
                </div>
                <div>
                  {ship.hblFreight === "Prepaid"
                    ? ship.portOfLoadingName || "ORIGIN"
                    : ship.hblFreight === "Collect"
                      ? ship.portOfDischargeName || "DESTINATION"
                      : ""}
                </div>
              </div>
              <div
                className="bl-border"
                style={{ ...cell, width: "30%", minHeight: "10mm" }}
              >
                <div className="bl-lbl" style={lbl}>
                  No of Original Bill of Lading
                </div>
                <div>{ship.hblNoBLIssued || ""}</div>
              </div>
            </div>

            {/* === CARGO TABLE HEADER === */}
            <div style={{ display: "flex" }}>
              <div
                className="bl-border"
                style={{
                  ...cell,
                  width: "20%",
                  minHeight: "6mm",
                  padding: "0.5mm 2mm",
                }}
              >
                <div className="bl-lbl" style={{ ...lbl, marginBottom: 0 }}>
                  Marks &amp; Nos/Contr/Seal No.
                </div>
              </div>
              <div
                className="bl-border"
                style={{
                  ...cell,
                  width: "46%",
                  minHeight: "6mm",
                  padding: "0.5mm 2mm",
                }}
              >
                <div className="bl-lbl" style={{ ...lbl, marginBottom: 0 }}>
                  Number &amp; kind of packages: Description of goods
                </div>
              </div>
              <div
                className="bl-border"
                style={{
                  ...cell,
                  width: "16%",
                  minHeight: "6mm",
                  padding: "0.5mm 2mm",
                }}
              >
                <div className="bl-lbl" style={{ ...lbl, marginBottom: 0 }}>
                  Gross Weight
                </div>
              </div>
              <div
                className="bl-border"
                style={{
                  ...cell,
                  width: "18%",
                  minHeight: "6mm",
                  padding: "0.5mm 2mm",
                }}
              >
                <div className="bl-lbl" style={{ ...lbl, marginBottom: 0 }}>
                  Measurement
                </div>
              </div>
            </div>

            {/* === CARGO CONTENT (93mm) === */}
            <div style={{ display: "flex" }}>
              <div
                style={{
                  width: "20%",
                  minHeight: "93mm",
                  padding: "1mm 2mm",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                {marksShow}
              </div>
              <div
                style={{
                  width: "46%",
                  minHeight: "93mm",
                  padding: "1mm 2mm",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                {descShow}
              </div>
              <div
                style={{
                  width: "16%",
                  minHeight: "93mm",
                  padding: "1mm 2mm",
                  boxSizing: "border-box",
                }}
              >
                {cargo.wt}
              </div>
              <div
                style={{
                  width: "18%",
                  minHeight: "93mm",
                  padding: "1mm 2mm",
                  boxSizing: "border-box",
                }}
              >
                {cargo.meas}
              </div>
            </div>

            {/* === ABOVE PARTICULARS === */}
            <div
              className="bl-lbl"
              style={{
                textAlign: "center",
                fontSize: "7pt",
                padding: "1mm 0",
                fontFamily: "Arial, sans-serif",
                color: "#666",
              }}
            >
              ABOVE PARTICULARS AS DECLARED BY SHIPPER
            </div>

            {/* === FREIGHT & CHARGES (21mm) === */}
            <div style={{ display: "flex" }}>
              <div
                className="bl-border"
                style={{ ...cell, width: "26%", minHeight: "21mm" }}
              >
                <div className="bl-lbl" style={lbl}>
                  Freight and Charges
                </div>
              </div>
              <div
                className="bl-border"
                style={{ ...cell, width: "12%", minHeight: "21mm" }}
              >
                <div className="bl-lbl" style={lbl}>
                  Rev. tons
                </div>
              </div>
              <div
                className="bl-border"
                style={{ ...cell, width: "10%", minHeight: "21mm" }}
              >
                <div className="bl-lbl" style={lbl}>
                  Rate
                </div>
              </div>
              <div
                className="bl-border"
                style={{ ...cell, width: "6%", minHeight: "21mm" }}
              >
                <div className="bl-lbl" style={lbl}>
                  per
                </div>
              </div>
              <div
                className="bl-border"
                style={{ ...cell, width: "23.5%", minHeight: "21mm" }}
              >
                <div className="bl-lbl" style={lbl}>
                  Prepaid
                </div>
                <div>
                  {ship.hblFreight === "Prepaid" ? "AS ARRANGED" : ""}
                </div>
              </div>
              <div
                className="bl-border"
                style={{ ...cell, width: "22.5%", minHeight: "21mm" }}
              >
                <div className="bl-lbl" style={lbl}>
                  Collect
                </div>
                <div>
                  {ship.hblFreight === "Collect" ? "AS ARRANGED" : ""}
                </div>
              </div>
            </div>

            {/* === BOTTOM: Legal (56.6%, 30mm) + Place/Date (10mm) + Signed (20mm) === */}
            <div style={{ display: "flex" }}>
              {/* Legal text - screen only */}
              <div
                className="bl-border bl-lbl"
                style={{
                  ...cell,
                  width: "56.6%",
                  minHeight: "30mm",
                  fontSize: "5pt",
                  color: "#999",
                  fontFamily: "Arial, sans-serif",
                  lineHeight: 1.2,
                }}
              >
                <p style={{ marginBottom: "1mm" }}>
                  RECEIVED by the carrier the Goods as specified above in apparent
                  good order and condition unless otherwise stated, to be
                  transported to such place as agreed, authorised or permitted
                  herein and subject to all the terms and conditions appearing on
                  the front and reverse of this bill of lading to which the
                  merchant agrees by accepting this Bill of Lading, any local
                  privileges and customs not with standing.
                </p>
                <p style={{ marginBottom: "1mm" }}>
                  The particulars given above as stated by the shipper and the
                  weight, measure, quantity, condition, contents and value of the
                  Goods are unknown to the Carrier.
                </p>
                <p>
                  In WITNESS whereof one (1) original Bill of Lading has been
                  signed if not otherwise stated above, the same being accomplished
                  the other(s), if any, to be void, if required by the Carrier one
                  (1) original Bill of Lading must be surrendered duly endorsed in
                  exchange for the Goods or delivery order.
                </p>
              </div>
              {/* Place/Date (10mm) + Signed (20mm) */}
              <div
                style={{
                  width: "43.4%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  className="bl-border"
                  style={{ ...cell, minHeight: "10mm" }}
                >
                  <div className="bl-lbl" style={lbl}>
                    Place and Date of Issue
                  </div>
                  <div>
                    {[ship.placeOfBLIssue, formatDate(ship.hblDate)]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
                <div className="bl-border" style={{ ...cell, flex: 1, minHeight: "20mm" }}>
                  <div className="bl-lbl" style={lbl}>
                    Signed on behalf of the Carrier:
                  </div>
                </div>
              </div>
            </div>

            {/* === FOOTER === */}
            <div
              className="bl-lbl"
              style={{
                textAlign: "center",
                fontSize: "6.5pt",
                padding: "1.5mm 0",
                fontFamily: "Arial, sans-serif",
                color: "#888",
              }}
            >
              FOR TERMS AND CONDITIONS SEE REVERSE SIDE
            </div>

            {/* === OVERFLOW CONTINUATION === */}
            {hasOverflow && (
              <div
                style={{
                  marginTop: "4mm",
                  borderTop: "1px dashed #999",
                  paddingTop: "2mm",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {marksOver && (
                  <div style={{ marginBottom: "2mm" }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "7pt",
                        fontFamily: "Arial, sans-serif",
                        marginBottom: "1mm",
                      }}
                    >
                      MARKS &amp; NUMBERS (CONTINUED):
                    </div>
                    {marksOver}
                  </div>
                )}
                {descOver && (
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "7pt",
                        fontFamily: "Arial, sans-serif",
                        marginBottom: "1mm",
                      }}
                    >
                      DESCRIPTION (CONTINUED):
                    </div>
                    {descOver}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            {notFound ? (
              <p className="text-red-500 text-sm">
                Shipment not found for: <span className="font-medium">{searchJob}</span>
              </p>
            ) : (
              <p className="text-muted-foreground">Enter a Job Number above to view the Bill of Lading</p>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
