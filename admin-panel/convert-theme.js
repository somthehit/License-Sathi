import fs from 'fs';
import path from 'path';

const config = {
  theme: {
    extend: {
      colors: {
        "surface-bright": "#fcf9f8",
        "primary-fixed": "#ffdad9",
        "on-primary-fixed": "#40000a",
        "error-container": "#ffdad6",
        "on-tertiary-fixed-variant": "#544600",
        "inverse-primary": "#ffb3b3",
        "tertiary-container": "#c9a900",
        "on-secondary-container": "#003387",
        "on-tertiary-fixed": "#221b00",
        "background": "#fcf9f8",
        "surface": "#fcf9f8",
        "surface-container-high": "#eae7e7",
        "secondary-fixed-dim": "#b3c5ff",
        "on-surface": "#1c1b1b",
        "on-primary-fixed-variant": "#920022",
        "on-tertiary-container": "#4c3f00",
        "inverse-surface": "#313030",
        "surface-container-low": "#f6f3f2",
        "secondary": "#335ab4",
        "surface-variant": "#e5e2e1",
        "outline": "#916f6e",
        "primary": "#b1002c",
        "outline-variant": "#e6bdbc",
        "on-background": "#1c1b1b",
        "on-tertiary": "#ffffff",
        "inverse-on-surface": "#f3f0ef",
        "secondary-fixed": "#dae1ff",
        "primary-container": "#dc143c",
        "primary-fixed-dim": "#ffb3b3",
        "error": "#ba1a1a",
        "surface-container": "#f0eded",
        "on-secondary-fixed": "#001849",
        "on-surface-variant": "#5c3f3f",
        "on-secondary-fixed-variant": "#12419b",
        "on-secondary": "#ffffff",
        "secondary-container": "#7da0ff",
        "surface-tint": "#bf0030",
        "tertiary-fixed": "#ffe16d",
        "surface-dim": "#dcd9d9",
        "surface-container-highest": "#e5e2e1",
        "on-primary-container": "#fff1f0",
        "on-error-container": "#93000a",
        "on-error": "#ffffff"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "xl": "32px",
        "base": "4px",
        "sm": "8px",
        "lg": "24px",
        "container-margin": "20px",
        "xs": "4px",
        "md": "16px",
        "gutter": "16px"
      },
      fontFamily: {
        "headline-sm": ["Plus Jakarta Sans", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "display-lg": ["Plus Jakarta Sans", "sans-serif"],
        "headline-md": ["Plus Jakarta Sans", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "headline-lg-mobile": ["Plus Jakarta Sans", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"]
      },
      fontSize: {
        "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
        "label-md": ["14px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
        "display-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-lg-mobile": ["28px", {"lineHeight": "36px", "fontWeight": "700"}],
        "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}]
      }
    }
  }
};

let css = `@import "tailwindcss";
@plugin "@tailwindcss/forms";
@plugin "@tailwindcss/container-queries";

@theme {
`;

for (const [key, value] of Object.entries(config.theme.extend.colors)) {
  css += `  --color-${key}: ${value};\n`;
}

for (const [key, value] of Object.entries(config.theme.extend.borderRadius)) {
  css += `  --radius-${key === 'DEFAULT' ? 'base' : key}: ${value};\n`;
}

for (const [key, value] of Object.entries(config.theme.extend.spacing)) {
  css += `  --spacing-${key}: ${value};\n`;
}

for (const [key, value] of Object.entries(config.theme.extend.fontFamily)) {
  css += `  --font-${key}: ${value.map(v => '"' + v + '"').join(', ')};\n`;
}

// Convert fontSize properly for v4
for (const [key, value] of Object.entries(config.theme.extend.fontSize)) {
  css += `  --text-${key}: ${value[0]};\n`;
  if (value[1].lineHeight) {
    css += `  --text-${key}--line-height: ${value[1].lineHeight};\n`;
  }
  if (value[1].fontWeight) {
    css += `  --text-${key}--font-weight: ${value[1].fontWeight};\n`;
  }
  if (value[1].letterSpacing) {
    css += `  --text-${key}--letter-spacing: ${value[1].letterSpacing};\n`;
  }
}

css += `}

@layer base {
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    display: inline-block;
    vertical-align: middle;
  }
}

@layer utilities {
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e2e1; border-radius: 10px; }
  
  .question-row:hover {
      background-color: #f6f3f2;
      transition: background-color 0.2s ease;
  }
}
`;

fs.writeFileSync(path.join(process.cwd(), 'src', 'app', 'globals.css'), css);
console.log("globals.css rewritten successfully with Tailwind v4 syntax.");
