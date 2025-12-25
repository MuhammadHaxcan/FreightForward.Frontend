import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";

interface ChargeItem {
  description: string;
  basis: string;
  currency: string;
  quantity: string;
  unitPrice: string;
  totalAmount: string;
}

interface QuotationData {
  id: string;
  quotationNo: string;
  date: string;
  validity: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shipmentDetails: {
    mode: string;
    incoterms: string;
    pickupAddress: string;
    deliveryAddress: string;
    originPort: string;
    destinationPort: string;
    noOfPkgs: string;
    grossWeight: string;
    cbm: string;
    loadType: string;
  };
  charges: ChargeItem[];
  termsConditions: string;
  notes1: string;
  notes2: string;
}

// Mock data - in a real app, this would come from an API or state management
const mockQuotationData: Record<string, QuotationData> = {
  "1": {
    id: "1",
    quotationNo: "QTAE10992",
    date: "25-Dec-2025",
    validity: "31-Dec-2025",
    customer: {
      name: "SKY SHIPPING LINE (LLC)",
      email: "kashif@skyshippingline.com",
      phone: "",
    },
    shipmentDetails: {
      mode: "LCL-Sea Freight",
      incoterms: "FOB-FREE ON BOARD",
      pickupAddress: "QINGDAO",
      deliveryAddress: "JEBEL ALI",
      originPort: "Qingdao",
      destinationPort: "Jebel Ali",
      noOfPkgs: "4",
      grossWeight: "2455",
      cbm: "2.30",
      loadType: "PALLETS",
    },
    charges: [
      { description: "Ocean Freight Charges", basis: "PER WM", currency: "USD", quantity: "2.4550", unitPrice: "45.00", totalAmount: "407.10" },
      { description: "Delivery Order Charges", basis: "PER BL", currency: "AED", quantity: "1.0000", unitPrice: "612.50", totalAmount: "612.50" },
    ],
    termsConditions: "",
    notes1: "",
    notes2: "",
  },
  "2": {
    id: "2",
    quotationNo: "QTAE10991",
    date: "24-Dec-2025",
    validity: "15-Jan-2026",
    customer: {
      name: "CAKE DECORATION CENTER FOR TRADING",
      email: "info@cakedecorationcenter.com",
      phone: "+971 4 123 4567",
    },
    shipmentDetails: {
      mode: "FCL-Sea Freight",
      incoterms: "EXW-EX WORKS",
      pickupAddress: "BARCELONA",
      deliveryAddress: "RIYADH",
      originPort: "Barcelona",
      destinationPort: "Dammam",
      noOfPkgs: "1",
      grossWeight: "18000",
      cbm: "67.00",
      loadType: "40FT CONTAINER",
    },
    charges: [
      { description: "Ocean Freight Charges", basis: "PER CONTAINER", currency: "USD", quantity: "1.0000", unitPrice: "2500.00", totalAmount: "2500.00" },
      { description: "THC Origin", basis: "PER CONTAINER", currency: "EUR", quantity: "1.0000", unitPrice: "350.00", totalAmount: "350.00" },
      { description: "Documentation Fee", basis: "PER BL", currency: "USD", quantity: "1.0000", unitPrice: "75.00", totalAmount: "75.00" },
    ],
    termsConditions: "Payment terms: 30 days from invoice date",
    notes1: "Subject to space and equipment availability",
    notes2: "",
  },
};

// Generate mock data for other IDs
for (let i = 3; i <= 7; i++) {
  mockQuotationData[i.toString()] = {
    id: i.toString(),
    quotationNo: `QTAE1099${8 - i + 2}`,
    date: `${25 - i}-Dec-2025`,
    validity: "31-Dec-2025",
    customer: {
      name: "TRANSPARENT FREIGHT SERVICES",
      email: "info@tfs-global.com",
      phone: "+971 4 239 6853",
    },
    shipmentDetails: {
      mode: "Air Freight",
      incoterms: "DDU-DELIVERED DUTY UNPAID",
      pickupAddress: "KARACHI",
      deliveryAddress: "DUBAI",
      originPort: "Karachi",
      destinationPort: "Dubai",
      noOfPkgs: "10",
      grossWeight: "500",
      cbm: "1.50",
      loadType: "CARTONS",
    },
    charges: [
      { description: "Air Freight Charges", basis: "PER KG", currency: "USD", quantity: "500", unitPrice: "2.50", totalAmount: "1250.00" },
      { description: "Customs Clearance", basis: "PER SHIPMENT", currency: "AED", quantity: "1.0000", unitPrice: "850.00", totalAmount: "850.00" },
    ],
    termsConditions: "",
    notes1: "",
    notes2: "",
  };
}

