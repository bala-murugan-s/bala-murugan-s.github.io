// Advanced Tools UI Update
function updateAdvancedToolUI() {
    const toolType = document.getElementById('advancedToolType').value;
    const container = document.getElementById('advancedToolContainer');
    
    if (toolType === 'compare') {
        container.innerHTML = `
            <div class="output-section">
                <h3>📊 Certificate Comparison Tool</h3>
                <p>Upload two certificates to compare</p>
                <div class="grid-2">
                    <div class="file-drop" onclick="document.getElementById('compareCert1').click()">
                        📁 Certificate 1
                        <input type="file" id="compareCert1" style="display: none;">
                    </div>
                    <div class="file-drop" onclick="document.getElementById('compareCert2').click()">
                        📁 Certificate 2
                        <input type="file" id="compareCert2" style="display: none;">
                    </div>
                </div>
                <button class="btn btn-success" onclick="compareCertificates()">🔍 Compare</button>
                <div id="compareOutput"></div>
            </div>
        `;
    } else if (toolType === 'bulk-audit') {
        container.innerHTML = `
            <div class="output-section">
                <h3>📋 Bulk Certificate Audit</h3>
                <div class="file-drop" onclick="document.getElementById('bulkAuditFiles').click()">
                    📁 Upload multiple certificates
                    <input type="file" id="bulkAuditFiles" style="display: none;" multiple>
                </div>
                <button class="btn btn-success" onclick="performBulkAudit()">📊 Generate Audit</button>
                <div id="bulkAuditOutput"></div>
            </div>
        `;
    } else if (toolType === 'chain-builder') {
        container.innerHTML = `
            <div class="output-section">
                <h3>🔗 Certificate Chain Builder</h3>
                <div class="file-drop" onclick="document.getElementById('chainFiles').click()">
                    📁 Upload certificates (Root, Intermediate, End-entity)
                    <input type="file" id="chainFiles" style="display: none;" multiple>
                </div>
                <button class="btn btn-success" onclick="buildCertificateChain()">🔨 Build Chain</button>
                <div id="chainOutput"></div>
            </div>
        `;
    } else if (toolType === 'hash-calc') {
        container.innerHTML = `
            <div class="output-section">
                <h3>🔐 Hash Calculator & Fingerprint</h3>
                <div class="file-drop" onclick="document.getElementById('hashFile').click()">
                    📁 Upload certificate
                    <input type="file" id="hashFile" style="display: none;">
                </div>
                <button class="btn btn-success" onclick="calculateHashes()">🔢 Calculate Hashes</button>
                <div id="hashOutput"></div>
            </div>
        `;
    } else if (toolType === 'cmd-builder') {
        container.innerHTML = `
            <div class="output-section">
                <h3>⚙️ OpenSSL Command Builder</h3>
                <div class="form-group">
                    <label>Command Type</label>
                    <select id="cmdType" onchange="updateCommandBuilder()">
                        <option value="genrsa">Generate RSA Key</option>
                        <option value="ecparam">Generate ECDSA Key</option>
                        <option value="req-new">Create CSR</option>
                        <option value="req-x509">Self-Signed Certificate</option>
                        <option value="x509-text">View Certificate</option>
                    </select>
                </div>
                <div id="cmdParameters"></div>
                <button class="btn btn-success" onclick="buildCommand()">🔨 Build Command</button>
                <div id="cmdOutput"></div>
            </div>
        `;
        updateCommandBuilder();
    } else if (toolType === 'bundle-creator') {
        container.innerHTML = `
            <div class="output-section">
                <h3>📦 Certificate Bundle Creator</h3>
                <div class="file-drop" onclick="document.getElementById('bundleFiles').click()">
                    📁 Upload certificates to bundle
                    <input type="file" id="bundleFiles" style="display: none;" multiple>
                </div>
                <button class="btn btn-success" onclick="createBundle()">📦 Create Bundle</button>
                <div id="bundleOutput"></div>
            </div>
        `;
    } else if (toolType === 'visualize') {
        container.innerHTML = `
            <div class="output-section">
                <h3>🎨 Certificate Visualization</h3>
                <div class="file-drop" onclick="document.getElementById('visualizeFiles').click()">
                    📁 Upload certificates to visualize
                    <input type="file" id="visualizeFiles" style="display: none;" multiple>
                </div>
                <div class="form-group">
                    <label>Visualization Type</label>
                    <select id="vizType">
                        <option value="timeline">Validity Timeline</option>
                        <option value="properties">Property Breakdown</option>
                    </select>
                </div>
                <button class="btn btn-success" onclick="visualizeCertificates()">🎨 Visualize</button>
                <div id="visualizeOutput"></div>
            </div>
        `;
    }
}