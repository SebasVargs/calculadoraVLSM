function detectMask() {
    const ip = document.getElementById('ipv4Input').value.trim();
    const maskInput = document.getElementById('maskInput');

    if (!isValidIPv4(ip)) {
        maskInput.value = '';
        return;
    }

    const firstOctet = parseInt(ip.split('.')[0]);
    let defaultMask = '';

    if (firstOctet >= 1 && firstOctet <= 126) {
        defaultMask = '255.0.0.0 (/8)'; // Clase A
    } else if (firstOctet >= 128 && firstOctet <= 191) {
        defaultMask = '255.255.0.0 (/16)'; // Clase B
    } else if (firstOctet >= 192 && firstOctet <= 223) {
        defaultMask = '255.255.255.0 (/24)'; // Clase C
    }

    maskInput.value = defaultMask;
}

// Función para crear inputs dinámicos de hosts
function createHostInputs() {
    const numSubnets = parseInt(document.getElementById('vlsmSubnets').value);
    const container = document.getElementById('hostsContainer');

    if (!numSubnets || numSubnets < 1) {
        container.innerHTML = '';
        return;
    }

    if (numSubnets > 64) {
        container.innerHTML = '<div class="error">Máximo 64 subredes permitidas.</div>';
        return;
    }

    let html = `
                <div class="hosts-container">
                    <h3>Especificar número de hosts por subred:</h3>
                    <div class="hosts-grid">
            `;

    for (let i = 1; i <= numSubnets; i++) {
        html += `
                    <div class="host-input">
                        <label for="hosts${i}">Subred ${i}:</label>
                        <input type="number" id="hosts${i}" placeholder="Número de hosts" min="1" max="65534">
                    </div>
                `;
    }

    html += `
                    </div>
                </div>
            `;

    container.innerHTML = html;
}

// Función para convertir IP a binario
function ipToBinary(ip) {
    return ip.split('.').map(octet =>
        parseInt(octet).toString(2).padStart(8, '0')
    ).join('.');
}

// Función para validar IPv4
function isValidIPv4(ip) {
    const regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return regex.test(ip);
}

// Función para determinar la clase de IP
function getIPClass(firstOctet) {
    if (firstOctet >= 1 && firstOctet <= 126) return 'A';
    if (firstOctet >= 128 && firstOctet <= 191) return 'B';
    if (firstOctet >= 192 && firstOctet <= 223) return 'C';
    if (firstOctet >= 224 && firstOctet <= 239) return 'D';
    if (firstOctet >= 240 && firstOctet <= 255) return 'E';
    return 'Desconocida';
}

// Función para verificar si es IP privada
function isPrivateIP(ip) {
    const octets = ip.split('.').map(Number);
    const [a, b] = octets;

    return (a === 10) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168);
}

