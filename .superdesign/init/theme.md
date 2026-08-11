# Theme

## Compact token summary

- Brand: WayBill; freight operations SaaS; brand promise “Freight forwarding, simplified.”
- Font: Inter, weights 300–700. Root UI size is 13px; body uses antialiased sans.
- Light canvas: background `hsl(150 29% 97%)` / approximately `#F6FAF8`; cards white; foreground `hsl(165 23% 14%)` / approximately `#1B2B27`.
- Brand action: emerald `#00C889` (`hsl(161 100% 39%)`) with deep-teal text.
- Navigation and table headers: deep teal `#052E26` (`hsl(168 80% 10%)`).
- Supporting mint: `#6FE6B2`; border: `#DDE9E4`; soft accent and row hover use very pale mint.
- Semantic colors: destructive red, warning amber, info blue; status UI also uses emerald, gray, and red.
- Radius: base 0.5rem; md subtracts 2px; sm subtracts 4px.
- Spacing: Tailwind default scale; common control heights 36–40px; page padding 24px; grid cells currently 16px.
- Shadows: Tailwind `shadow-sm` for panels and `shadow-lg` for dialogs; no custom shadow scale.
- Breakpoints: Tailwind defaults; sidebar switches to desktop at `lg`; container max `2xl: 1400px`.
- Motion: 200ms color/state transitions; 300ms sidebar slide/fade; Radix enter/exit motion.
- Dark theme variables exist, but the current operational UI is primarily light with a deep-teal shell.

## Raw brand configuration

```ts
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
```

## Raw Tailwind configuration

```ts
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        table: {
          header: "hsl(var(--table-header))",
          "header-foreground": "hsl(var(--table-header-foreground))",
          "row-hover": "hsl(var(--table-row-hover))",
        },
        modal: {
          header: "hsl(var(--modal-header))",
          "header-foreground": "hsl(var(--modal-header-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          muted: "hsl(var(--sidebar-muted))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Modal-only width scale, ~10% larger than each Tailwind default.
      // Use as `max-w-modal-md`, `max-w-modal-lg`, etc. on DialogContent
      // (and the base Dialog/AlertDialog primitives). Plain max-w-md/lg/...
      // remain at Tailwind defaults so non-modal layouts are unaffected.
      maxWidth: {
        "modal-md":  "30.8rem", // 448  -> 493
        "modal-lg":  "35.2rem", // 512  -> 563
        "modal-xl":  "39.6rem", // 576  -> 634
        "modal-2xl": "46.2rem", // 672  -> 739
        "modal-3xl": "52.8rem", // 768  -> 845
        "modal-4xl": "61.6rem", // 896  -> 986
        "modal-5xl": "70.4rem", // 1024 -> 1126
        "modal-6xl": "79.2rem", // 1152 -> 1267
        "modal-7xl": "88rem",   // 1280 -> 1408
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
```

## Raw global CSS

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;


@layer base {
  :root {
    --background: 150 29% 97%;
    --foreground: 165 23% 14%;

    --card: 0 0% 100%;
    --card-foreground: 165 23% 14%;

    --popover: 0 0% 100%;
    --popover-foreground: 165 23% 14%;

    --primary: 161 100% 39%;
    --primary-foreground: 168 80% 10%;

    --secondary: 154 70% 93%;
    --secondary-foreground: 168 80% 10%;

    --muted: 150 24% 94%;
    --muted-foreground: 165 12% 43%;

    --accent: 154 70% 90%;
    --accent-foreground: 168 80% 10%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --border: 155 21% 89%;
    --input: 155 21% 89%;
    --ring: 161 100% 39%;

    --radius: 0.5rem;

    /* WayBill deep teal navigation */
    --sidebar-background: 168 80% 10%;
    --sidebar-foreground: 150 29% 97%;
    --sidebar-primary: 161 100% 39%;
    --sidebar-primary-foreground: 168 80% 10%;
    --sidebar-accent: 167 50% 16%;
    --sidebar-accent-foreground: 150 29% 97%;
    --sidebar-border: 166 36% 21%;
    --sidebar-ring: 154 70% 67%;
    --sidebar-muted: 157 22% 66%;

    /* Custom tokens */
    --success: 161 100% 39%;
    --success-foreground: 168 80% 10%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;
    --info: 200 80% 50%;
    --info-foreground: 0 0% 100%;

    /* Table */
    --table-header: 168 80% 10%;
    --table-header-foreground: 150 29% 97%;
    --table-row-hover: 154 70% 95%;

    --modal-header: 168 80% 10%;
    --modal-header-foreground: 150 29% 97%;
  }

  .dark {
    --background: 220 20% 10%;
    --foreground: 0 0% 95%;

    --card: 220 20% 13%;
    --card-foreground: 0 0% 95%;

    --popover: 220 20% 13%;
    --popover-foreground: 0 0% 95%;

    --primary: 161 100% 39%;
    --primary-foreground: 168 80% 10%;

    --secondary: 220 15% 20%;
    --secondary-foreground: 0 0% 95%;

    --muted: 220 15% 20%;
    --muted-foreground: 220 10% 60%;

    --accent: 166 38% 20%;
    --accent-foreground: 154 70% 67%;

    --destructive: 0 62% 40%;
    --destructive-foreground: 0 0% 100%;

    --border: 220 15% 25%;
    --input: 220 15% 25%;
    --ring: 161 100% 39%;

    --sidebar-background: 168 80% 8%;
    --sidebar-foreground: 0 0% 95%;
    --sidebar-primary: 161 100% 39%;
    --sidebar-primary-foreground: 168 80% 8%;
    --sidebar-accent: 167 48% 15%;
    --sidebar-accent-foreground: 0 0% 95%;
    --sidebar-border: 166 35% 20%;
    --sidebar-ring: 154 70% 67%;
    --sidebar-muted: 157 22% 66%;

    --table-header: 168 80% 10%;
    --table-header-foreground: 0 0% 100%;
    --table-row-hover: 166 35% 15%;

    --modal-header: 168 80% 10%;
    --modal-header-foreground: 0 0% 100%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  html {
    font-size: 13px;
  }

  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-family: 'Inter', sans-serif;
  }
}

@layer components {
  .form-label {
    @apply text-sm font-medium text-primary mb-1.5 block;
  }
  
  .form-input {
    @apply w-full px-3 py-2.5 border border-input rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200;
  }

  .form-textarea {
    @apply w-full px-3 py-2.5 border border-input rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 min-h-[80px] resize-y;
  }

  .btn-success {
    @apply bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-all duration-200;
  }

  .btn-danger {
    @apply bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md font-medium transition-all duration-200;
  }

  .sidebar-item {
    @apply flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-all duration-200 cursor-pointer;
  }

  .sidebar-item-active {
    @apply bg-sidebar-accent border-l-4 border-sidebar-primary;
  }
}
```

