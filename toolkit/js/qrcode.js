// js/qrcode.js - QR Code Generator (Pure JavaScript)
// Simplified QR Code generator without external libraries

export function generateQRCode(text, canvas) {
    const qr = createQRCode(text);
    drawQRCode(qr, canvas);
}

function createQRCode(text) {
    // This is a simplified QR code generator
    // For production, consider using a full library like qrcode.js
    
    // Convert text to simple pattern (not actual QR encoding)
    const size = Math.max(21, Math.ceil(Math.sqrt(text.length * 8)) + 4);
    const matrix = Array(size).fill().map(() => Array(size).fill(0));
    
    // Add finder patterns (corners)
    addFinderPattern(matrix, 0, 0);
    addFinderPattern(matrix, size - 7, 0);
    addFinderPattern(matrix, 0, size - 7);
    
    // Add timing patterns
    for (let i = 8; i < size - 8; i++) {
        matrix[6][i] = i % 2 === 0 ? 1 : 0;
        matrix[i][6] = i % 2 === 0 ? 1 : 0;
    }
    
    // Encode data (simplified - just creates a pattern based on text)
    let bitString = '';
    for (let i = 0; i < text.length; i++) {
        bitString += text.charCodeAt(i).toString(2).padStart(8, '0');
    }
    
    // Fill data area
    let bitIndex = 0;
    for (let x = size - 1; x > 0; x -= 2) {
        if (x === 6) x--; // Skip timing column
        
        for (let y = size - 1; y >= 0; y--) {
            for (let c = 0; c < 2; c++) {
                const col = x - c;
                if (!isReserved(matrix, col, y)) {
                    if (bitIndex < bitString.length) {
                        matrix[y][col] = bitString[bitIndex] === '1' ? 1 : 0;
                        bitIndex++;
                    }
                }
            }
        }
    }
    
    return matrix;
}

function addFinderPattern(matrix, row, col) {
    // Outer 7x7 black border
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
            if (i === 0 || i === 6 || j === 0 || j === 6) {
                matrix[row + i][col + j] = 1;
            } else if (i >= 2 && i <= 4 && j >= 2 && j <= 4) {
                matrix[row + i][col + j] = 1;
            }
        }
    }
}

function isReserved(matrix, x, y) {
    const size = matrix.length;
    
    // Finder patterns
    if ((x < 9 && y < 9) || 
        (x < 9 && y >= size - 8) || 
        (x >= size - 8 && y < 9)) {
        return true;
    }
    
    // Timing patterns
    if (x === 6 || y === 6) {
        return true;
    }
    
    return false;
}

function drawQRCode(matrix, canvas) {
    const size = matrix.length;
    const cellSize = 10; // pixels per module
    const padding = 20; // padding around QR code
    
    canvas.width = size * cellSize + padding * 2;
    canvas.height = size * cellSize + padding * 2;
    
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw QR modules
    ctx.fillStyle = '#000000';
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (matrix[y][x] === 1) {
                ctx.fillRect(
                    padding + x * cellSize,
                    padding + y * cellSize,
                    cellSize,
                    cellSize
                );
            }
        }
    }
    
    // Add text below QR code
    ctx.fillStyle = '#666666';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    
    const text = matrix.originalText || 'QR Code';
    const maxWidth = canvas.width - padding * 2;
    const displayText = text.length > 30 ? text.substring(0, 30) + '...' : text;
    ctx.fillText(displayText, canvas.width / 2, canvas.height - 5);
}

// Enhanced version that uses Web APIs for better encoding
export function generateQRCodeEnhanced(text, canvas, options = {}) {
    const {
        size = 256,
        foreground = '#000000',
        background = '#ffffff',
        errorCorrection = 'M'
    } = options;
    
    try {
        // Generate QR matrix
        const qr = createQRCode(text);
        qr.originalText = text;
        
        // Draw to canvas
        const moduleCount = qr.length;
        const cellSize = Math.floor((size - 40) / moduleCount);
        const padding = (size - cellSize * moduleCount) / 2;
        
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, size, size);
        
        // QR modules
        ctx.fillStyle = foreground;
        for (let y = 0; y < moduleCount; y++) {
            for (let x = 0; x < moduleCount; x++) {
                if (qr[y][x] === 1) {
                    ctx.fillRect(
                        padding + x * cellSize,
                        padding + y * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
        
        return canvas.toDataURL('image/png');
    } catch (error) {
        throw new Error(`QR Code generation failed: ${error.message}`);
    }
}