export default function QuotationView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const quotation = id ? mockQuotationData[id] : null;

  if (!quotation) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Quotation not found</h1>
          <Button onClick={() => navigate("/sales/quotations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotations
          </Button>
        </div>
      </div>
    );
  }

  const calculateTotal = () => {
    // For simplicity, we'll show the AED total (would need currency conversion in real app)
    let total = 0;
    quotation.charges.forEach(charge => {
      const amount = parseFloat(charge.totalAmount) || 0;
      if (charge.currency === "AED") {
        total += amount;
      } else if (charge.currency === "USD") {
        total += amount * 3.67; // USD to AED conversion
      } else if (charge.currency === "EUR") {
        total += amount * 4.02; // EUR to AED conversion
      }
    });
    return total.toFixed(2);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-600">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate("/sales/quotations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotations
          </Button>
          <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white">
            <Printer className="h-4 w-4 mr-2" />
            Print Quotation
          </Button>
        </div>
      </div>

      {/* Quotation Document */}
      <div className="py-8 print:py-0">
        <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none">
          {/* Header */}
          <div className="p-8 print:p-6">
            <div className="flex justify-between items-start mb-8">
              {/* Company Logo and Name */}
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-4xl font-bold">
                    <span className="text-green-600">TRANS</span>
                    <span className="text-gray-800">PA</span>
                    <span className="text-green-600">RENT</span>
                  </span>
                </div>
                <div className="text-lg font-semibold text-gray-700 tracking-wider">
                  FREIGHT SERVICES
                </div>
                <div className="text-sm text-green-600 italic">
                  Your Trusted Logistics Provider
                </div>
              </div>

              {/* Company Contact Info */}
              <div className="text-right text-sm">
                <p className="font-bold text-gray-800">TRANSPARENT FREIGHT SERVICES LLC</p>
                <p className="text-gray-600">M110, M FLOOR, SHAIKHA MHARA AL-QUSAIS</p>
                <p className="text-gray-600">BLDG., AL QUSAIS 2</p>
                <p className="text-gray-600 mt-2">TEL : 04-2396853</p>
                <p className="text-green-600">United Arab Emirates</p>
                <p className="text-blue-600">EMAIL:info@tfs-global.com</p>
                <p className="text-blue-600">WEBSITE:www.tfs-global.com</p>
              </div>
            </div>

            {/* Quotation Title Bar */}
            <div className="bg-green-600 text-white text-center py-3 text-xl font-semibold mb-6">
              QUOTATION
            </div>

            {/* Customer and Quotation Info */}
            <div className="flex justify-between mb-6">
              <div>
                <p><span className="font-semibold">Customer :</span></p>
                <p className="font-bold text-gray-800">{quotation.customer.name}</p>
                <p className="text-gray-600">Email : {quotation.customer.email}</p>
                <p className="text-gray-600">Phone : {quotation.customer.phone}</p>
              </div>
              <div className="text-right">
                <p><span className="font-semibold">Quotation No</span> : {quotation.quotationNo}</p>
                <p><span className="font-semibold">Date</span> : {quotation.date}</p>
                <p><span className="font-semibold">Validity</span> : {quotation.validity}</p>
              </div>
            </div>

            {/* Shipment Details Table */}
            <div className="border border-gray-300 mb-6">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="p-2 bg-gray-100 font-semibold border-r border-gray-300 w-1/6">Mode of Shipment</td>
                    <td className="p-2 border-r border-gray-300 w-1/3">: {quotation.shipmentDetails.mode}</td>
                    <td className="p-2 bg-gray-100 font-semibold border-r border-gray-300 w-1/6">Origin/Loading Port</td>
                    <td className="p-2 w-1/3">: {quotation.shipmentDetails.originPort}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-2 bg-gray-100 font-semibold border-r border-gray-300">Incoterms</td>
                    <td className="p-2 border-r border-gray-300">: {quotation.shipmentDetails.incoterms}</td>
                    <td className="p-2 bg-gray-100 font-semibold border-r border-gray-300">Destination/Discharge Port</td>
                    <td className="p-2">: {quotation.shipmentDetails.destinationPort}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-2 bg-gray-100 font-semibold border-r border-gray-300">Pickup Address</td>
                    <td className="p-2 border-r border-gray-300 font-bold text-green-700">: {quotation.shipmentDetails.pickupAddress}</td>
                    <td className="p-2 bg-gray-100 font-semibold border-r border-gray-300">No.of Pkgs</td>
                    <td className="p-2">: {quotation.shipmentDetails.noOfPkgs}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-2 bg-gray-100 font-semibold border-r border-gray-300">Delivery Address</td>
                    <td className="p-2 border-r border-gray-300 font-bold text-green-700">: {quotation.shipmentDetails.deliveryAddress}</td>
                    <td className="p-2 bg-gray-100 font-semibold border-r border-gray-300">Gross Weight</td>
                    <td className="p-2">: {quotation.shipmentDetails.grossWeight}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-2 bg-gray-100 font-semibold border-r border-gray-300"></td>
                    <td className="p-2 border-r border-gray-300"></td>
                    <td className="p-2 bg-gray-100 font-semibold border-r border-gray-300">CBM</td>
                    <td className="p-2">: {quotation.shipmentDetails.cbm}</td>
                  </tr>
                  <tr>
                    <td className="p-2 bg-gray-100 font-semibold border-r border-gray-300"></td>
                    <td className="p-2 border-r border-gray-300"></td>
                    <td className="p-2 bg-gray-100 font-semibold border-r border-gray-300">Load Type</td>
                    <td className="p-2 font-bold">: {quotation.shipmentDetails.loadType}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Charges Details Table */}
            <div className="border border-gray-300 mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="p-2 text-left font-semibold">Charges Details</th>
                    <th className="p-2 text-center font-semibold">Basis</th>
                    <th className="p-2 text-center font-semibold">Curr</th>
                    <th className="p-2 text-center font-semibold">Qty</th>
                    <th className="p-2 text-center font-semibold">Unit Price</th>
                    <th className="p-2 text-center font-semibold">Total Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.charges.map((charge, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="p-2">{charge.description}</td>
                      <td className="p-2 text-center">{charge.basis}</td>
                      <td className="p-2 text-center">{charge.currency}</td>
                      <td className="p-2 text-center">{charge.quantity}</td>
                      <td className="p-2 text-right">{charge.unitPrice}</td>
                      <td className="p-2 text-right">{charge.totalAmount}</td>
                    </tr>
                  ))}
                  <tr className="bg-green-100">
                    <td colSpan={4}></td>
                    <td className="p-2 text-right font-bold">Esti.Total</td>
                    <td className="p-2 text-right font-bold">AED {calculateTotal()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Terms & Conditions */}
            <div className="border border-gray-300 mb-4 p-3">
              <p className="font-semibold text-gray-800">Terms & Conditions :</p>
              <p className="text-gray-600 min-h-[20px]">{quotation.termsConditions}</p>
            </div>

            {/* Notes */}
            <div className="border border-gray-300 mb-4 p-3">
              <p className="font-semibold text-gray-800">Notes1 :</p>
              <p className="text-gray-600 min-h-[20px]">{quotation.notes1}</p>
            </div>

            <div className="border border-gray-300 p-3">
              <p className="font-semibold text-gray-800">Notes2 :</p>
              <p className="text-gray-600 min-h-[20px]">{quotation.notes2}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
