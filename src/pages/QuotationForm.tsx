import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Loader2, ArrowLeft, Trash2, Ship, Plane, Truck, Package, Container, History } from "lucide-react";
import {
  useQuotation,
  useCreateQuotation,
  useCreateCompleteQuotation,
  useUpdateQuotation,
  useRateRequestForConversion,
  useRateRequest,
  useLead,
} from "@/hooks/useSales";
import { LockedLeadSections } from "@/components/leads/LockedLeadSections";
import { LockedRateRequestSection } from "@/components/leads/LockedRateRequestSection";
import { EquipmentGrid } from "@/components/leads/EquipmentGrid";
import { BoxPalletsGrid } from "@/components/leads/BoxPalletsGrid";
import { useAllCreditors, useAllDebtors, useCustomer } from "@/hooks/useCustomers";
import {
  useAllCountries,
  useAllIncoTerms,
  useAllPorts,
  useAllPackageTypes,
  useAllCurrencyTypes,
  useAllChargeItems,
  useAllContainerTypes,
  useAllCostingUnits,
  useAllCustomerCategoryTypes,
} from "@/hooks/useSettings";
import {
  CreateCompleteQuotationRequest,
  CreateLeadDetailRequest,
  CreateLeadRequest,
  CreateQuotationRequest,
  FreightMode,
  LeadDetailItem,
  ShippingType,
  UnitOfMeasurement,
} from "@/services/api";
import { quotationApi } from "@/services/api/sales";
import { SalesActivityLog } from "@/components/sales/SalesActivityLog";
import { SalesActivityLogModal } from "@/components/sales/SalesActivityLogModal";
import { toast } from "sonner";

const PRODUCT_TYPES = [
  "AGRICULTURE & FOOD",
  "APPAREL, TEXTILES & ACCESSORIES",
  "AUTO & TRANSPORTATION",
  "AUTOMOTIVE",
  "BAGS, SHOES & ACCESSORIES",
  "CHEMICALS",
  "ELECTRICAL EQUIPMENT, COMPONENTS & TELECOMS",
  "ELECTRONICS",
  "FAK",
  "GIFTS, SPORTS & TOYS",
  "HEALTH & BEAUTY",
  "HOME, LIGHTS & CONSTRUCTION",
  "MACHINERY",
  "MACHINERY, INDUSTRIAL PARTS & TOOLS",
  "METALLURGY, CHEMICALS, RUBBER & PLASTICS",
  "OTHER",
  "PACKAGING, ADVERTISING & OFFICE",
  "PHARMACEUTICALS",
  "SCRAP ITEM",
  "TEXTILES",
];

interface CargoRow {
  id: number;
  calculationMode: string;
  quantity: number;
  packageTypeId?: number;
  loadType?: string;
  length?: number;
  width?: number;
  height?: number;
  volumeUnit?: string;
  cbm?: number;
  weight?: number;
  weightUnit?: string;
  totalCbm?: number;
  totalWeight?: number;
  cargoDescription?: string;
}

interface ChargeRow {
  id: number;
  chargeType: string;
  chargeItemId?: number;
  costingUnitId?: number;
  currency: string;
  currencyId?: number;
  rate: string;
  roe: string;
  quantity: string;
  amount: string;
  costCurrency: string;
  costCurrencyId?: number;
  costRate: string;
  costRoe: string;
  costQuantity: string;
  costAmount: string;
}

interface FormData {
  customerId?: number;
  customerName: string;
  contactPersonId?: number;
  customerRefCode?: string;
  quotationBookingNo?: string;
  mode?: string;
  quotationDate: string;
  quoteExpiryDate?: string;
  incoTermId?: number;
  status?: string;
  loadingPortId?: number;
  destinationPortId?: number;
  pickupAddress?: string;
  deliveryAddress?: string;
  remarks?: string;
  cfs?: string;
  documentRequired?: string;
  notes?: string;
  notesForBooking?: string;
  internalNotes?: string;
  cargoCalculationMode: string;
}

interface LeadWorkflowData {
  customerId?: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  freightMode: FreightMode;
  unitOfMeasurement: UnitOfMeasurement;
  shippingType: ShippingType;
  equipments: LeadDetailItem[];
  boxPallets: LeadDetailItem[];
  pickupCountryId?: number;
  loadingPortId?: number;
  pickupAddress: string;
  deliveryCountryId?: number;
  destinationPortId?: number;
  deliveryAddress: string;
  goodsReadyDate: string;
  customerReferenceNo: string;
  hsCode: string;
  productType: string;
  productDescription: string;
  incoTermId?: number;
  internalNotes: string;
}

interface RateRequestWorkflowData {
  vendorTypeId: string;
  vendorId: string;
  vendorEmail: string;
  internalNotes: string;
}

const initialLeadWorkflowData: LeadWorkflowData = {
  fullName: "",
  email: "",
  phoneNumber: "",
  freightMode: "SeaFreight",
  unitOfMeasurement: "KG",
  shippingType: "FTL",
  equipments: [],
  boxPallets: [],
  pickupAddress: "",
  deliveryAddress: "",
  goodsReadyDate: "",
  customerReferenceNo: "",
  hsCode: "",
  productType: "",
  productDescription: "",
  internalNotes: "",
};

const initialRateRequestWorkflowData: RateRequestWorkflowData = {
  vendorTypeId: "",
  vendorId: "",
  vendorEmail: "",
  internalNotes: "",
};

