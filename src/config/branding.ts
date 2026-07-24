import iconDarkBackground from "@/assets/waybill-icon/waybill-icon-dark-bg.png";
import iconTransparent from "@/assets/waybill-icon/waybill-icon-transparent.png";
import wordmarkDarkBackground from "@/assets/waybill-icon/waybill-wordmark-dark-bg.png";

export const BRAND = {
  productName: "WayBill",
  legalName: "WayBill Logistics LLC",
  tagline: "Freight forwarding, simplified.",
  email: "demo@waybill-logistics.com",
  phone: "+971 4 555 0198",
  website: "demo.syntropyinc.co",
  address: "Dubai, United Arab Emirates",
  internalSalespersonLabel: "WayBill",
  colors: {
    emerald: "#00C889",
    mint: "#6FE6B2",
    deepTeal: "#052E26",
    background: "#F6FAF8",
    text: "#1B2B27",
    border: "#DDE9E4",
  },
  assets: {
    iconDarkBackground,
    iconTransparent,
    wordmarkDarkBackground,
  },
} as const;
