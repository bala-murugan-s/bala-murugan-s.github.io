
You are building a **vanilla HTML/CSS/JS webapp**, delivered as actual files (HTML, CSS, JS) created via Python in the work directory and packaged as a ZIP. No frameworks, no external CDNs—only native browser APIs.

### Goal
Create a multi-step **wizard-style webapp** called **{{APP_NAME}}** that helps users {{PRIMARY_PURPOSE}}, and generates {{OUTPUT_ARTIFACTS}} (e.g., JSON/YAML/INI/cURL/Ansible snippets).

### Scope & Must-have Features
1) **File outputs**
   - Create these files:
     - `index.html` (main page)
     - `styles.css` (theme + layout)
     - `js/main.js` (bootstrap/wiring)
     - `js/model.js` (data model + defaults)
     - `js/ui.js` (DOM bindings, step navigation, cloning rows, floating sidebar updates)
     - `js/validation.js` (inline validations + error callouts)
     - `js/chart.js` (Canvas bar/line charts)
     - `js/generators.js` (builds payload files: {{LIST_OF_GENERATED_FILES}})
     - `js/storage.js` (localStorage Save/Load + JSON Import/Export)
     - `js/zip.js` (pure-JS zip builder, store-only, no compression)
   - After creating files with Python, **also create a ZIP** `{{APP_SLUG}}-bundle.zip` and return download links to each file and the ZIP.

2) **UI / UX**
   - 5–7 step wizard (pills at top):
     - Steps: {{STEPS_LIST}} (e.g., 1 Product → 2 Tenant/Auth → 3 Policy Types → 4 Build Rules → 5 Review & Generate)
   - **Floating summary sidebar** with live counts and selections.
   - **Dark/Light mode toggle** (CSS variables).
   - **Modal “Generated Files” viewer** with tabs showing the content of generated files and “Download Active File” button.
   - **Clone row** and **Delete row** buttons in all tables.
   - **Copy all payloads** to clipboard.
   - **Download All (ZIP)** button (client-side store-only ZIP, no libs).
   - **Local Save/Load** (localStorage) + **Import/Export JSON** (file upload & download).

3) **Data model**
   - Define a JS `model` object and initialize defaults in `model.js`:
     - `currentStep`
     - App-specific entities: {{DATA_MODEL_ENTITIES}} (e.g., vendor/site/tenant/auth/rules/policies/segments)
   - Real-time syncing to `model` as users type/select.

4) **Validations**
   - Inline callouts (non-blocking, auto-dismiss in ~3s).
   - Include these checks: {{VALIDATION_LIST}}
     - Examples: required fields, email format, IP/CIDR format, duplicates, consistency (uplink vs downlink), minimum thresholds.

5) **Generators**
   - In `js/generators.js`, build **{{LIST_OF_GENERATED_FILES}}** from the `model`.
   - Include **cURL scaffolds** (and optionally **Ansible `uri` tasks**) with placeholders for tokens/IDs/URLs.
   - Keep endpoints and auth in comments; DO NOT make network calls.

6) **Charts**
   - In `js/chart.js`, draw a Canvas chart summarizing counts/metrics (e.g., rules per type, capacity, etc.).

7) **Non-functional constraints**
   - **No external libraries** or CDNs (pure vanilla).
   - Responsive layout for tablet/mobile.
   - Clean modular structure, no inline `<script>` except `<script type="module">` to load `js/main.js`.

### Target Entities & Tables
Build tabular editors for:
- {{TABLE_1_NAME}} columns: {{TABLE_1_COLUMNS}}
- {{TABLE_2_NAME}} columns: {{TABLE_2_COLUMNS}}
- {{TABLE_3_NAME}} columns: {{TABLE_3_COLUMNS}}
(Each row has **Clone** and **Delete**; changes update `model`.)

### Example Generators (customize to your app)
- `{{FILE_1}}` — JSON payload of {{DESCRIPTION_1}}
- `{{FILE_2}}` — cURL scaffold posting items to `{{ENDPOINT_2}}` with headers (`Authorization`/`Cookie`) placeholders
- `{{FILE_3}}` — optional YAML/INI/Ansible playbook

### Acceptance criteria
- After I send this prompt, you:
  1. **Use Python** to create all files in the current working directory.
  2. Return **download links** to each file and a **single ZIP** with the whole project.
  3. Opening `index.html` should render the wizard with:
     - Step pills + Previous/Next pager
     - Floating summary sidebar
     - Dark/Light theme toggle
     - Tables with Clone/Delete
     - Modal tabs showing generated content
     - Buttons: Generate, View Files, Copy all, Download All (ZIP), Save/Load/Import/Export
  4. Chart renders with sensible defaults.
  5. No external network calls; just file generation.
  6. Code is readable, commented, and modular.

### Content placeholders to fill for this specific app
- {{APP_NAME}} = e.g., “Acme Policy Generator”
- {{PRIMARY_PURPOSE}} = e.g., “build and export policy rules for XYZ platform”
- {{OUTPUT_ARTIFACTS}} = e.g., “JSON policies + cURL scripts + optional Ansible tasks”
- {{STEPS_LIST}} = e.g., “1 Platform → 2 Tenant/Auth → 3 Types → 4 Build → 5 Review/Generate”
- {{DATA_MODEL_ENTITIES}} = e.g., `product`, `tenant`, `types`, `rules`
- {{VALIDATION_LIST}} = e.g., required fields, IP/CIDR, duplicates, ranges
- {{TABLE_*}} = define the tables and columns
- {{LIST_OF_GENERATED_FILES}} = e.g., `main.json`, `policy.json`, `policy-curl.sh`, `inventory.ini`
- {{APP_SLUG}} = short lowercase slug (used for ZIP/bundle name)

### Output format
Please produce:
- A short status line (what you created).
- Direct download links to: `index.html`, `styles.css`, all `js/*.js`, and the ZIP.
- No additional confirmations needed—proceed to file creation and return links.