export default function QuotationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Determine mode from URL path
  const isViewMode = location.pathname.endsWith("/view-details");
  const quotationId = id ? parseInt(id) : null;
  const isEditing = !!quotationId && !isViewMode;
  const isReadOnly = isViewMode;

  // Get rateRequestId from location state (when converting from Rate Request)
  const rateRequestIdFromState = (location.state as { rateRequestId?: number })?.rateRequestId;
  const [conversionRateRequestId] = useState<number | null>(rateRequestIdFromState || null);
  const conversionAppliedRef = useRef(false);
  const isNewQuotationMode = !isEditing && !isViewMode && !conversionRateRequestId;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    quotationDate: new Date().toISOString().split("T")[0],
    cargoCalculationMode: "units",
    status: "Pending",
  });

  const [cargoRows, setCargoRows] = useState<CargoRow[]>([
    { id: 1, calculationMode: "units", quantity: 1, volumeUnit: "cm", weightUnit: "kg" },
  ]);

  const [chargeRows, setChargeRows] = useState<ChargeRow[]>([
    { id: 1, chargeType: "", currency: "", rate: "", roe: "", quantity: "", amount: "", costCurrency: "", costRate: "", costRoe: "", costQuantity: "", costAmount: "" },
  ]);

  const [createLead, setCreateLead] = useState(false);
  const [createRateRequest, setCreateRateRequest] = useState(false);
  const [leadData, setLeadData] = useState<LeadWorkflowData>(initialLeadWorkflowData);
  const [rateRequestData, setRateRequestData] = useState<RateRequestWorkflowData>(initialRateRequestWorkflowData);

  // Queries
  const { data: conversionData } = useRateRequestForConversion(conversionRateRequestId || 0);
  const { data: quotationDetail, isLoading: isQuotationLoading, refetch: refetchQuotation } = useQuotation(quotationId || 0);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleAddNote = async (note: string) => {
    if (!quotationId) return;
    try {
      const response = await quotationApi.addNote(quotationId, note);
      if (response.error) throw new Error(response.error);
      await refetchQuotation();
      toast.success("Note added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add note");
    }
  };

  // ----- Source rate-request + lead for the locked context cards above the form -----
  // Convert mode: use the rateRequestId from location.state.
  // View / Edit mode: use the rateRequestId already attached to the loaded quotation.
  const sourceRateRequestId =
    conversionRateRequestId ?? quotationDetail?.rateRequestId ?? 0;
  const { data: sourceRateRequest, isLoading: isSourceRateRequestLoading } =
    useRateRequest(sourceRateRequestId);
  const sourceLeadId = sourceRateRequest?.leadId ?? 0;
  const { data: sourceLead, isLoading: isSourceLeadLoading } = useLead(sourceLeadId);
  const hasSourceContext = sourceRateRequestId > 0;

  // Dropdown data queries
  const { data: debtorsData } = useAllDebtors();
  const { data: creditorsData } = useAllCreditors();
  const { data: selectedCustomer } = useCustomer(formData.customerId || 0);
  const { data: countriesData } = useAllCountries();
  const { data: incoTermsData } = useAllIncoTerms();
  const { data: portsData } = useAllPorts();
  const { data: packageTypesData } = useAllPackageTypes();
  const { data: currencyTypesData } = useAllCurrencyTypes();
  const { data: chargeItemsData } = useAllChargeItems();
  const { data: containerTypesData } = useAllContainerTypes();
  const { data: costingUnitsData } = useAllCostingUnits();
  const { data: categoryTypesData } = useAllCustomerCategoryTypes();

  const debtors = useMemo(() => Array.isArray(debtorsData) ? debtorsData : [], [debtorsData]);
  const creditors = useMemo(() => Array.isArray(creditorsData) ? creditorsData : [], [creditorsData]);
  const countries = useMemo(() => Array.isArray(countriesData) ? countriesData : [], [countriesData]);
  const incoTerms = useMemo(() => Array.isArray(incoTermsData) ? incoTermsData : [], [incoTermsData]);
  const ports = useMemo(() => Array.isArray(portsData) ? portsData : [], [portsData]);
  const packageTypes = useMemo(() => Array.isArray(packageTypesData) ? packageTypesData : [], [packageTypesData]);
  const currencyTypes = useMemo(() => Array.isArray(currencyTypesData) ? currencyTypesData : [], [currencyTypesData]);
  const chargeItems = useMemo(() => Array.isArray(chargeItemsData) ? chargeItemsData : [], [chargeItemsData]);
  const containerTypes = useMemo(() => Array.isArray(containerTypesData) ? containerTypesData : [], [containerTypesData]);
  const costingUnits = useMemo(() => Array.isArray(costingUnitsData) ? costingUnitsData : [], [costingUnitsData]);
  const categoryTypes = useMemo(() => Array.isArray(categoryTypesData) ? categoryTypesData : [], [categoryTypesData]);

  const norm = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();
  const filterPortsByCountry = (countryId: number | undefined) => {
    if (!countryId) return ports;
    const target = norm(countries.find((country) => country.id === countryId)?.name);
    if (!target) return ports;
    const matched = ports.filter((port) => norm(port.country) === target);
    return matched.length > 0 ? matched : ports;
  };

  const pickupPorts = filterPortsByCountry(leadData.pickupCountryId);
  const deliveryPorts = filterPortsByCountry(leadData.deliveryCountryId);

  const filteredVendors = useMemo(() => {
    if (!rateRequestData.vendorTypeId) return creditors;
    const targetId = parseInt(rateRequestData.vendorTypeId);
    return creditors.filter((vendor) => vendor.categories?.some((category) => category.id === targetId));
  }, [creditors, rateRequestData.vendorTypeId]);

  const vendorTypeName = useMemo(
    () => categoryTypes.find((category) => category.id.toString() === rateRequestData.vendorTypeId)?.name ?? "",
    [categoryTypes, rateRequestData.vendorTypeId],
  );

  // Mutations
  const createMutation = useCreateQuotation();
  const createCompleteMutation = useCreateCompleteQuotation();
  const updateMutation = useUpdateQuotation();

  // Handle conversion pre-fill from Rate Request
  useEffect(() => {
    if (!conversionRateRequestId) {
      conversionAppliedRef.current = false;
      return;
    }
    if (conversionRateRequestId && conversionData && packageTypesData && !conversionAppliedRef.current) {
      conversionAppliedRef.current = true;
      let mode = "";
      const freightMode = conversionData.freightMode?.toLowerCase() || "";
      const shippingType = conversionData.shippingType || "";

      if (freightMode.includes("sea")) {
        mode = shippingType === "FTL" ? "SeaFreightFCL" : "SeaFreightLCL";
      } else if (freightMode.includes("air")) {
        mode = "AirFreight";
      } else if (freightMode.includes("land")) {
        mode = "LandFreight";
      }

      const cargoCalculationMode = shippingType === "FTL" ? "shipment" : "units";

      setFormData({
        customerId: conversionData.customerId,
        customerName: conversionData.customerName || conversionData.fullName || "",
        quotationDate: new Date().toISOString().split("T")[0],
        loadingPortId: conversionData.loadingPortId,
        destinationPortId: conversionData.destinationPortId,
        pickupAddress: conversionData.pickupAddress || "",
        deliveryAddress: conversionData.deliveryAddress || "",
        incoTermId: conversionData.incoTermId,
        cargoCalculationMode,
        mode,
        status: "Pending",
        customerRefCode: conversionData.customerReferenceNo || "",
        internalNotes: "",
      });

      if (conversionData.leadDetails && conversionData.leadDetails.length > 0) {
        if (cargoCalculationMode === "shipment") {
          const totalQuantity = conversionData.leadDetails.reduce((sum, d) => sum + (d.quantity || 0), 0);
          const totalWeight = conversionData.leadDetails.reduce((sum, d) => sum + ((d.weight || 0) * (d.quantity || 1)), 0);
          const totalVolume = conversionData.leadDetails.reduce((sum, d) => sum + ((d.volume || 0) * (d.quantity || 1)), 0);
          const firstDetail = conversionData.leadDetails[0];
          const loadType = firstDetail?.containerTypeName || firstDetail?.packageTypeName || "";

          setCargoRows([{
            id: Date.now(),
            calculationMode: "shipment",
            quantity: totalQuantity,
            loadType,
            totalCbm: totalVolume,
            totalWeight,
            weightUnit: "kg",
            volumeUnit: "cm",
            cargoDescription: conversionData.productDescription || "GENERAL CARGO",
          }]);
        } else {
          const cargoFromLead = conversionData.leadDetails.map((detail, index) => ({
            id: Date.now() + index,
            calculationMode: "units",
            quantity: detail.quantity || 1,
            packageTypeId: detail.packageTypeId,
            length: detail.length,
            width: detail.width,
            height: detail.height,
            weight: detail.weight,
            weightUnit: "kg",
            volumeUnit: "cm",
            cbm: detail.volume,
            cargoDescription: "",
          }));
          setCargoRows(cargoFromLead.length > 0 ? cargoFromLead : [
            { id: 1, calculationMode: "units", quantity: 1, volumeUnit: "cm", weightUnit: "kg" },
          ]);
        }
      } else {
        if (cargoCalculationMode === "shipment") {
          setCargoRows([{
            id: 1,
            calculationMode: "shipment",
            quantity: 1,
            weightUnit: "kg",
            volumeUnit: "cm",
            cargoDescription: conversionData.productDescription || "",
          }]);
        } else {
          setCargoRows([
            { id: 1, calculationMode: "units", quantity: 1, volumeUnit: "cm", weightUnit: "kg" },
          ]);
        }
      }

      // Clear the location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [conversionRateRequestId, conversionData, packageTypesData]);

  // Handle edit/view mode pre-fill
  useEffect(() => {
    if (quotationId && quotationDetail) {
      setFormData({
        customerId: quotationDetail.customerId,
        customerName: quotationDetail.customerName || "",
        contactPersonId: quotationDetail.contactPersonId,
        customerRefCode: quotationDetail.customerRefCode || "",
        quotationBookingNo: quotationDetail.quotationBookingNo || "",
        mode: quotationDetail.mode,
        quotationDate: quotationDetail.quotationDate,
        quoteExpiryDate: quotationDetail.quoteExpiryDate || "",
        incoTermId: quotationDetail.incoTermId,
        status: quotationDetail.quotationStatus || "Pending",
        loadingPortId: quotationDetail.loadingPortId,
        destinationPortId: quotationDetail.destinationPortId,
        pickupAddress: quotationDetail.pickupAddress || "",
        deliveryAddress: quotationDetail.deliveryAddress || "",
        remarks: quotationDetail.remarks || "",
        cfs: quotationDetail.cfs || "",
        documentRequired: quotationDetail.documentRequired || "",
        notes: quotationDetail.notes || "",
        notesForBooking: quotationDetail.notesForBooking || "",
        internalNotes: quotationDetail.internalNotes || "",
        cargoCalculationMode: quotationDetail.cargoCalculationMode || "units",
      });

      if (quotationDetail.cargoDetails && quotationDetail.cargoDetails.length > 0) {
        setCargoRows(
          quotationDetail.cargoDetails.map((cd) => ({
            id: cd.id,
            calculationMode: cd.calculationMode,
            quantity: cd.quantity,
            packageTypeId: cd.packageTypeId,
            loadType: cd.loadType,
            length: cd.length,
            width: cd.width,
            height: cd.height,
            volumeUnit: cd.volumeUnit || "cm",
            cbm: cd.cbm,
            weight: cd.weight,
            weightUnit: cd.weightUnit || "kg",
            totalCbm: cd.totalCbm,
            totalWeight: cd.totalWeight,
            cargoDescription: cd.cargoDescription,
          }))
        );
      }

      if (quotationDetail.charges && quotationDetail.charges.length > 0) {
        setChargeRows(
          quotationDetail.charges.map((ch) => ({
            id: ch.id,
            chargeType: ch.chargeType || "",
            chargeItemId: ch.chargeItemId,
            costingUnitId: ch.costingUnitId,
            currency: ch.currencyCode || "",
            currencyId: ch.currencyId,
            rate: ch.rate?.toString() || "",
            roe: ch.roe?.toString() || "",
            quantity: ch.quantity?.toString() || "",
            amount: ch.amount?.toString() || "",
            costCurrency: ch.costCurrencyCode || "",
            costCurrencyId: ch.costCurrencyId,
            costRate: ch.costRate?.toString() || "",
            costRoe: ch.costRoe?.toString() || "",
            costQuantity: ch.costQuantity?.toString() || "",
            costAmount: ch.costAmount?.toString() || "",
          }))
        );
      }
    }
  }, [quotationId, quotationDetail]);

  // Charge row helpers
  const addChargeRow = () => {
    setChargeRows([
      ...chargeRows,
      { id: Date.now(), chargeType: "", currency: "", rate: "", roe: "", quantity: "", amount: "", costCurrency: "", costRate: "", costRoe: "", costQuantity: "", costAmount: "" },
    ]);
  };

  const deleteChargeRow = (rowId: number) => {
    if (chargeRows.length > 1) {
      setChargeRows(chargeRows.filter((row) => row.id !== rowId));
    }
  };

  const addCargoRow = () => {
    setCargoRows([
      ...cargoRows,
      {
        id: Date.now(),
        calculationMode: formData.cargoCalculationMode || "units",
        quantity: 1,
        volumeUnit: "cm",
        weightUnit: "kg",
      },
    ]);
  };

  const deleteCargoRow = (rowId: number) => {
    if (cargoRows.length > 1) {
      setCargoRows(cargoRows.filter((row) => row.id !== rowId));
    }
  };

  const updateCargoRow = (rowId: number, field: keyof CargoRow, value: string | number | undefined) => {
    setCargoRows(cargoRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const handleCargoModeChange = (value: string) => {
    setFormData({ ...formData, cargoCalculationMode: value });
    setCargoRows(
      cargoRows.map((row) => ({
        ...row,
        calculationMode: value,
      })),
    );
  };

  const updateChargeRow = (rowId: number, field: keyof ChargeRow, value: string | number | undefined) => {
    setChargeRows(
      chargeRows.map((row) => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: value };

          if (field === "currency" && currencyTypes) {
            const selectedCurrency = currencyTypes.find((ct) => ct.code === value);
            if (selectedCurrency) {
              updated.roe = selectedCurrency.roe.toString();
              updated.currencyId = selectedCurrency.id;
            }
          }

          if (field === "costCurrency" && currencyTypes) {
            const selectedCurrency = currencyTypes.find((ct) => ct.code === value);
            if (selectedCurrency) {
              updated.costRoe = selectedCurrency.roe.toString();
              updated.costCurrencyId = selectedCurrency.id;
            }
          }

          if (field === "rate" || field === "roe" || field === "quantity" || field === "currency") {
            const rate = parseFloat(updated.rate) || 0;
            const roe = parseFloat(updated.roe) || 1;
            const qty = parseFloat(updated.quantity) || 0;
            updated.amount = (rate * roe * qty).toFixed(2);
          }

          if (field === "costRate" || field === "costRoe" || field === "costQuantity" || field === "costCurrency") {
            const rate = parseFloat(updated.costRate) || 0;
            const roe = parseFloat(updated.costRoe) || 1;
            const qty = parseFloat(updated.costQuantity) || 0;
            updated.costAmount = (rate * roe * qty).toFixed(2);
          }
          return updated;
        }
        return row;
      })
    );
  };

  const updateLeadField = <K extends keyof LeadWorkflowData>(field: K, value: LeadWorkflowData[K]) => {
    setLeadData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLeadCustomerChange = (value: string) => {
    const customer = debtors.find((debtor) => debtor.id === parseInt(value));
    if (!customer) return;

    setLeadData((prev) => ({
      ...prev,
      customerId: customer.id,
      fullName: customer.name,
      email: customer.email || "",
      phoneNumber: customer.phone || "",
    }));
    setFormData((prev) => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      contactPersonId: undefined,
    }));
  };

  const handleWorkflowVendorChange = (value: string) => {
    const selectedVendor = creditors.find((vendor) => vendor.id === parseInt(value));
    setRateRequestData((prev) => ({
      ...prev,
      vendorId: value,
      vendorEmail: selectedVendor?.email || "",
    }));
  };

  const buildLeadRequest = (): CreateLeadRequest => {
    const details: CreateLeadDetailRequest[] = [];

    if (leadData.shippingType === "FTL") {
      leadData.equipments.forEach((equipment) => {
        details.push({
          detailType: "Equipment",
          quantity: equipment.quantity,
          containerTypeId: equipment.containerTypeId,
          subCategory: equipment.subCategory,
          weight: equipment.weight,
        });
      });
    } else {
      leadData.boxPallets.forEach((item) => {
        details.push({
          detailType: "BoxPallet",
          quantity: item.quantity,
          packageTypeId: item.packageTypeId,
          length: item.length,
          width: item.width,
          height: item.height,
          measurementType: item.measurementType,
          volume: item.volume,
          weight: item.weight,
          weightType: item.weightType,
        });
      });
    }

    return {
      leadType: "ManualLead",
      customerId: leadData.customerId,
      fullName: leadData.fullName,
      email: leadData.email,
      phoneNumber: leadData.phoneNumber,
      freightMode: leadData.freightMode,
      unitOfMeasurement: leadData.unitOfMeasurement,
      shippingType: leadData.shippingType,
      details: details.length > 0 ? details : undefined,
      pickupCountryId: leadData.pickupCountryId,
      loadingPortId: leadData.loadingPortId,
      pickupAddress: leadData.pickupAddress || undefined,
      deliveryCountryId: leadData.deliveryCountryId,
      destinationPortId: leadData.destinationPortId,
      deliveryAddress: leadData.deliveryAddress || undefined,
      goodsReadyDate: leadData.goodsReadyDate || undefined,
      customerReferenceNo: leadData.customerReferenceNo || undefined,
      hsCode: leadData.hsCode || undefined,
      productType: leadData.productType || undefined,
      productDescription: leadData.productDescription || undefined,
      incoTermId: leadData.incoTermId,
      internalNotes: leadData.internalNotes || undefined,
    };
  };

  const handleSave = async () => {
    if (!formData.customerId && !formData.customerName) {
      toast.error("Please select a quotation customer");
      return;
    }

    if (isNewQuotationMode && createLead && (!leadData.fullName || !leadData.email || !leadData.phoneNumber)) {
      toast.error("Please complete lead customer name, email, and phone number");
      return;
    }

    if (isNewQuotationMode && createRateRequest && (!rateRequestData.vendorTypeId || !rateRequestData.vendorId)) {
      toast.error("Please select vendor type and vendor for the rate request");
      return;
    }

    const request: CreateQuotationRequest = {
      quotationDate: formData.quotationDate,
      rateRequestId: conversionRateRequestId || undefined,
      customerId: formData.customerId,
      customerName: formData.customerName || "",
      contactPersonId: formData.contactPersonId,
      customerRefCode: formData.customerRefCode || undefined,
      mode: formData.mode as CreateQuotationRequest["mode"],
      shipmentMode: formData.mode as CreateQuotationRequest["shipmentMode"],
      loadingPortId: formData.loadingPortId,
      destinationPortId: formData.destinationPortId,
      pickupAddress: formData.pickupAddress || undefined,
      deliveryAddress: formData.deliveryAddress || undefined,
      incoTermId: formData.incoTermId,
      quoteExpiryDate: formData.quoteExpiryDate || undefined,
      cargoCalculationMode: formData.cargoCalculationMode,
      status: formData.status,
      remarks: formData.remarks || undefined,
      cfs: formData.cfs || undefined,
      documentRequired: formData.documentRequired || undefined,
      notes: formData.notes || undefined,
      notesForBooking: formData.notesForBooking || undefined,
      internalNotes: formData.internalNotes || undefined,
      charges: chargeRows
        .filter((row) => row.chargeType || row.rate)
        .map((row) => ({
          chargeType: row.chargeType || undefined,
          chargeItemId: row.chargeItemId,
          costingUnitId: row.costingUnitId || undefined,
          currencyId: row.currencyId,
          rate: parseFloat(row.rate) || 0,
          roe: parseFloat(row.roe) || 1,
          quantity: parseFloat(row.quantity) || 0,
          amount: parseFloat(row.amount) || 0,
          costCurrencyId: row.costCurrencyId || undefined,
          costRate: parseFloat(row.costRate) || undefined,
          costRoe: parseFloat(row.costRoe) || undefined,
          costQuantity: parseFloat(row.costQuantity) || undefined,
          costAmount: parseFloat(row.costAmount) || undefined,
        })),
      cargoDetails: cargoRows.map((row) => ({
        calculationMode: row.calculationMode || "units",
        quantity: row.quantity || 1,
        packageTypeId: row.packageTypeId,
        loadType: row.loadType || undefined,
        length: row.length,
        width: row.width,
        height: row.height,
        volumeUnit: row.volumeUnit || undefined,
        cbm: row.cbm,
        weight: row.weight,
        weightUnit: row.weightUnit || undefined,
        totalCbm: row.totalCbm,
        totalWeight: row.totalWeight,
        cargoDescription: row.cargoDescription || undefined,
      })),
    };

    try {
      if (isEditing && quotationId) {
        await updateMutation.mutateAsync({ id: quotationId, data: request });
      } else if (isNewQuotationMode) {
        const selectedVendor = creditors.find((vendor) => vendor.id === parseInt(rateRequestData.vendorId));
        const completeRequest: CreateCompleteQuotationRequest = {
          createLead,
          createRateRequest,
          lead: createLead ? buildLeadRequest() : undefined,
          rateRequest: createRateRequest
            ? {
                vendorId: selectedVendor?.id,
                vendorName: selectedVendor?.name || "",
                vendorType: vendorTypeName,
                vendorEmail: rateRequestData.vendorEmail || undefined,
                internalNotes: rateRequestData.internalNotes || undefined,
                mode: formData.mode as CreateQuotationRequest["mode"],
                shipmentMode: formData.mode as CreateQuotationRequest["shipmentMode"],
                polId: formData.loadingPortId,
                podId: formData.destinationPortId,
              }
            : undefined,
          quotation: {
            ...request,
            rateRequestId: undefined,
            status: "Pending",
          },
        };
        await createCompleteMutation.mutateAsync(completeRequest);
      } else {
        await createMutation.mutateAsync(request);
      }
      navigate("/sales/quotations");
    } catch {
      // Error handled by mutation
    }
  };

  const isSaving = createMutation.isPending || createCompleteMutation.isPending || updateMutation.isPending;

  const getTitle = () => {
    if (isViewMode) return "View Quotation";
    if (isEditing) return "Edit Quotation";
    if (conversionRateRequestId) return "Convert Rate Request to Quotation";
    return "Add New Quotation";
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/sales/quotations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground flex-1">{getTitle()}</h1>
          {quotationId && (
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          )}
        </div>

        {(isEditing || isViewMode) && isQuotationLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading quotation data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* === Locked source context (lead + rate request) === */}
            {hasSourceContext && (
              isSourceRateRequestLoading || isSourceLeadLoading ? (
                <Card>
                  <CardContent className="py-12 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading source lead &amp; rate request...</span>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {sourceLead ? (
                    <LockedLeadSections lead={sourceLead} />
                  ) : (
                    <Card>
                      <CardContent className="py-6 text-center text-sm text-muted-foreground">
                        {sourceRateRequest && !sourceRateRequest.leadId
                          ? "This rate request has no source lead linked."
                          : "Source lead could not be loaded."}
                      </CardContent>
                    </Card>
                  )}
                  {sourceRateRequest && (
                    <LockedRateRequestSection rateRequest={sourceRateRequest} />
                  )}
                </>
              )
            )}

            {isNewQuotationMode && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-primary">Workflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Checkbox
                        checked={createLead}
                        onCheckedChange={(checked) => setCreateLead(checked === true)}
                      />
                      Create Lead
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Checkbox
                        checked={createRateRequest}
                        onCheckedChange={(checked) => setCreateRateRequest(checked === true)}
                      />
                      Create Rate Request
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {isNewQuotationMode && createLead && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-primary">Lead Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Name *</Label>
                      <SearchableSelect
                        options={debtors.map((customer) => ({
                          value: customer.id.toString(),
                          label: customer.name,
                        }))}
                        value={leadData.customerId?.toString() || ""}
                        onValueChange={handleLeadCustomerChange}
                        placeholder="Select customer"
                        searchPlaceholder="Search customers..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address *</Label>
                      <Input
                        type="email"
                        value={leadData.email}
                        onChange={(e) => updateLeadField("email", e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number *</Label>
                      <Input
                        value={leadData.phoneNumber}
                        onChange={(e) => updateLeadField("phoneNumber", e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Mode of Freight *</Label>
                    <ToggleGroup
                      type="single"
                      value={leadData.freightMode}
                      onValueChange={(value) => {
                        if (value) updateLeadField("freightMode", value as FreightMode);
                      }}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="SeaFreight" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6">
                        <Ship className="h-4 w-4 mr-2" />
                        Sea Freight
                      </ToggleGroupItem>
                      <ToggleGroupItem value="AirFreight" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6">
                        <Plane className="h-4 w-4 mr-2" />
                        Air Freight
                      </ToggleGroupItem>
                      <ToggleGroupItem value="LandFreight" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6">
                        <Truck className="h-4 w-4 mr-2" />
                        Land Freight
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Unit of Measurement</Label>
                      <SearchableSelect
                        options={[
                          { value: "KG", label: "KG" },
                          { value: "LB", label: "LB" },
                        ]}
                        value={leadData.unitOfMeasurement}
                        onValueChange={(value) => updateLeadField("unitOfMeasurement", value as UnitOfMeasurement)}
                        placeholder="Select unit"
                        searchPlaceholder="Search..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Shipping Type</Label>
                      <ToggleGroup
                        type="single"
                        value={leadData.shippingType}
                        onValueChange={(value) => {
                          if (value) updateLeadField("shippingType", value as ShippingType);
                        }}
                        className="justify-start"
                      >
                        <ToggleGroupItem value="FTL" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6">
                          <Container className="h-4 w-4 mr-2" />
                          Equipment (FTL)
                        </ToggleGroupItem>
                        <ToggleGroupItem value="LTL" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6">
                          <Package className="h-4 w-4 mr-2" />
                          Box/Pallets (LTL)
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </div>

                  {leadData.shippingType === "FTL" ? (
                    <EquipmentGrid
                      equipments={leadData.equipments}
                      onChange={(equipments) => updateLeadField("equipments", equipments)}
                      containerTypes={containerTypes}
                    />
                  ) : (
                    <BoxPalletsGrid
                      boxPallets={leadData.boxPallets}
                      onChange={(boxPallets) => updateLeadField("boxPallets", boxPallets)}
                      packageTypes={packageTypes}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground">Pickup goods from:</h4>
                      <div className="space-y-2">
                        <Label>Country *</Label>
                        <SearchableSelect
                          options={countries.map((country) => ({
                            value: country.id.toString(),
                            label: `${country.name} (${country.code})`,
                          }))}
                          value={leadData.pickupCountryId?.toString() || ""}
                          onValueChange={(value) => {
                            updateLeadField("pickupCountryId", parseInt(value));
                            updateLeadField("loadingPortId", undefined);
                          }}
                          placeholder="Select country"
                          searchPlaceholder="Search countries..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Loading Port *</Label>
                        <SearchableSelect
                          options={pickupPorts.map((port) => ({
                            value: port.id.toString(),
                            label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ""} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ""} - ${port.city}, ${port.country}`,
                          }))}
                          value={leadData.loadingPortId?.toString() || ""}
                          onValueChange={(value) => updateLeadField("loadingPortId", parseInt(value))}
                          placeholder="Select loading port"
                          searchPlaceholder="Search ports..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pickup Address</Label>
                        <Textarea
                          value={leadData.pickupAddress}
                          onChange={(e) => updateLeadField("pickupAddress", e.target.value)}
                          placeholder="Enter pickup address"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground">Deliver goods to:</h4>
                      <div className="space-y-2">
                        <Label>Country *</Label>
                        <SearchableSelect
                          options={countries.map((country) => ({
                            value: country.id.toString(),
                            label: `${country.name} (${country.code})`,
                          }))}
                          value={leadData.deliveryCountryId?.toString() || ""}
                          onValueChange={(value) => {
                            updateLeadField("deliveryCountryId", parseInt(value));
                            updateLeadField("destinationPortId", undefined);
                          }}
                          placeholder="Select country"
                          searchPlaceholder="Search countries..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Destination Port *</Label>
                        <SearchableSelect
                          options={deliveryPorts.map((port) => ({
                            value: port.id.toString(),
                            label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ""} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ""} - ${port.city}, ${port.country}`,
                          }))}
                          value={leadData.destinationPortId?.toString() || ""}
                          onValueChange={(value) => updateLeadField("destinationPortId", parseInt(value))}
                          placeholder="Select destination port"
                          searchPlaceholder="Search ports..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Address</Label>
                        <Textarea
                          value={leadData.deliveryAddress}
                          onChange={(e) => updateLeadField("deliveryAddress", e.target.value)}
                          placeholder="Enter delivery address"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Goods ready date</Label>
                      <Input
                        type="date"
                        value={leadData.goodsReadyDate}
                        onChange={(e) => updateLeadField("goodsReadyDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer reference No</Label>
                      <Input
                        value={leadData.customerReferenceNo}
                        onChange={(e) => updateLeadField("customerReferenceNo", e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>HS Code</Label>
                      <Input
                        value={leadData.hsCode}
                        onChange={(e) => updateLeadField("hsCode", e.target.value)}
                        placeholder="Enter HS code"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Product Type</Label>
                      <SearchableSelect
                        options={PRODUCT_TYPES.map((type) => ({ value: type, label: type }))}
                        value={leadData.productType}
                        onValueChange={(value) => updateLeadField("productType", value)}
                        placeholder="Select product type"
                        searchPlaceholder="Search product types..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Product description</Label>
                      <Input
                        value={leadData.productDescription}
                        onChange={(e) => updateLeadField("productDescription", e.target.value)}
                        placeholder="Enter product description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Inco Terms</Label>
                      <SearchableSelect
                        options={incoTerms.map((term) => ({
                          value: term.id.toString(),
                          label: `${term.code} - ${term.name}`,
                        }))}
                        value={leadData.incoTermId?.toString() || ""}
                        onValueChange={(value) => updateLeadField("incoTermId", parseInt(value))}
                        placeholder="Select Inco Term"
                        searchPlaceholder="Search inco terms..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Internal Sales Notes</Label>
                    <Textarea
                      value={leadData.internalNotes}
                      onChange={(e) => updateLeadField("internalNotes", e.target.value)}
                      placeholder="Private notes for the internal sales team"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {isNewQuotationMode && createRateRequest && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-primary">Rate Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Rate Code</Label>
                      <Input value="Auto-generated" readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor Type *</Label>
                      <SearchableSelect
                        options={categoryTypes.map((type) => ({
                          value: type.id.toString(),
                          label: type.name,
                        }))}
                        value={rateRequestData.vendorTypeId}
                        onValueChange={(value) =>
                          setRateRequestData((prev) => ({
                            ...prev,
                            vendorTypeId: value,
                            vendorId: "",
                            vendorEmail: "",
                          }))
                        }
                        placeholder="Select vendor type"
                        searchPlaceholder="Search..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor Name *</Label>
                      <SearchableSelect
                        options={filteredVendors.map((vendor) => ({
                          value: vendor.id.toString(),
                          label: vendor.name,
                        }))}
                        value={rateRequestData.vendorId}
                        onValueChange={handleWorkflowVendorChange}
                        placeholder="Select vendor"
                        searchPlaceholder="Search..."
                        emptyMessage={
                          rateRequestData.vendorTypeId
                            ? "No creditors tagged with this vendor type - clear Vendor Type to see all"
                            : "No creditors found"
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vendor Email</Label>
                      <Input
                        value={rateRequestData.vendorEmail}
                        onChange={(e) =>
                          setRateRequestData((prev) => ({ ...prev, vendorEmail: e.target.value }))
                        }
                        placeholder="vendor@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Internal Sales Notes</Label>
                      <Textarea
                        value={rateRequestData.internalNotes}
                        onChange={(e) =>
                          setRateRequestData((prev) => ({ ...prev, internalNotes: e.target.value }))
                        }
                        placeholder="Private notes for the internal sales team"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quotation Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">Quotation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`grid gap-4 ${hasSourceContext ? "grid-cols-3" : "grid-cols-6"}`}>
                  <div className="space-y-2">
                    <Label>Quotation ID</Label>
                    <Input
                      value={quotationDetail?.quotationNo || "Auto-generated"}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  {!hasSourceContext && (
                    <>
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <SearchableSelect
                          disabled={isReadOnly}
                          options={debtors.map((customer) => ({
                            value: customer.id.toString(),
                            label: customer.name,
                          }))}
                          value={formData.customerId?.toString() || ""}
                          onValueChange={(value) => {
                            const customer = debtors.find((c) => c.id === parseInt(value));
                            setFormData({
                              ...formData,
                              customerId: parseInt(value),
                              customerName: customer?.name || "",
                              contactPersonId: undefined,
                            });
                          }}
                          placeholder="Select Company"
                          searchPlaceholder="Search..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Person</Label>
                        <SearchableSelect
                          disabled={isReadOnly || !formData.customerId}
                          options={selectedCustomer?.contacts?.map((contact) => ({
                            value: contact.id.toString(),
                            label: contact.name,
                          })) || []}
                          value={formData.contactPersonId?.toString() || ""}
                          onValueChange={(value) =>
                            setFormData({ ...formData, contactPersonId: parseInt(value) })
                          }
                          placeholder="Select Contact"
                          searchPlaceholder="Search..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Customer Reference Code</Label>
                        <Input
                          value={formData.customerRefCode || ""}
                          onChange={(e) => setFormData({ ...formData, customerRefCode: e.target.value })}
                          disabled={isReadOnly}
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>Quotation Booking No</Label>
                    <Input
                      value={formData.quotationBookingNo || "Auto-generated"}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={[
                        { value: "AirFreight", label: "Air Freight" },
                        { value: "SeaFreightFCL", label: "FCL-Sea Freight" },
                        { value: "SeaFreightLCL", label: "LCL-Sea Freight" },
                        { value: "BreakBulk", label: "Break-Bulk" },
                        { value: "RoRo", label: "RO-RO" },
                        { value: "Courier", label: "Courier" },
                      ]}
                      value={formData.mode || ""}
                      onValueChange={(value) => setFormData({ ...formData, mode: value })}
                      placeholder="Select Mode"
                      searchPlaceholder="Search..."
                    />
                  </div>
                </div>
                <div className={`grid gap-4 ${hasSourceContext ? "grid-cols-3" : "grid-cols-6"}`}>
                  <div className="space-y-2">
                    <Label>Date Of Issue</Label>
                    <Input
                      type="date"
                      value={formData.quotationDate}
                      onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Validity</Label>
                    <Input
                      type="date"
                      value={formData.quoteExpiryDate || ""}
                      onChange={(e) => setFormData({ ...formData, quoteExpiryDate: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  {!hasSourceContext && (
                    <div className="space-y-2">
                      <Label>Incoterm</Label>
                      <SearchableSelect
                        disabled={isReadOnly}
                        options={incoTerms.map((incoTerm) => ({
                          value: incoTerm.id.toString(),
                          label: `${incoTerm.code} - ${incoTerm.name}`,
                        }))}
                        value={formData.incoTermId?.toString() || ""}
                        onValueChange={(value) =>
                          setFormData({ ...formData, incoTermId: parseInt(value) })
                        }
                        placeholder="Select Incoterm"
                        searchPlaceholder="Search..."
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <SearchableSelect
                      disabled={isReadOnly || isNewQuotationMode}
                      options={[
                        { value: "Pending", label: "Pending" },
                        { value: "Approved", label: "Approved" },
                        { value: "Rejected", label: "Rejected" },
                        { value: "Converted", label: "Converted" },
                      ]}
                      value={formData.status || "Pending"}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                      placeholder="Pending"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  {!hasSourceContext && (
                    <>
                      <div className="space-y-2">
                        <Label>Origin/Loading Port</Label>
                        <SearchableSelect
                          disabled={isReadOnly}
                          options={ports.map((port) => ({
                            value: port.id.toString(),
                            label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                          }))}
                          value={formData.loadingPortId?.toString() || ""}
                          onValueChange={(value) =>
                            setFormData({ ...formData, loadingPortId: parseInt(value) })
                          }
                          placeholder="Select Port"
                          searchPlaceholder="Search..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Destination/Discharge Port</Label>
                        <SearchableSelect
                          disabled={isReadOnly}
                          options={ports.map((port) => ({
                            value: port.id.toString(),
                            label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                          }))}
                          value={formData.destinationPortId?.toString() || ""}
                          onValueChange={(value) =>
                            setFormData({ ...formData, destinationPortId: parseInt(value) })
                          }
                          placeholder="Select Port"
                          searchPlaceholder="Search..."
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className={`grid gap-4 ${hasSourceContext ? "grid-cols-2" : "grid-cols-4"}`}>
                  {!hasSourceContext && (
                    <>
                      <div className="space-y-2">
                        <Label>Pick-Up Address</Label>
                        <Textarea
                          placeholder="Pick-Up Address"
                          value={formData.pickupAddress || ""}
                          onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Address</Label>
                        <Textarea
                          placeholder="Delivery Address"
                          value={formData.deliveryAddress || ""}
                          onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                          disabled={isReadOnly}
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      placeholder="Remarks"
                      value={formData.remarks || ""}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CFS</Label>
                    <Textarea
                      placeholder="CFS"
                      value={formData.cfs || ""}
                      onChange={(e) => setFormData({ ...formData, cfs: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Document Required</Label>
                    <Textarea
                      placeholder="Document Required"
                      value={formData.documentRequired || ""}
                      onChange={(e) => setFormData({ ...formData, documentRequired: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Notes"
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (For Booking)</Label>
                    <Textarea
                      placeholder="Notes for Booking"
                      value={formData.notesForBooking || ""}
                      onChange={(e) => setFormData({ ...formData, notesForBooking: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">Internal Sales Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {quotationId ? (
                  <SalesActivityLog
                    entries={quotationDetail?.activityLog ?? []}
                    isReadOnly={isReadOnly}
                    onAdd={handleAddNote}
                  />
                ) : (
                  <Textarea
                    placeholder="Private notes for the internal sales team"
                    value={formData.internalNotes || ""}
                    onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                    disabled={isReadOnly}
                    rows={4}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">Cargo Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-64 space-y-2">
                  <Label>Calculation Mode</Label>
                  <SearchableSelect
                    disabled={isReadOnly}
                    options={[
                      { value: "units", label: "By Units" },
                      { value: "shipment", label: "Shipment Total" },
                    ]}
                    value={formData.cargoCalculationMode || "units"}
                    onValueChange={handleCargoModeChange}
                    placeholder="Select mode"
                    searchPlaceholder="Search..."
                  />
                </div>

                {formData.cargoCalculationMode === "shipment" ? (
                  <>
                    <div className="grid gap-2 text-sm font-medium" style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr 3fr 0.5fr" }}>
                      <div>Qty</div>
                      <div>Load Type</div>
                      <div>Total CBM</div>
                      <div>Total Weight</div>
                      <div>Description</div>
                      <div></div>
                    </div>
                    {cargoRows.map((row, index) => (
                      <div key={row.id} className="grid gap-2" style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr 3fr 0.5fr" }}>
                        <Input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => updateCargoRow(row.id, "quantity", parseInt(e.target.value) || 1)}
                          disabled={isReadOnly}
                        />
                        <Input
                          value={row.loadType || ""}
                          onChange={(e) => updateCargoRow(row.id, "loadType", e.target.value)}
                          placeholder="Load type"
                          disabled={isReadOnly}
                        />
                        <Input
                          type="number"
                          value={row.totalCbm || ""}
                          onChange={(e) => updateCargoRow(row.id, "totalCbm", parseFloat(e.target.value) || undefined)}
                          disabled={isReadOnly}
                        />
                        <Input
                          type="number"
                          value={row.totalWeight || ""}
                          onChange={(e) => updateCargoRow(row.id, "totalWeight", parseFloat(e.target.value) || undefined)}
                          disabled={isReadOnly}
                        />
                        <Input
                          value={row.cargoDescription || ""}
                          onChange={(e) => updateCargoRow(row.id, "cargoDescription", e.target.value)}
                          placeholder="Cargo description"
                          disabled={isReadOnly}
                        />
                        <div>
                          {!isReadOnly &&
                            (index === cargoRows.length - 1 ? (
                              <Button onClick={addCargoRow} className="btn-success w-full">
                                +
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-10 w-full"
                                onClick={() => deleteCargoRow(row.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="grid gap-2 text-sm font-medium" style={{ gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr 1fr 1fr 2fr 0.5fr" }}>
                      <div>Qty</div>
                      <div>Package</div>
                      <div>Length</div>
                      <div>Width</div>
                      <div>Height</div>
                      <div>CBM</div>
                      <div>Weight</div>
                      <div>Description</div>
                      <div></div>
                    </div>
                    {cargoRows.map((row, index) => (
                      <div key={row.id} className="grid gap-2" style={{ gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr 1fr 1fr 2fr 0.5fr" }}>
                        <Input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => updateCargoRow(row.id, "quantity", parseInt(e.target.value) || 1)}
                          disabled={isReadOnly}
                        />
                        <SearchableSelect
                          disabled={isReadOnly}
                          options={packageTypes.map((type) => ({
                            value: type.id.toString(),
                            label: type.name,
                          }))}
                          value={row.packageTypeId?.toString() || ""}
                          onValueChange={(value) => updateCargoRow(row.id, "packageTypeId", parseInt(value))}
                          placeholder="Package"
                          searchPlaceholder="Search..."
                        />
                        <Input
                          type="number"
                          value={row.length || ""}
                          onChange={(e) => updateCargoRow(row.id, "length", parseFloat(e.target.value) || undefined)}
                          disabled={isReadOnly}
                        />
                        <Input
                          type="number"
                          value={row.width || ""}
                          onChange={(e) => updateCargoRow(row.id, "width", parseFloat(e.target.value) || undefined)}
                          disabled={isReadOnly}
                        />
                        <Input
                          type="number"
                          value={row.height || ""}
                          onChange={(e) => updateCargoRow(row.id, "height", parseFloat(e.target.value) || undefined)}
                          disabled={isReadOnly}
                        />
                        <Input
                          type="number"
                          value={row.cbm || ""}
                          onChange={(e) => updateCargoRow(row.id, "cbm", parseFloat(e.target.value) || undefined)}
                          disabled={isReadOnly}
                        />
                        <Input
                          type="number"
                          value={row.weight || ""}
                          onChange={(e) => updateCargoRow(row.id, "weight", parseFloat(e.target.value) || undefined)}
                          disabled={isReadOnly}
                        />
                        <Input
                          value={row.cargoDescription || ""}
                          onChange={(e) => updateCargoRow(row.id, "cargoDescription", e.target.value)}
                          placeholder="Cargo description"
                          disabled={isReadOnly}
                        />
                        <div>
                          {!isReadOnly &&
                            (index === cargoRows.length - 1 ? (
                              <Button onClick={addCargoRow} className="btn-success w-full">
                                +
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-10 w-full"
                                onClick={() => deleteCargoRow(row.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Charges Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">Charges Details</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Group sub-headers */}
                <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '2fr 1fr 5fr 5fr 0.5fr' }}>
                  <div></div>
                  <div></div>
                  <div className="text-center text-sm font-semibold text-blue-600 bg-blue-50 rounded px-1 py-0.5">Sale</div>
                  <div className="text-center text-sm font-semibold text-green-600 bg-green-50 rounded px-1 py-0.5">Cost</div>
                  <div></div>
                </div>
                {/* Column headers */}
                <div className="grid gap-1 mb-2 text-sm font-medium" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr' }}>
                  <div>Charge Type</div>
                  <div>Unit</div>
                  <div>Currency</div>
                  <div>Rate</div>
                  <div>ROE</div>
                  <div>Qty</div>
                  <div>Amount</div>
                  <div>Currency</div>
                  <div>Rate</div>
                  <div>ROE</div>
                  <div>Qty</div>
                  <div>Amount</div>
                  <div></div>
                </div>
                {chargeRows.map((row, index) => (
                  <div key={row.id} className="grid gap-1 mb-2" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr' }}>
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={chargeItems.map((ci) => ({
                        value: ci.id.toString(),
                        label: ci.name,
                      }))}
                      value={row.chargeItemId?.toString() || ""}
                      onValueChange={(value) => {
                        const chargeItem = chargeItems.find((ci) => ci.id === parseInt(value));
                        setChargeRows(
                          chargeRows.map((r) =>
                            r.id === row.id
                              ? {
                                  ...r,
                                  chargeItemId: parseInt(value),
                                  chargeType: chargeItem?.name || "",
                                }
                              : r
                          )
                        );
                      }}
                      placeholder="Select Charge"
                      searchPlaceholder="Search..."
                    />
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={costingUnits.map((u) => ({
                        value: u.id.toString(),
                        label: u.name,
                      }))}
                      value={row.costingUnitId?.toString() || ""}
                      onValueChange={(value) =>
                        updateChargeRow(row.id, "costingUnitId", parseInt(value))
                      }
                      placeholder="Unit"
                      searchPlaceholder="Search..."
                    />
                    {/* Sale columns */}
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={currencyTypes.map((ct) => ({
                        value: ct.code,
                        label: ct.code,
                      }))}
                      value={row.currency}
                      onValueChange={(value) => updateChargeRow(row.id, "currency", value)}
                      placeholder="Cur"
                      searchPlaceholder="Search..."
                    />
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={row.rate}
                      onChange={(e) => updateChargeRow(row.id, "rate", e.target.value)}
                      disabled={isReadOnly}
                    />
                    <Input
                      type="number"
                      placeholder="ROE"
                      value={row.roe}
                      onChange={(e) => updateChargeRow(row.id, "roe", e.target.value)}
                      disabled={isReadOnly}
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => updateChargeRow(row.id, "quantity", e.target.value)}
                      disabled={isReadOnly}
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={row.amount}
                      readOnly
                      className="bg-muted"
                    />
                    {/* Cost columns */}
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={currencyTypes.map((ct) => ({
                        value: ct.code,
                        label: ct.code,
                      }))}
                      value={row.costCurrency}
                      onValueChange={(value) => updateChargeRow(row.id, "costCurrency", value)}
                      placeholder="Cur"
                      searchPlaceholder="Search..."
                    />
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={row.costRate}
                      onChange={(e) => updateChargeRow(row.id, "costRate", e.target.value)}
                      disabled={isReadOnly}
                    />
                    <Input
                      type="number"
                      placeholder="ROE"
                      value={row.costRoe}
                      onChange={(e) => updateChargeRow(row.id, "costRoe", e.target.value)}
                      disabled={isReadOnly}
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={row.costQuantity}
                      onChange={(e) => updateChargeRow(row.id, "costQuantity", e.target.value)}
                      disabled={isReadOnly}
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={row.costAmount}
                      readOnly
                      className="bg-muted"
                    />
                    <div>
                      {!isReadOnly &&
                        (index === chargeRows.length - 1 ? (
                          <Button
                            onClick={addChargeRow}
                            className="btn-success w-full"
                          >
                            +
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-10 w-full"
                            onClick={() => deleteChargeRow(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pb-6">
              <Button variant="outline" onClick={() => navigate("/sales/quotations")}>
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button
                  className="btn-success"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isEditing ? "Update" : "Save"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      {quotationId && (
        <SalesActivityLogModal
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          title={`Quotation History${quotationDetail?.quotationNo ? ` — ${quotationDetail.quotationNo}` : ""}`}
          entries={quotationDetail?.activityLog ?? []}
          isReadOnly={isReadOnly}
          onAdd={handleAddNote}
        />
      )}
    </MainLayout>
  );
}
