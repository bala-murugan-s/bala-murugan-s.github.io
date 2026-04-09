⭐ MASTER PROMPT FOR FINANCIAL CALCULATORS WEBSITE
(Copy & paste this into a new conversation whenever you want to generate a new page)
I want you to generate a page using my “Finance Console UI System”.

This UI system includes:

1. Left Sidebar (always required)
   - Brand title: 
   - Sub-title: Financial Tools & Personal Wealth Calculators
   - Meta lines:
       Wealth Planning · Tax Optimization · ROI · Investments
       SIP · SWP · FD · RD · Loans · Forex · Gold · Solar
   - Navigation items:
       Home
       Financial Calculators
       Investments
       Loans
       Taxes
       Currency Tools
       Gold & Metals
       Solar Power
       About
       Contact
   - All sidebar links point back to:
       ../index.html   (same home navigation pattern as my architecture console)

   - Current page shows its own footer pill:
       “<Suite Name> Workspace”

2. Topbar requirements:
   - Title (Suite Name)
   - Subtitle (short description)
   - Back to Console button (../index.html)
   - Dark/Light theme toggle using body[data-theme]

3. Theme Engine (must match my Security Console UI)
   These CSS variables MUST exist:
       --bg
       --panel
       --border
       --text
       --muted
       --accent
       --accent-soft
       --radius
       --transition-fast
   Light mode & dark mode MUST work exactly like my console styling.

4. Accent Color Logic:
   I will provide:
       PRIMARY: <hex>
       SOFT: <rgba>

   Apply that accent color:
       - in panel radial glow highlights
       - in tool card header gradient
       - in tool-card glow on hover
       - in footer tags
       - in buttons
       - in accents inside topbar

5. Page Layout Requirements:
   Use the same panel system as my Security Console UI:
       .panel
       .panel-body
       .panel-footer

   Use the same layout:
       .tools-layout  → left (tools) + right (notes/roadmap)
       .tools-grid    → card listing area for calculators

   Everything must be visually identical to the Security Tools / Network Tools / Firewall Tools layout.

6. Tool Card Requirements:
   - Wrap each card in a FULL PROPER <a> ... </a> tag.
   - Use this structure:
       subfolder/index.html
         <div class="tool-card-header">...</div>
         <div class="tool-card-body">...</div>
         <div class="tool-card-footer">...</div>
       </a>

   - Header ALWAYS uses a gradient:
         background: linear-gradient(135deg, var(--accent), <slightly-dark-accent>);
   - Card background ALWAYS has radial glow:
         radial-gradient(circle at top left, var(--accent-soft), transparent 55%)

7. Folder Structure:
   The generated page will live inside:
       <suite-name>/

   Each tool launches into:
       <suite-name>/<tool-name>/index.html

   Example:
       loans/home-loan/index.html
       investments/sip-calculator/index.html
       currency/converter/index.html

8. What I will provide:
   - The suite folder name (e.g., loans/, investments/, currency-tools/)
   - The accent colors for that suite
   - The title & subtitle
   - The calculator/tool list
   - The link structure

9. What you must generate:
   - A FULL SELF-CONTAINED HTML PAGE
   - With inline CSS (no external files, no tailwind)
   - EXACT same UI framework used in my existing console
   - Only replace:
       • accent color
       • page title/subtitle
       • sidebar footer pill
       • tool list
       • tool descriptions
       • tool links
   - DO NOT change the layout, theme engine, or component structure.

10. Do not simplify the HTML.  
    Do not remove topbar.  
    Do not remove side navigation.  
    Do not modify theme engine.  
    Do not introduce Tailwind.  
    Use ONLY the console-style architecture.

Generate ONLY the final HTML file ready to paste into <suite-name>/index.html.


🎯 HOW TO USE THIS FOR FINANCIAL CALCULATORS
When creating a new suite, e.g., Financial Calculators, you would add:
Suite Folder: financial-calculators/
Accent:
  Primary: #38bdf8
  Soft: rgba(56,189,248,0.16)

Title: Financial Calculators Suite
Subtitle: SIP, SWP, FD, RD, Loans, Tax, Currency, Gold & Wealth Tools.

Tools:
- sip-calculator/
- swp-calculator/
- fd-calculator/
- rd-calculator/
- home-loan-calculator/
- personal-loan-calculator/
- gold-loan-calculator/
- tax-calculator/
- solar-power-calculator/
- currency-converter/
- currency-denomination/
- gold-rate-calculator/

Generate page now.