// Calcular información IPv4
function calculateIPv4() {
    const ip = document.getElementById('ipv4Input').value.trim();
    const resultsDiv = document.getElementById('ipv4Results');

    if (!ip) {
        resultsDiv.innerHTML = '<div class="error">Por favor, ingrese una dirección IPv4.</div>';
        return;
    }

    if (!isValidIPv4(ip)) {
        resultsDiv.innerHTML = '<div class="error">Dirección IPv4 inválida.</div>';
        return;
    }

    // Detectar prefijo por clase
    const firstOctet = parseInt(ip.split('.')[0]);
    let prefix = 24; // Por defecto Clase C

    if (firstOctet >= 1 && firstOctet <= 126) {
        prefix = 8; // Clase A
    } else if (firstOctet >= 128 && firstOctet <= 191) {
        prefix = 16; // Clase B
    }

    // Cálculos
    const octets = ip.split('.').map(Number);
    const ipClass = getIPClass(firstOctet);
    const isPrivate = isPrivateIP(ip);

    // Máscara de subred
    const mask = Array(4).fill(0);
    let remainingBits = prefix;
    for (let i = 0; i < 4; i++) {
        if (remainingBits >= 8) {
            mask[i] = 255;
            remainingBits -= 8;
        } else if (remainingBits > 0) {
            mask[i] = (255 << (8 - remainingBits)) & 255;
            remainingBits = 0;
        }
    }

    const subnetMask = mask.join('.');
    const wildcardMask = mask.map(octet => 255 - octet).join('.');

    // Dirección de red
    const networkAddress = octets.map((octet, i) => octet & mask[i]).join('.');

    // Primera y última dirección de host
    const hostBits = 32 - prefix;
    const numHosts = Math.pow(2, hostBits) - 2;
    const broadcastOctets = networkAddress.split('.').map(Number);
    const networkOctets = networkAddress.split('.').map(Number);

    // Broadcast
    let carry = Math.pow(2, hostBits) - 1;
    for (let i = 3; i >= 0; i--) {
        broadcastOctets[i] += carry & 255;
        carry = Math.floor(carry / 256);
    }
    const broadcastAddress = broadcastOctets.join('.');

    // Primera dirección de host
    const firstHostOctets = networkOctets.slice();
    firstHostOctets[3] += 1;
    const firstHost = firstHostOctets.join('.');

    // Última dirección de host
    const lastHostOctets = broadcastOctets.slice();
    lastHostOctets[3] -= 1;
    const lastHost = lastHostOctets.join('.');

    // Crear tabla de resultados
    const resultsTable = `
                <div class="results-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Elemento</th>
                                <th>Valor Decimal</th>
                                <th>Valor Binario</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Dirección IPv4</strong></td>
                                <td>${ip}</td>
                                <td class="binary">${ipToBinary(ip)}</td>
                            </tr>
                            <tr>
                                <td><strong>Máscara de red</strong></td>
                                <td>${subnetMask}</td>
                                <td class="binary">${ipToBinary(subnetMask)}</td>
                            </tr>
                            <tr>
                                <td><strong>Máscara Wildcard</strong></td>
                                <td>${wildcardMask}</td>
                                <td class="binary">${ipToBinary(wildcardMask)}</td>
                            </tr>
                            <tr>
                                <td><strong>Dirección de red</strong></td>
                                <td>${networkAddress}</td>
                                <td class="binary">${ipToBinary(networkAddress)}</td>
                            </tr>
                            <tr>
                                <td><strong>Dirección de host</strong></td>
                                <td>0.0.0.0</td>
                                <td class="binary">00000000.00000000.00000000.00000000</td>
                            </tr>
                            <tr>
                                <td><strong>Dirección del primer host</strong></td>
                                <td>${firstHost}</td>
                                <td class="binary">${ipToBinary(firstHost)}</td>
                            </tr>
                            <tr>
                                <td><strong>Dirección del último host</strong></td>
                                <td>${lastHost}</td>
                                <td class="binary">${ipToBinary(lastHost)}</td>
                            </tr>
                            <tr>
                                <td><strong>Dirección de difusión</strong></td>
                                <td>${broadcastAddress}</td>
                                <td class="binary">${ipToBinary(broadcastAddress)}</td>
                            </tr>
                            <tr>
                                <td><strong>Direcciones asignables</strong></td>
                                <td colspan="2">${numHosts.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td><strong>Tipo de dirección IPv4</strong></td>
                                <td colspan="2">${isPrivate ? '<span class="ip-private">IP Privada</span>' : 'IP Pública'}, Clase ${ipClass}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

    resultsDiv.innerHTML = resultsTable;
}

// Calcular VLSM optimizado
function calculateVLSM() {
    const ip = document.getElementById('vlsmIP').value.trim();
    const prefix = parseInt(document.getElementById('vlsmPrefix').value);
    const numSubnets = parseInt(document.getElementById('vlsmSubnets').value);
    const resultsDiv = document.getElementById('vlsmResults');

    if (!ip || !prefix || !numSubnets) {
        resultsDiv.innerHTML = '<div class="error">Por favor, complete todos los campos obligatorios.</div>';
        return;
    }

    if (!isValidIPv4(ip)) {
        resultsDiv.innerHTML = '<div class="error">Dirección IPv4 inválida.</div>';
        return;
    }

    if (prefix < 1 || prefix > 30) {
        resultsDiv.innerHTML = '<div class="error">El prefijo debe estar entre 1 y 30.</div>';
        return;
    }

    // Recopilar hosts requeridos para cada subred
    const hostRequirements = [];
    let allHostsSpecified = true;

    for (let i = 1; i <= numSubnets; i++) {
        const hostsInput = document.getElementById(`hosts${i}`);
        const hosts = hostsInput ? parseInt(hostsInput.value) : null;

        if (!hosts || hosts < 1) {
            allHostsSpecified = false;
            break;
        }

        hostRequirements.push({
            subnet: i,
            hosts: hosts,
            bitsNeeded: Math.ceil(Math.log2(hosts + 2)) // +2 para red y broadcast
        });
    }

    if (!allHostsSpecified) {
        resultsDiv.innerHTML = '<div class="error">Por favor, especifique el número de hosts para todas las subredes.</div>';
        return;
    }

    // Ordenar por mayor número de hosts (algoritmo VLSM)
    hostRequirements.sort((a, b) => b.hosts - a.hosts);

    // Verificar si hay suficiente espacio
    const availableHostBits = 32 - prefix;
    const totalBitsNeeded = hostRequirements.reduce((sum, req) => sum + Math.pow(2, req.bitsNeeded), 0);
    const availableAddresses = Math.pow(2, availableHostBits);

    if (totalBitsNeeded > availableAddresses) {
        resultsDiv.innerHTML = '<div class="error">No hay suficiente espacio de direcciones para todas las subredes especificadas.</div>';
        return;
    }

    // Calcular subredes
    const octets = ip.split('.').map(Number);
    let currentIP = (octets[0] << 24) + (octets[1] << 16) + (octets[2] << 8) + octets[3];

    const info = `
                <div class="info-box">
                    <h3>Información de la Red Base</h3>
                    <div class="info-row">
                        <span class="info-label">Dirección IP:</span>
                        <span class="info-value">${ip}/${prefix}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Número de subredes:</span>
                        <span class="info-value">${numSubnets}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Estado:</span>
                        <span class="info-value correct">Calculado correctamente</span>
                    </div>
                </div>
            `;

    let subnetsTable = `
                <div class="results-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Subred</th>
                                <th>Hosts Req.</th>
                                <th>Dirección de Red</th>
                                <th>Máscara</th>
                                <th>Primera Host</th>
                                <th>Última Host</th>
                                <th>Broadcast</th>
                                <th>Hosts Disponibles</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

    for (const req of hostRequirements) {
        const subnetBits = req.bitsNeeded;
        const newPrefix = 32 - subnetBits;
        const subnetSize = Math.pow(2, subnetBits);
        const availableHosts = subnetSize - 2;

        // Dirección de red de la subred
        const networkAddr = currentIP;
        const networkIP = [
            (networkAddr >>> 24) & 255,
            (networkAddr >>> 16) & 255,
            (networkAddr >>> 8) & 255,
            networkAddr & 255
        ].join('.');

        // Broadcast de la subred
        const broadcastAddr = networkAddr + subnetSize - 1;
        const broadcastIP = [
            (broadcastAddr >>> 24) & 255,
            (broadcastAddr >>> 16) & 255,
            (broadcastAddr >>> 8) & 255,
            broadcastAddr & 255
        ].join('.');

        // Primera y última host
        const firstHostAddr = networkAddr + 1;
        const firstHostIP = [
            (firstHostAddr >>> 24) & 255,
            (firstHostAddr >>> 16) & 255,
            (firstHostAddr >>> 8) & 255,
            firstHostAddr & 255
        ].join('.');

        const lastHostAddr = broadcastAddr - 1;
        const lastHostIP = [
            (lastHostAddr >>> 24) & 255,
            (lastHostAddr >>> 16) & 255,
            (lastHostAddr >>> 8) & 255,
            lastHostAddr & 255
        ].join('.');

        // Máscara de subred
        const mask = Array(4).fill(0);
        let remainingBits = newPrefix;
        for (let j = 0; j < 4; j++) {
            if (remainingBits >= 8) {
                mask[j] = 255;
                remainingBits -= 8;
            } else if (remainingBits > 0) {
                mask[j] = (255 << (8 - remainingBits)) & 255;
                remainingBits = 0;
            }
        }
        const subnetMask = mask.join('.');

        subnetsTable += `
                    <tr>
                        <td><strong>Subred ${req.subnet}</strong></td>
                        <td>${req.hosts.toLocaleString()}</td>
                        <td>${networkIP}/${newPrefix}</td>
                        <td>${subnetMask}</td>
                        <td>${firstHostIP}</td>
                        <td>${lastHostIP}</td>
                        <td>${broadcastIP}</td>
                        <td>${availableHosts.toLocaleString()}</td>
                    </tr>
                `;

        currentIP += subnetSize;
    }

    subnetsTable += `
                        </tbody>
                    </table>
                </div>
            `;

    resultsDiv.innerHTML = info + subnetsTable;
}

// Permitir calcular con Enter
document.getElementById('ipv4Input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') calculateIPv4();
});
