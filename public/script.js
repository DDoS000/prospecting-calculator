// Global data storage
let equipmentData = [];
let oresData = [];
let zonesData = [];
let selectedEquipmentList = [];

// Equipment Simulator data
let simulatorEquipment = {
    neck: null,
    charm: null,
    rings: []
};

// Equipment stats will be populated from data.json
let equipmentStats = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllData();
    setupEventListeners();
    displayEquipment();
});

// Load all data from static files
async function loadAllData() {
    try {
        const dataRes = await fetch('./data.json');
        const allData = await dataRes.json();

        equipmentData = allData;
        oresData = allData.minerals || [];
        zonesData = { locations: allData.locations || [] };

        // Process equipment data for simulator
        processEquipmentStats();

        // Debug logs
        console.log('Loaded equipmentData:', equipmentData);
        console.log('equipmentData.minerals length:', equipmentData.minerals ? equipmentData.minerals.length : 'undefined');
        console.log('oresData length:', oresData ? oresData.length : 'undefined');

        // Check Fire Opal specifically
        if (equipmentData.minerals) {
            const fireOpal = equipmentData.minerals.find(m => m.name === 'Fire Opal');
            console.log('Fire Opal in equipmentData.minerals:', fireOpal);
        }

        const fireOpalInOres = oresData.find(m => m.name === 'Fire Opal');
        console.log('Fire Opal in oresData:', fireOpalInOres);

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });

    // Search and filter functionality
    document.getElementById('equipment-search').addEventListener('input', filterEquipment);
    document.getElementById('ore-search').addEventListener('input', filterOres);
    document.getElementById('rarity-filter').addEventListener('change', filterOres);

    // Calculator functionality
    document.getElementById('calculate-btn').addEventListener('click', calculateMaterials);
    document.getElementById('add-equipment-btn').addEventListener('click', addEquipment);
    document.getElementById('clear-all-btn').addEventListener('click', clearAllEquipment);

    // Equipment Simulator functionality
    document.getElementById('add-ring-btn').addEventListener('click', addRingSlot);
    setupSimulatorEventListeners();

    // Populate equipment selector
    populateEquipmentSelector();
    populateSimulatorSelectors();
}

// Tab switching
function switchTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Load appropriate data
    switch (tabName) {
        case 'equipment':
            displayEquipment();
            break;
        case 'ores':
            displayOres();
            break;
        case 'zones':
            displayZones();
            break;
        case 'calculator':
            // Calculator tab doesn't need special loading
            break;
        case 'simulator':
            // Initialize simulator if not already done
            if (document.getElementById('rings-container').children.length === 0) {
                initializeSimulator();
            }
            break;
    }
}

// Get materials locations from minerals data
function getMaterialsLocations(materialsString) {
    const materials = parseMaterials(materialsString);
    const allLocations = new Set();

    materials.forEach(material => {
        const oreInfo = findOreInfo(material.name);
        if (oreInfo && oreInfo.locations) {
            oreInfo.locations.forEach(location => {
                allLocations.add(location);
            });
        }
    });

    return Array.from(allLocations);
}

// Display equipment
function displayEquipment(filteredData = null) {
    const container = document.getElementById('equipment-list');
    const data = filteredData || equipmentData.crafting || [];

    container.innerHTML = data.map(item => {
        const materialsLocations = getMaterialsLocations(item.materials);

        return `
            <div class="card">
                <h3>${item.item}</h3>
                <div class="card-info">
                    <span class="equipment-type">${item.type}</span>
                    ${item.rarity ? `<span class="rarity-badge rarity-${item.rarity.toLowerCase()}">${item.rarity}</span>` : ''}
                    <span class="cost">💰 ${item.cost}</span>
                </div>
                <div class="card-info">
                    <strong>วัสดุ:</strong> ${item.materials}
                </div>
                <div class="card-info">
                    <strong>Buffs:</strong> ${item.buffs}
                </div>
                <div class="card-info">
                    <strong>ตำแหน่งที่แนะนำ:</strong>
                </div>
                <div class="locations-list">
                    ${materialsLocations.length > 0 ?
                materialsLocations.map(location =>
                    `<span class="location-tag">${location}</span>`
                ).join('') :
                '<span class="location-tag">ไม่พบข้อมูล</span>'
            }
                </div>
            </div>
        `;
    }).join('');
}

// Display ores
function displayOres(filteredData = null) {
    const container = document.getElementById('ores-list');
    const data = filteredData || oresData || [];

    container.innerHTML = data.map(ore => `
        <div class="card">
            <div class="ore-header">
                <h3>${ore.name}</h3>
                ${ore.url ? `<a href="${ore.url}" target="_blank" class="wiki-link" title="View on Wiki">📖</a>` : ''}
            </div>
            <div class="card-info">
                <span class="rarity-badge rarity-${ore.rarity.toLowerCase()}">${ore.rarity}</span>
                ${ore.value ? `<span class="ore-value">💰 ${ore.value}</span>` : ''}
            </div>
            ${ore.description ? `
                <div class="card-info">
                    <strong>รายละเอียด:</strong> ${ore.description}
                </div>
            ` : ''}
            <div class="card-info">
                <strong>ตำแหน่ง:</strong>
            </div>
            <div class="locations-list">
                ${ore.locations.map(location =>
        `<span class="location-tag">${location}</span>`
    ).join('')}
            </div>
            ${ore.dropChances ? `
                <div class="card-info">
                    <strong>อัตราการหา:</strong>
                </div>
                <div class="drop-chances">
                    ${Object.entries(ore.dropChances).map(([location, chance]) =>
        `<div class="drop-chance-item">
                            <span class="drop-location">${location}:</span>
                            <span class="drop-rate">${chance}</span>
                        </div>`
    ).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Display zones
function displayZones() {
    const container = document.getElementById('zones-list');
    const data = zonesData.locations || [];

    container.innerHTML = data.map(zone => `
        <div class="card">
            <h3>${zone.name}</h3>
            <div class="card-info">
                <strong>ความยาก:</strong>
                <div class="toughness-indicator">
                    ${Array(zone.shovelToughness).fill('⭐').join('')}
                    ${Array(5 - zone.shovelToughness).fill('☆').join('')}
                </div>
            </div>
            <div class="card-info">
                <strong>รายละเอียด:</strong> ${zone.description}
            </div>
        </div>
    `).join('');
}

// Filter equipment
function filterEquipment() {
    const searchTerm = document.getElementById('equipment-search').value.toLowerCase();
    const filtered = equipmentData.crafting.filter(item =>
        item.item.toLowerCase().includes(searchTerm) ||
        item.type.toLowerCase().includes(searchTerm) ||
        item.materials.toLowerCase().includes(searchTerm) ||
        item.buffs.toLowerCase().includes(searchTerm)
    );
    displayEquipment(filtered);
}

// Filter ores
function filterOres() {
    const searchTerm = document.getElementById('ore-search').value.toLowerCase();
    const rarityFilter = document.getElementById('rarity-filter').value;

    let filtered = oresData.filter(ore => {
        const matchesSearch = ore.name.toLowerCase().includes(searchTerm) ||
            ore.locations.some(loc => loc.toLowerCase().includes(searchTerm));
        const matchesRarity = !rarityFilter || ore.rarity === rarityFilter;

        return matchesSearch && matchesRarity;
    });

    displayOres(filtered);
}
// Populate equipment selector dropdown
function populateEquipmentSelector() {
    const selector = document.getElementById('equipment-select');
    const equipment = equipmentData.crafting || [];

    // Clear existing options except the first one
    selector.innerHTML = '<option value="">-- เลือก Equipment --</option>';

    // Sort equipment by cost (price) from low to high
    const sortedEquipment = [...equipment].sort((a, b) => {
        const costA = parseInt(a.cost.replace(/,/g, ''));
        const costB = parseInt(b.cost.replace(/,/g, ''));
        return costA - costB;
    });

    sortedEquipment.forEach((item, index) => {
        const option = document.createElement('option');
        // Use original index to maintain compatibility
        const originalIndex = equipment.findIndex(eq => eq.item === item.item);
        option.value = item.id || originalIndex;
        const rarity = item.rarity ? ` [${item.rarity}]` : '';
        option.textContent = `${item.item} (${item.type})${rarity} - ${item.cost} เหรียญ`;
        selector.appendChild(option);
    });
}

// Parse materials string to extract individual materials and quantities
function parseMaterials(materialsString) {
    const materials = [];
    const parts = materialsString.split(',');

    parts.forEach(part => {
        const trimmed = part.trim();
        const match = trimmed.match(/(\d+)\s+(.+?)(?:\s*\(([^)]+)\))?$/);

        if (match) {
            const quantity = parseInt(match[1]);
            const name = match[2].trim();
            const requirement = match[3] || null;

            materials.push({
                name: name,
                quantity: quantity,
                requirement: requirement
            });
        }
    });

    return materials;
}

// Find ore information by name
function findOreInfo(oreName) {
    console.log(`Searching for: "${oreName}"`);

    // First try to find in equipmentData.minerals (from all.json)
    if (equipmentData.minerals && equipmentData.minerals.length > 0) {
        console.log(`Searching in equipmentData.minerals (${equipmentData.minerals.length} items)`);

        // Try exact match first
        let mineral = equipmentData.minerals.find(ore => {
            const match = ore.name.toLowerCase() === oreName.toLowerCase();
            if (match) console.log(`Exact match found: ${ore.name}`);
            return match;
        });

        // If no exact match, try partial match
        if (!mineral) {
            console.log(`No exact match, trying partial match...`);
            mineral = equipmentData.minerals.find(ore => {
                const match = ore.name.toLowerCase().includes(oreName.toLowerCase()) ||
                    oreName.toLowerCase().includes(ore.name.toLowerCase());
                if (match) console.log(`Partial match found: ${ore.name} for search "${oreName}"`);
                return match;
            });
        }

        if (mineral) {
            console.log(`Found ${oreName} in equipmentData.minerals:`, mineral);
            return mineral;
        }
    }

    console.log(`Not found in equipmentData.minerals, trying oresData...`);

    // Fallback to oresData
    let fallback = oresData.find(ore =>
        ore.name.toLowerCase() === oreName.toLowerCase()
    );

    if (!fallback) {
        fallback = oresData.find(ore =>
            ore.name.toLowerCase().includes(oreName.toLowerCase()) ||
            oreName.toLowerCase().includes(ore.name.toLowerCase())
        );
    }

    if (fallback) {
        console.log(`Found ${oreName} in oresData (fallback):`, fallback);
    } else {
        console.log(`Could not find ${oreName} in any data source`);
    }

    return fallback;
}

// Get zone information by name
function getZoneInfo(zoneName) {
    return zonesData.locations.find(zone =>
        zone.name.toLowerCase() === zoneName.toLowerCase() ||
        zone.name.toLowerCase().includes(zoneName.toLowerCase())
    );
}

// Add equipment to selected list
function addEquipment() {
    const selectedEquipmentId = document.getElementById('equipment-select').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 1;

    if (!selectedEquipmentId) {
        alert('กรุณาเลือก Equipment ก่อน');
        return;
    }

    // Find equipment by ID or index
    const equipment = equipmentData.crafting.find((item, index) =>
        (item.id && item.id === selectedEquipmentId) || index.toString() === selectedEquipmentId
    );

    if (!equipment) {
        alert('ไม่พบข้อมูล Equipment');
        return;
    }

    // Check if equipment already exists in list
    const existingIndex = selectedEquipmentList.findIndex(item =>
        item.equipment.item === equipment.item
    );

    if (existingIndex >= 0) {
        // Update quantity if exists
        selectedEquipmentList[existingIndex].quantity += quantity;
    } else {
        // Add new equipment
        selectedEquipmentList.push({
            equipment: equipment,
            quantity: quantity
        });
    }

    // Reset form
    document.getElementById('equipment-select').value = '';
    document.getElementById('quantity').value = 1;

    // Update display
    displaySelectedEquipment();
}

// Remove equipment from selected list
function removeEquipment(index) {
    selectedEquipmentList.splice(index, 1);
    displaySelectedEquipment();
}

// Clear all selected equipment
function clearAllEquipment() {
    selectedEquipmentList = [];
    displaySelectedEquipment();
    document.getElementById('calculation-result').style.display = 'none';
}

// Display selected equipment list
function displaySelectedEquipment() {
    const container = document.getElementById('equipment-items');

    if (selectedEquipmentList.length === 0) {
        container.innerHTML = '<p style="color: #718096; font-style: italic;">ยังไม่ได้เลือก Equipment</p>';
        return;
    }

    container.innerHTML = selectedEquipmentList.map((item, index) => `
        <div class="equipment-item">
            <div class="equipment-item-info">
                <div class="equipment-item-name">${item.equipment.item}</div>
                <div class="equipment-item-details">
                    ${item.equipment.type} | ${item.equipment.rarity || 'Unknown'} | ${item.equipment.cost} เหรียญ
                </div>
            </div>
            <span class="equipment-item-quantity">x${item.quantity}</span>
            <button class="remove-equipment-btn" onclick="removeEquipment(${index})">ลบ</button>
        </div>
    `).join('');
}

// Parse value string to number
function parseValue(valueString) {
    if (!valueString) return 0;
    // Remove $ and commas, then convert to number
    return parseInt(valueString.replace(/[$,]/g, '')) || 0;
}

// Calculate materials needed for all selected equipment
function calculateMaterials() {
    if (selectedEquipmentList.length === 0) {
        alert('กรุณาเพิ่ม Equipment ก่อน');
        return;
    }

    // Combine all materials from selected equipment
    const allMaterials = {};
    let totalCraftingCost = 0;
    let totalMaterialValue = 0;

    selectedEquipmentList.forEach(item => {
        const materials = parseMaterials(item.equipment.materials);
        const costPerItem = parseInt(item.equipment.cost.replace(/,/g, ''));
        totalCraftingCost += costPerItem * item.quantity;

        materials.forEach(material => {
            const key = `${material.name}${material.requirement ? `_${material.requirement}` : ''}`;
            if (!allMaterials[key]) {
                allMaterials[key] = {
                    name: material.name,
                    requirement: material.requirement,
                    totalQuantity: 0,
                    unitValue: 0,
                    totalValue: 0
                };
            }
            allMaterials[key].totalQuantity += material.quantity * item.quantity;

            // Get mineral value
            const oreInfo = findOreInfo(material.name);
            if (oreInfo && oreInfo.value) {
                allMaterials[key].unitValue = parseValue(oreInfo.value);
                allMaterials[key].totalValue = allMaterials[key].unitValue * allMaterials[key].totalQuantity;
                totalMaterialValue += material.quantity * item.quantity * allMaterials[key].unitValue;
            }
        });
    });

    const combinedMaterials = Object.values(allMaterials);

    // Display results with enhanced cost analysis
    displayCalculationResults(null, combinedMaterials, totalCraftingCost, null, totalMaterialValue);

    // Generate farming route with player capability
    generateFarmingRoute(combinedMaterials);

    // Generate farming efficiency analysis
    generateFarmingEfficiency(combinedMaterials);
}

// Display calculation results
function displayCalculationResults(equipment, materials, totalCraftingCost, quantity, totalMaterialValue = 0) {
    const resultContainer = document.getElementById('calculation-result');
    const materialsContainer = document.getElementById('materials-list');
    const costContainer = document.getElementById('total-cost');

    // Show materials list with values
    materialsContainer.innerHTML = materials.map(material => {
        const oreInfo = findOreInfo(material.name);
        const locations = oreInfo ? oreInfo.locations : ['ไม่พบข้อมูล'];
        const rarity = oreInfo ? oreInfo.rarity : 'Unknown';
        const unitValue = material.unitValue || 0;
        const totalValue = material.totalValue || 0;

        return `
            <div class="material-item">
                <div class="material-info">
                    <div class="material-name-container">
                        <div class="material-name">${material.name}</div>
                        <span class="rarity-badge rarity-${rarity.toLowerCase()}">${rarity}</span>
                        ${unitValue > 0 ? `<span class="material-unit-value">💰 $${unitValue.toLocaleString()}</span>` : ''}
                    </div>
                    ${material.requirement ? `<small class="material-requirement">ต้องการ: ${material.requirement}</small>` : ''}
                    <div class="material-locations">
                        ${locations.map(loc => `<span class="material-location-tag">${loc}</span>`).join('')}
                    </div>
                    ${oreInfo && oreInfo.dropChances ? `
                        <div class="material-best-location">
                            <small>อัตราดีที่สุด: ${getBestDropLocation(oreInfo.dropChances)}</small>
                        </div>
                    ` : ''}
                </div>
                <div class="material-quantity-info">
                    <div class="material-quantity">${material.totalQuantity}</div>
                    ${totalValue > 0 ? `<div class="material-total-value">$${totalValue.toLocaleString()}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Show enhanced cost analysis
    if (equipment && quantity) {
        // Single equipment
        costContainer.innerHTML = `
            <div class="cost-analysis">
                <div class="cost-item">
                    <span class="cost-label">ค่า Crafting:</span>
                    <span class="cost-value">${totalCraftingCost.toLocaleString()} เหรียญ</span>
                </div>
                ${totalMaterialValue > 0 ? `
                    <div class="cost-item">
                        <span class="cost-label">มูลค่า Materials:</span>
                        <span class="cost-value">$${totalMaterialValue.toLocaleString()}</span>
                    </div>
                    <div class="cost-item profit-analysis">
                        <span class="cost-label">กำไร/ขาดทุน:</span>
                        <span class="cost-value ${totalMaterialValue > totalCraftingCost ? 'profit' : 'loss'}">
                            ${totalMaterialValue > totalCraftingCost ? '+' : ''}$${(totalMaterialValue - totalCraftingCost).toLocaleString()}
                        </span>
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        // Multiple equipment
        const equipmentSummary = selectedEquipmentList.map(item =>
            `${item.equipment.item} x${item.quantity}`
        ).join(', ');

        costContainer.innerHTML = `
            <div class="cost-analysis">
                <div class="equipment-summary">${equipmentSummary}</div>
                <div class="cost-item">
                    <span class="cost-label">ค่า Crafting รวม:</span>
                    <span class="cost-value">${totalCraftingCost.toLocaleString()} เหรียญ</span>
                </div>
                ${totalMaterialValue > 0 ? `
                    <div class="cost-item">
                        <span class="cost-label">มูลค่า Materials รวม:</span>
                        <span class="cost-value">$${totalMaterialValue.toLocaleString()}</span>
                    </div>
                    <div class="cost-item profit-analysis">
                        <span class="cost-label">การวิเคราะห์:</span>
                        <span class="cost-value ${totalMaterialValue > totalCraftingCost ? 'profit' : 'loss'}">
                            ${totalMaterialValue > totalCraftingCost ?
                    `กำไร $${(totalMaterialValue - totalCraftingCost).toLocaleString()}` :
                    `ขาดทุน $${(totalCraftingCost - totalMaterialValue).toLocaleString()}`
                }
                        </span>
                    </div>
                    <div class="cost-efficiency">
                        <small>
                            ${totalMaterialValue > totalCraftingCost ?
                    '✅ คุ้มค่า: ขาย Materials ได้กำไรมากกว่า Craft' :
                    '⚠️ ไม่คุ้มค่า: Craft แล้วขายดีกว่าขาย Materials'
                }
                        </small>
                    </div>
                ` : ''}
            </div>
        `;
    }

    resultContainer.style.display = 'block';
}

// Get best drop location from drop chances
function getBestDropLocation(dropChances) {
    let bestLocation = '';
    let bestRate = 0;

    Object.entries(dropChances).forEach(([location, chance]) => {
        // Extract percentage from string like "(4.62233721% or ~1 in 22)"
        const match = chance.match(/\(([0-9.]+)%/);
        if (match) {
            const rate = parseFloat(match[1]);
            if (rate > bestRate) {
                bestRate = rate;
                bestLocation = location;
            }
        }
    });

    return bestLocation ? `${bestLocation} (${bestRate.toFixed(2)}%)` : 'ไม่ทราบ';
}

// Generate farming efficiency analysis
function generateFarmingEfficiency(materials) {
    const efficiencyContainer = document.getElementById('farming-efficiency');
    const playerShovelLevel = parseInt(document.getElementById('shovel-level').value);

    // Calculate efficiency for each material
    const materialEfficiency = materials.map(material => {
        const oreInfo = findOreInfo(material.name);
        if (!oreInfo || !oreInfo.dropChances) {
            return {
                ...material,
                efficiency: 0,
                bestLocation: 'ไม่ทราบ',
                accessible: false
            };
        }

        // Find best accessible location
        let bestRate = 0;
        let bestLocation = '';
        let accessible = false;

        Object.entries(oreInfo.dropChances).forEach(([location, chance]) => {
            const zoneInfo = getZoneInfo(location);
            const toughness = zoneInfo ? zoneInfo.shovelToughness : 1;

            if (toughness <= playerShovelLevel) {
                const match = chance.match(/\(([0-9.]+)%/);
                if (match) {
                    const rate = parseFloat(match[1]);
                    if (rate > bestRate) {
                        bestRate = rate;
                        bestLocation = location;
                        accessible = true;
                    }
                }
            }
        });

        // Calculate efficiency score (drop rate * value * quantity needed)
        const unitValue = material.unitValue || 0;
        const efficiency = bestRate * unitValue * material.totalQuantity;

        return {
            ...material,
            efficiency: efficiency,
            bestLocation: bestLocation || 'ไม่สามารถเข้าได้',
            bestRate: bestRate,
            accessible: accessible
        };
    });

    // Sort by efficiency (highest first)
    const sortedByEfficiency = [...materialEfficiency].sort((a, b) => b.efficiency - a.efficiency);

    // Group by location for route optimization
    const locationEfficiency = {};
    materialEfficiency.forEach(material => {
        if (material.accessible && material.bestLocation !== 'ไม่สามารถเข้าได้') {
            if (!locationEfficiency[material.bestLocation]) {
                locationEfficiency[material.bestLocation] = {
                    location: material.bestLocation,
                    materials: [],
                    totalEfficiency: 0,
                    totalValue: 0
                };
            }
            locationEfficiency[material.bestLocation].materials.push(material);
            locationEfficiency[material.bestLocation].totalEfficiency += material.efficiency;
            locationEfficiency[material.bestLocation].totalValue += material.totalValue || 0;
        }
    });

    const sortedLocations = Object.values(locationEfficiency).sort((a, b) => b.totalEfficiency - a.totalEfficiency);

    let efficiencyHTML = '';

    // Material efficiency ranking
    efficiencyHTML += `
        <div class="efficiency-section">
            <h4>🎯 Materials ที่คุ้มค่าที่สุด</h4>
            <div class="efficiency-materials">
                ${sortedByEfficiency.slice(0, 5).map((material, index) => `
                    <div class="efficiency-item ${!material.accessible ? 'inaccessible' : ''}">
                        <div class="efficiency-rank">${index + 1}</div>
                        <div class="efficiency-info">
                            <div class="efficiency-name">
                                ${material.name}
                                <span class="rarity-badge rarity-${findOreInfo(material.name)?.rarity?.toLowerCase() || 'unknown'}">${findOreInfo(material.name)?.rarity || 'Unknown'}</span>
                            </div>
                            <div class="efficiency-details">
                                ${material.accessible ?
            `📍 ${material.bestLocation} (${material.bestRate.toFixed(2)}%)` :
            '🚫 ไม่สามารถเข้าได้'
        }
                            </div>
                            ${material.unitValue > 0 ? `
                                <div class="efficiency-value">
                                    💰 $${material.unitValue.toLocaleString()} × ${material.totalQuantity} = $${(material.unitValue * material.totalQuantity).toLocaleString()}
                                </div>
                            ` : ''}
                        </div>
                        <div class="efficiency-score">
                            ${material.efficiency.toFixed(0)}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Location efficiency ranking
    if (sortedLocations.length > 0) {
        efficiencyHTML += `
            <div class="efficiency-section">
                <h4>🗺️ Locations ที่คุ้มค่าที่สุด</h4>
                <div class="efficiency-locations">
                    ${sortedLocations.slice(0, 3).map((location, index) => {
            const zoneInfo = getZoneInfo(location.location);
            return `
                            <div class="location-efficiency-item">
                                <div class="location-rank">${index + 1}</div>
                                <div class="location-info">
                                    <div class="location-name">
                                        ${location.location}
                                        <div class="location-toughness">
                                            ${Array(zoneInfo?.shovelToughness || 1).fill('⭐').join('')}${Array(5 - (zoneInfo?.shovelToughness || 1)).fill('☆').join('')}
                                        </div>
                                    </div>
                                    <div class="location-materials">
                                        ${location.materials.map(m => `
                                            <span class="location-material">${m.name} (${m.totalQuantity})</span>
                                        `).join('')}
                                    </div>
                                    <div class="location-value">
                                        💰 รวมมูลค่า: $${location.totalValue.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    // Farming tips
    efficiencyHTML += `
        <div class="efficiency-section">
            <h4>💡 คำแนะนำการ Farm</h4>
            <div class="farming-tips">
                <div class="tip-item">
                    <span class="tip-icon">⚡</span>
                    <span class="tip-text">เริ่มจาก Materials ที่มี Drop Rate สูงและมูลค่ามาก</span>
                </div>
                <div class="tip-item">
                    <span class="tip-icon">🎯</span>
                    <span class="tip-text">Farm ใน Location เดียวกันให้ครบก่อนย้ายที่ใหม่</span>
                </div>
                <div class="tip-item">
                    <span class="tip-icon">📈</span>
                    <span class="tip-text">อัพเกรด Shovel เพื่อเข้าถึง Location ที่มีมูลค่าสูงกว่า</span>
                </div>
                ${sortedByEfficiency.some(m => !m.accessible) ? `
                    <div class="tip-item warning">
                        <span class="tip-icon">⚠️</span>
                        <span class="tip-text">คุณยังเข้าไม่ได้บาง Location ที่มี Materials คุ้มค่า - ควรอัพเกรด Shovel</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    efficiencyContainer.innerHTML = efficiencyHTML;
}

// Generate optimal farming route with player capability consideration
function generateFarmingRoute(materials) {
    const routeContainer = document.getElementById('farming-route');
    const playerShovelLevel = parseInt(document.getElementById('shovel-level').value);

    // Group materials by their best locations
    const locationGroups = {};

    materials.forEach(material => {
        const oreInfo = findOreInfo(material.name);
        if (oreInfo && oreInfo.locations) {
            oreInfo.locations.forEach(location => {
                if (!locationGroups[location]) {
                    locationGroups[location] = [];
                }
                locationGroups[location].push({
                    ...material,
                    rarity: oreInfo.rarity
                });
            });
        }
    });

    // Separate accessible and inaccessible locations
    const accessibleLocations = [];
    const inaccessibleLocations = [];

    Object.keys(locationGroups).forEach(location => {
        const zoneInfo = getZoneInfo(location);
        const toughness = zoneInfo ? zoneInfo.shovelToughness : 1;

        if (toughness <= playerShovelLevel) {
            accessibleLocations.push(location);
        } else {
            inaccessibleLocations.push(location);
        }
    });

    // Sort locations by shovel toughness (easier first)
    const sortedAccessible = accessibleLocations.sort((a, b) => {
        const zoneA = getZoneInfo(a);
        const zoneB = getZoneInfo(b);
        const toughnessA = zoneA ? zoneA.shovelToughness : 999;
        const toughnessB = zoneB ? zoneB.shovelToughness : 999;
        return toughnessA - toughnessB;
    });

    const sortedInaccessible = inaccessibleLocations.sort((a, b) => {
        const zoneA = getZoneInfo(a);
        const zoneB = getZoneInfo(b);
        const toughnessA = zoneA ? zoneA.shovelToughness : 999;
        const toughnessB = zoneB ? zoneB.shovelToughness : 999;
        return toughnessA - toughnessB;
    });

    // Generate route recommendations
    const accessibleRoute = [];
    const inaccessibleRoute = [];
    const collectedMaterials = new Set();

    // Process accessible locations first
    sortedAccessible.forEach(location => {
        const materialsInLocation = locationGroups[location].filter(material =>
            !collectedMaterials.has(material.name)
        );

        if (materialsInLocation.length > 0) {
            const zoneInfo = getZoneInfo(location);
            accessibleRoute.push({
                location: location,
                materials: materialsInLocation,
                toughness: zoneInfo ? zoneInfo.shovelToughness : 1,
                description: zoneInfo ? zoneInfo.description : '',
                accessible: true
            });

            materialsInLocation.forEach(material => {
                collectedMaterials.add(material.name);
            });
        }
    });

    // Process inaccessible locations
    sortedInaccessible.forEach(location => {
        const materialsInLocation = locationGroups[location].filter(material =>
            !collectedMaterials.has(material.name)
        );

        if (materialsInLocation.length > 0) {
            const zoneInfo = getZoneInfo(location);
            inaccessibleRoute.push({
                location: location,
                materials: materialsInLocation,
                toughness: zoneInfo ? zoneInfo.shovelToughness : 1,
                description: zoneInfo ? zoneInfo.description : '',
                accessible: false
            });
        }
    });

    // Display farming route
    let routeHTML = '';

    if (accessibleRoute.length > 0) {
        routeHTML += '<h4 style="color: #38a169; margin-bottom: 15px;">✅ พื้นที่ที่เข้าได้ (ตามความสามารถปัจจุบัน)</h4>';
        routeHTML += accessibleRoute.map((step, index) => `
            <div class="farming-step accessible-location">
                <div class="step-location">
                    <span class="step-number">${index + 1}</span>
                    ${step.location}
                    <div class="step-toughness">
                        ความยาก: ${Array(step.toughness).fill('⭐').join('')}${Array(5 - step.toughness).fill('☆').join('')}
                    </div>
                    <div class="location-accessibility accessible">✅ เข้าได้</div>
                </div>
                <div class="step-materials">
                    <strong>Materials ที่หาได้:</strong> 
                    <div class="materials-in-location">
                        ${step.materials.map(m => `
                            <span class="material-with-rarity">
                                ${m.name} (${m.totalQuantity}) 
                                <span class="rarity-badge rarity-${m.rarity.toLowerCase()}">${m.rarity}</span>
                            </span>
                        `).join('')}
                    </div>
                </div>
                ${step.description ? `<div class="step-description">${step.description}</div>` : ''}
            </div>
        `).join('');
    }

    if (inaccessibleRoute.length > 0) {
        routeHTML += '<h4 style="color: #e53e3e; margin: 20px 0 15px 0;">🚫 พื้นที่ที่ยังเข้าไม่ได้ (ต้องอัพเกรด Shovel)</h4>';
        routeHTML += '<div class="capability-warning"><strong>คำแนะนำ:</strong> คุณต้องอัพเกรด Shovel Toughness เพื่อเข้าถึงพื้นที่เหล่านี้</div>';
        routeHTML += inaccessibleRoute.map((step, index) => `
            <div class="farming-step inaccessible-location">
                <div class="step-location">
                    <span class="step-number" style="background: #f56565;">!</span>
                    ${step.location}
                    <div class="step-toughness">
                        ความยาก: ${Array(step.toughness).fill('⭐').join('')}${Array(5 - step.toughness).fill('☆').join('')}
                    </div>
                    <div class="location-accessibility inaccessible">🚫 ต้องการ Shovel Level ${step.toughness}</div>
                </div>
                <div class="step-materials">
                    <strong>Materials ที่หาได้:</strong> 
                    <div class="materials-in-location">
                        ${step.materials.map(m => `
                            <span class="material-with-rarity">
                                ${m.name} (${m.totalQuantity}) 
                                <span class="rarity-badge rarity-${m.rarity.toLowerCase()}">${m.rarity}</span>
                            </span>
                        `).join('')}
                    </div>
                </div>
                ${step.description ? `<div class="step-description">${step.description}</div>` : ''}
            </div>
        `).join('');
    }

    if (routeHTML === '') {
        routeHTML = '<p>ไม่พบข้อมูล location สำหรับ materials เหล่านี้</p>';
    }

    routeContainer.innerHTML = routeHTML;
}

// Equipment Simulator Functions
function populateSimulatorSelectors() {
    const neckSelect = document.getElementById('neck-slot');
    const charmSelect = document.getElementById('charm-slot');

    // Clear existing options
    neckSelect.innerHTML = '<option value="">-- เลือก Neck --</option>';
    charmSelect.innerHTML = '<option value="">-- เลือก Charm --</option>';

    if (!equipmentData.crafting) return;

    // Get equipment by type from data.json
    const neckItems = equipmentData.crafting.filter(item =>
        item.type === 'Necklace' && equipmentStats[item.item]
    );
    const charmItems = equipmentData.crafting.filter(item =>
        (item.type === 'Charm' || item.type === 'Amulet') && equipmentStats[item.item]
    );

    // Sort by rarity and cost
    const rarityOrder = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5, 'Mythical': 6 };

    neckItems.sort((a, b) => {
        const rarityDiff = (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
        if (rarityDiff !== 0) return rarityDiff;
        return parseInt(a.cost.replace(/,/g, '')) - parseInt(b.cost.replace(/,/g, ''));
    });

    charmItems.sort((a, b) => {
        const rarityDiff = (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
        if (rarityDiff !== 0) return rarityDiff;
        return parseInt(a.cost.replace(/,/g, '')) - parseInt(b.cost.replace(/,/g, ''));
    });

    // Populate neck options
    neckItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item.item;
        option.textContent = `${item.item} [${item.rarity}] - ${item.cost} เหรียญ`;
        neckSelect.appendChild(option);
    });

    // Populate charm options
    charmItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item.item;
        option.textContent = `${item.item} [${item.rarity}] - ${item.cost} เหรียญ`;
        charmSelect.appendChild(option);
    });
}

function setupSimulatorEventListeners() {
    // Neck slot change
    document.getElementById('neck-slot').addEventListener('change', function () {
        simulatorEquipment.neck = {
            item: this.value,
            level: document.getElementById('neck-level').value
        };
        updateTotalStats();
    });

    document.getElementById('neck-level').addEventListener('change', function () {
        if (simulatorEquipment.neck) {
            simulatorEquipment.neck.level = this.value;
            updateTotalStats();
        }
    });

    // Charm slot change
    document.getElementById('charm-slot').addEventListener('change', function () {
        simulatorEquipment.charm = {
            item: this.value,
            level: document.getElementById('charm-level').value
        };
        updateTotalStats();
    });

    document.getElementById('charm-level').addEventListener('change', function () {
        if (simulatorEquipment.charm) {
            simulatorEquipment.charm.level = this.value;
            updateTotalStats();
        }
    });
}

function initializeSimulator() {
    // Initialize with empty rings array
    simulatorEquipment.rings = [];
    updateTotalStats();
    updateRecommendations();
}

function addRingSlot() {
    if (simulatorEquipment.rings.length >= 8) {
        alert('สามารถใส่ Ring ได้สูงสุด 8 วง');
        return;
    }

    const ringIndex = simulatorEquipment.rings.length;
    const ringsContainer = document.getElementById('rings-container');

    const ringDiv = document.createElement('div');
    ringDiv.className = 'ring-item';
    // Get ring items from data.json
    const ringItems = equipmentData.crafting ? equipmentData.crafting.filter(item =>
        item.type === 'Ring' && equipmentStats[item.item]
    ) : [];

    // Sort rings by rarity and cost
    const rarityOrder = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Epic': 4, 'Legendary': 5, 'Mythical': 6 };
    ringItems.sort((a, b) => {
        const rarityDiff = (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
        if (rarityDiff !== 0) return rarityDiff;
        return parseInt(a.cost.replace(/,/g, '')) - parseInt(b.cost.replace(/,/g, ''));
    });

    const ringOptions = ringItems.map(item =>
        `<option value="${item.item}">${item.item} [${item.rarity}] - ${item.cost} เหรียญ</option>`
    ).join('');

    ringDiv.innerHTML = `
        <select class="ring-select" data-index="${ringIndex}">
            <option value="">-- เลือก Ring --</option>
            ${ringOptions}
        </select>
        <div class="stat-level">
            <label>ระดับ:</label>
            <select class="ring-level" data-index="${ringIndex}">
                <option value="min">น้อยสุด</option>
                <option value="mid" selected>กลาง</option>
                <option value="max">มากสุด</option>
            </select>
        </div>
        <button class="remove-ring-btn" onclick="removeRingSlot(${ringIndex})">ลบ</button>
    `;

    ringsContainer.appendChild(ringDiv);

    // Add event listeners for the new ring
    const ringSelect = ringDiv.querySelector('.ring-select');
    const ringLevel = ringDiv.querySelector('.ring-level');

    ringSelect.addEventListener('change', function () {
        updateRingData(ringIndex, this.value, ringLevel.value);
    });

    ringLevel.addEventListener('change', function () {
        updateRingData(ringIndex, ringSelect.value, this.value);
    });

    // Add empty ring to data
    simulatorEquipment.rings.push({ item: '', level: 'mid' });

    // Update button state
    updateAddRingButton();
}

function removeRingSlot(index) {
    const ringsContainer = document.getElementById('rings-container');
    const ringItems = ringsContainer.querySelectorAll('.ring-item');

    if (ringItems[index]) {
        ringItems[index].remove();
        simulatorEquipment.rings.splice(index, 1);

        // Re-index remaining rings
        const remainingRings = ringsContainer.querySelectorAll('.ring-item');
        remainingRings.forEach((ring, newIndex) => {
            const select = ring.querySelector('.ring-select');
            const level = ring.querySelector('.ring-level');
            const button = ring.querySelector('.remove-ring-btn');

            select.setAttribute('data-index', newIndex);
            level.setAttribute('data-index', newIndex);
            button.setAttribute('onclick', `removeRingSlot(${newIndex})`);
        });

        updateTotalStats();
        updateAddRingButton();
    }
}

function updateRingData(index, item, level) {
    if (simulatorEquipment.rings[index]) {
        simulatorEquipment.rings[index] = { item, level };
        updateTotalStats();
    }
}

function updateAddRingButton() {
    const button = document.getElementById('add-ring-btn');
    if (simulatorEquipment.rings.length >= 8) {
        button.disabled = true;
        button.textContent = 'Ring เต็มแล้ว (8/8)';
    } else {
        button.disabled = false;
        button.textContent = `เพิ่ม Ring (${simulatorEquipment.rings.length}/8)`;
    }
}

function getStatValue(equipmentName, statName, level) {
    const equipment = equipmentStats[equipmentName];
    if (!equipment || !equipment[statName]) return 0;

    const statArray = equipment[statName];
    switch (level) {
        case 'min': return statArray[0];
        case 'mid': return statArray[1];
        case 'max': return statArray[2];
        default: return statArray[1];
    }
}

function updateTotalStats() {
    // Initialize all possible stats
    const totalStats = {
        luck: 0,
        digSpeed: 0,
        digStrength: 0,
        capacity: 0,
        shakeSpeed: 0,
        shakeStrength: 0,
        sellBoost: 0,
        sizeBoost: 0,
        modifierBoost: 0
    };

    // Helper function to add stats from equipment
    const addEquipmentStats = (equipmentName, level) => {
        const equipStats = equipmentStats[equipmentName];
        if (equipStats) {
            Object.keys(equipStats).forEach(stat => {
                if (totalStats.hasOwnProperty(stat)) {
                    totalStats[stat] += getStatValue(equipmentName, stat, level);
                }
            });
        }
    };

    // Calculate neck stats
    if (simulatorEquipment.neck && simulatorEquipment.neck.item) {
        addEquipmentStats(simulatorEquipment.neck.item, simulatorEquipment.neck.level);
    }

    // Calculate charm stats
    if (simulatorEquipment.charm && simulatorEquipment.charm.item) {
        addEquipmentStats(simulatorEquipment.charm.item, simulatorEquipment.charm.level);
    }

    // Calculate rings stats
    simulatorEquipment.rings.forEach(ring => {
        if (ring.item) {
            addEquipmentStats(ring.item, ring.level);
        }
    });

    // Display total stats
    displayTotalStats(totalStats);
    updateRecommendations(totalStats);
}

function displayTotalStats(stats) {
    const container = document.getElementById('total-stats');

    // Define stat display information
    const statInfo = {
        luck: { name: '🍀 Luck', suffix: '' },
        digSpeed: { name: '⚡ Dig Speed', suffix: '%' },
        digStrength: { name: '💪 Dig Strength', suffix: '' },
        capacity: { name: '🎒 Capacity', suffix: '' },
        shakeSpeed: { name: '🌪️ Shake Speed', suffix: '%' },
        shakeStrength: { name: '💥 Shake Strength', suffix: '' },
        sellBoost: { name: '💰 Sell Boost', suffix: '%' },
        sizeBoost: { name: '📏 Size Boost', suffix: '%' },
        modifierBoost: { name: '✨ Modifier Boost', suffix: '%' }
    };

    let html = '';
    
    Object.keys(statInfo).forEach(statKey => {
        const value = stats[statKey] || 0;
        if (value !== 0) { // Only show stats that have values
            const info = statInfo[statKey];
            const isPositive = value > 0;
            const isNegative = value < 0;
            const cssClass = isPositive ? 'stat-boost' : isNegative ? 'stat-debuff' : 'stat-neutral';
            
            html += `
                <div class="stat-item">
                    <span class="stat-name">${info.name}</span>
                    <span class="stat-value ${cssClass}">
                        ${isPositive ? '+' : ''}${value}${info.suffix}
                    </span>
                </div>
            `;
        }
    });

    // If no stats, show a message
    if (html === '') {
        html = '<div class="no-stats">ไม่มี Equipment ที่ใส่</div>';
    }

    container.innerHTML = html;
}

function updateRecommendations(currentStats = { luck: 0, speed: 0, power: 0 }) {
    const container = document.getElementById('recommendations');

    // Generate recommendations based on current stats
    const recommendations = generateRecommendationsFromData(currentStats);

    if (recommendations.length === 0) {
        container.innerHTML = '<div class="no-recommendations">ไม่มีคำแนะนำเพิ่มเติม</div>';
        return;
    }

    // Group recommendations by stat type
    const groupedRecommendations = {};
    
    // Group all recommendations by their target stat
    recommendations.forEach(rec => {
        if (!groupedRecommendations[rec.targetStat]) {
            groupedRecommendations[rec.targetStat] = [];
        }
        groupedRecommendations[rec.targetStat].push(rec);
    });

    let html = '';

    Object.keys(groupedRecommendations).forEach(statType => {
        const recs = groupedRecommendations[statType];
        if (recs.length > 0) {
            // Get emoji and display name for each stat
            const statEmojis = {
                luck: '🍀',
                digSpeed: '⚡',
                digStrength: '💪',
                capacity: '🎒',
                shakeSpeed: '🌪️',
                shakeStrength: '💥',
                sellBoost: '💰',
                sizeBoost: '📏',
                modifierBoost: '✨'
            };
            
            const statEmoji = statEmojis[statType] || '📊';
            const statName = getStatDisplayName(statType);

            html += `
                <div class="recommendation-section">
                    <div class="recommendation-title">
                        ${statEmoji} เพิ่ม ${statName}
                    </div>
                    <div class="recommendation-list">
                        ${recs.map(rec => `
                            <div class="recommendation-item ${rec.priority}">
                                <div class="recommendation-equipment">${rec.equipment}</div>
                                <div class="recommendation-reason">${rec.reason}</div>
                                <div class="recommendation-stats">
                                    ${rec.statBoost > 0 ? `+${rec.statBoost} ${statName}` : ''}
                                    ${rec.cost ? ` | ${rec.cost} เหรียญ` : ''}
                                    ${rec.rarity ? ` | ${rec.rarity}` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}

function generateRecommendations(currentStats) {
    const recommendations = [];

    // Check what equipment is currently equipped
    const hasNeck = simulatorEquipment.neck && simulatorEquipment.neck.item;
    const hasCharm = simulatorEquipment.charm && simulatorEquipment.charm.item;
    const ringCount = simulatorEquipment.rings.filter(r => r.item).length;

    if (!equipmentData.crafting) return recommendations;

    // Recommendations for Luck
    if (currentStats.luck < 10) {
        if (!hasNeck) {
            recommendations.push({
                equipment: 'Lucky Necklace (มากสุด)',
                reason: 'เพิ่ม Luck ได้มากที่สุดสำหรับ Neck slot',
                targetStat: 'luck',
                statBoost: 4,
                priority: 'high-priority'
            });
        }

        if (!hasCharm) {
            recommendations.push({
                equipment: 'Fortune Charm (มากสุด)',
                reason: 'เพิ่ม Luck ได้มากที่สุดสำหรับ Charm slot',
                targetStat: 'luck',
                statBoost: 5,
                priority: 'high-priority'
            });
        }

        if (ringCount < 8) {
            recommendations.push({
                equipment: 'Rare Lucky Ring (มากสุด)',
                reason: 'Ring ที่ให้ Luck สูงสุด',
                targetStat: 'luck',
                statBoost: 4,
                priority: 'medium-priority'
            });
        }
    }

    // Recommendations for Speed
    if (currentStats.speed < 10) {
        if (!hasNeck) {
            recommendations.push({
                equipment: 'Speed Pendant (มากสุด)',
                reason: 'เพิ่ม Speed ได้มากที่สุดสำหรับ Neck slot',
                targetStat: 'speed',
                statBoost: 5,
                priority: 'high-priority'
            });
        }

        if (!hasCharm) {
            recommendations.push({
                equipment: 'Swift Charm (มากสุด)',
                reason: 'เพิ่ม Speed ได้มากที่สุดสำหรับ Charm slot',
                targetStat: 'speed',
                statBoost: 4,
                priority: 'high-priority'
            });
        }

        if (ringCount < 8) {
            recommendations.push({
                equipment: 'Rare Speed Ring (มากสุด)',
                reason: 'Ring ที่ให้ Speed สูงสุด',
                targetStat: 'speed',
                statBoost: 4,
                priority: 'medium-priority'
            });
        }
    }

    // Recommendations for Power
    if (currentStats.power < 10) {
        if (!hasNeck) {
            recommendations.push({
                equipment: 'Power Amulet (มากสุด)',
                reason: 'เพิ่ม Power ได้มากที่สุดสำหรับ Neck slot',
                targetStat: 'power',
                statBoost: 4,
                priority: 'high-priority'
            });
        }

        if (!hasCharm) {
            recommendations.push({
                equipment: 'Strength Charm (มากสุด)',
                reason: 'เพิ่ม Power ได้มากที่สุดสำหรับ Charm slot',
                targetStat: 'power',
                statBoost: 4,
                priority: 'high-priority'
            });
        }

        if (ringCount < 8) {
            recommendations.push({
                equipment: 'Rare Power Ring (มากสุด)',
                reason: 'Ring ที่ให้ Power สูงสุด',
                targetStat: 'power',
                statBoost: 4,
                priority: 'medium-priority'
            });
        }
    }

    // General recommendations
    if (ringCount < 8) {
        recommendations.push({
            equipment: 'เพิ่ม Ring ให้ครบ 8 วง',
            reason: 'เพิ่มพื้นที่สำหรับ stats เพิ่มเติม',
            targetStat: 'luck',
            statBoost: 0,
            priority: 'low-priority'
        });
    }

    // Balanced build recommendation
    if (hasNeck && hasCharm && ringCount >= 4) {
        const statDifference = Math.max(currentStats.luck, currentStats.speed, currentStats.power) -
            Math.min(currentStats.luck, currentStats.speed, currentStats.power);

        if (statDifference > 5) {
            recommendations.push({
                equipment: 'Balanced Charm หรือ Mystic Chain',
                reason: 'สร้าง build ที่สมดุลมากขึ้น',
                targetStat: 'luck',
                statBoost: 0,
                priority: 'medium-priority'
            });
        }
    }

    return recommendations;
}

// Process equipment data from data.json to create stats for simulator
function processEquipmentStats() {
    equipmentStats = {};

    if (!equipmentData.crafting) return;

    equipmentData.crafting.forEach(item => {
        const stats = parseBuffsToStats(item.buffs);
        if (Object.keys(stats).length > 0) {
            equipmentStats[item.item] = stats;
        }
    });

    console.log('Processed equipment stats:', equipmentStats);
}

// Parse buffs string to extract all stats with min/mid/max values
function parseBuffsToStats(buffsString) {
    const stats = {};

    if (!buffsString) return stats;

    // Split by comma and process each buff
    const buffs = buffsString.split(',');

    buffs.forEach(buff => {
        const trimmed = buff.trim();

        // Helper function to parse stat values (handles negative values too)
        const parseStatRange = (match) => {
            if (!match) return null;
            const min = parseFloat(match[1]);
            const max = match[2] ? parseFloat(match[2]) : min;
            const mid = (min + max) / 2;
            return [min, mid, max];
        };

        // Match all possible stats from the game
        const patterns = {
            luck: /Luck:\s*(-?[0-9.]+)(?:-(-?[0-9.]+))?/i,
            digSpeed: /Dig\s*Speed:\s*(-?[0-9.]+)(?:-(-?[0-9.]+))?%?/i,
            digStrength: /Dig\s*Strength:\s*(-?[0-9.]+)(?:-(-?[0-9.]+))?/i,
            capacity: /Capacity:\s*(-?[0-9.]+)(?:-(-?[0-9.]+))?/i,
            shakeSpeed: /Shake\s*Speed:\s*(-?[0-9.]+)(?:-(-?[0-9.]+))?%?/i,
            shakeStrength: /Shake\s*Strength:\s*(-?[0-9.]+)(?:-(-?[0-9.]+))?/i,
            sellBoost: /Sell\s*Boost:\s*(-?[0-9.]+)(?:-(-?[0-9.]+))?%?/i,
            sizeBoost: /Size\s*Boost:\s*(-?[0-9.]+)(?:-(-?[0-9.]+))?%?/i,
            modifierBoost: /Modifier\s*Boost:\s*(-?[0-9.]+)(?:-(-?[0-9.]+))?%?/i
        };

        // Process each stat type
        Object.keys(patterns).forEach(statType => {
            const match = trimmed.match(patterns[statType]);
            if (match) {
                const values = parseStatRange(match);
                if (values) {
                    stats[statType] = values;
                }
            }
        });
    });

    // Round all values to 1 decimal place
    Object.keys(stats).forEach(stat => {
        stats[stat] = stats[stat].map(val => Math.round(val * 10) / 10);
    });

    return stats;
}
// Find best equipment for a specific stat and type
function findBestEquipmentForStat(statName, equipmentType, currentStats) {
    if (!equipmentData.crafting) return null;

    let typeFilter;
    switch (equipmentType) {
        case 'neck':
            typeFilter = item => item.type === 'Necklace';
            break;
        case 'charm':
            typeFilter = item => item.type === 'Charm' || item.type === 'Amulet';
            break;
        case 'ring':
            typeFilter = item => item.type === 'Ring';
            break;
        default:
            return null;
    }

    const availableItems = equipmentData.crafting.filter(item =>
        typeFilter(item) && equipmentStats[item.item] && equipmentStats[item.item][statName]
    );

    if (availableItems.length === 0) return null;

    // Sort by stat value (max level) descending
    availableItems.sort((a, b) => {
        const aStats = equipmentStats[a.item][statName];
        const bStats = equipmentStats[b.item][statName];
        const aMax = aStats ? aStats[2] : 0;
        const bMax = bStats ? bStats[2] : 0;
        return bMax - aMax;
    });

    const bestItem = availableItems[0];
    const maxStatValue = equipmentStats[bestItem.item][statName][2];

    return {
        item: bestItem,
        statBoost: maxStatValue,
        equipment: `${bestItem.item} (มากสุด)`,
        reason: `เพิ่ม ${getStatDisplayName(statName)} ได้มากที่สุดสำหรับ ${getTypeDisplayName(equipmentType)} slot`
    };
}

function getStatDisplayName(statName) {
    switch (statName) {
        case 'luck': return 'Luck';
        case 'digSpeed': return 'Dig Speed';
        case 'digStrength': return 'Dig Strength';
        case 'capacity': return 'Capacity';
        case 'shakeSpeed': return 'Shake Speed';
        case 'shakeStrength': return 'Shake Strength';
        case 'sellBoost': return 'Sell Boost';
        case 'sizeBoost': return 'Size Boost';
        case 'modifierBoost': return 'Modifier Boost';
        default: return statName;
    }
}

function getTypeDisplayName(equipmentType) {
    switch (equipmentType) {
        case 'neck': return 'Neck';
        case 'charm': return 'Charm';
        case 'ring': return 'Ring';
        default: return equipmentType;
    }
}

// Updated generateRecommendations function
function generateRecommendationsFromData(currentStats) {
    const recommendations = [];

    // Check what equipment is currently equipped
    const hasNeck = simulatorEquipment.neck && simulatorEquipment.neck.item;
    const hasCharm = simulatorEquipment.charm && simulatorEquipment.charm.item;
    const ringCount = simulatorEquipment.rings.filter(r => r.item).length;

    if (!equipmentData.crafting) return recommendations;

    // Recommendations for each stat
    const stats = ['luck', 'digSpeed', 'digStrength', 'capacity', 'shakeSpeed', 'shakeStrength', 'sellBoost', 'sizeBoost', 'modifierBoost'];
    const statThresholds = { 
        luck: 50, 
        digSpeed: 30, 
        digStrength: 20, 
        capacity: 50, 
        shakeSpeed: 20, 
        shakeStrength: 10, 
        sellBoost: 30, 
        sizeBoost: 30, 
        modifierBoost: 50 
    };

    stats.forEach(statName => {
        if (currentStats[statName] < statThresholds[statName]) {
            // Neck recommendations
            if (!hasNeck) {
                const bestNeck = findBestEquipmentForStat(statName, 'neck', currentStats);
                if (bestNeck) {
                    recommendations.push({
                        equipment: bestNeck.equipment,
                        reason: bestNeck.reason,
                        targetStat: statName,
                        statBoost: bestNeck.statBoost,
                        priority: 'high-priority',
                        cost: bestNeck.item.cost,
                        rarity: bestNeck.item.rarity
                    });
                }
            }

            // Charm recommendations
            if (!hasCharm) {
                const bestCharm = findBestEquipmentForStat(statName, 'charm', currentStats);
                if (bestCharm) {
                    recommendations.push({
                        equipment: bestCharm.equipment,
                        reason: bestCharm.reason,
                        targetStat: statName,
                        statBoost: bestCharm.statBoost,
                        priority: 'high-priority',
                        cost: bestCharm.item.cost,
                        rarity: bestCharm.item.rarity
                    });
                }
            }

            // Ring recommendations
            if (ringCount < 8) {
                const bestRing = findBestEquipmentForStat(statName, 'ring', currentStats);
                if (bestRing) {
                    recommendations.push({
                        equipment: bestRing.equipment,
                        reason: bestRing.reason,
                        targetStat: statName,
                        statBoost: bestRing.statBoost,
                        priority: 'medium-priority',
                        cost: bestRing.item.cost,
                        rarity: bestRing.item.rarity
                    });
                }
            }
        }
    });

    // General recommendations
    if (ringCount < 8) {
        recommendations.push({
            equipment: 'เพิ่ม Ring ให้ครบ 8 วง',
            reason: 'เพิ่มพื้นที่สำหรับ stats เพิ่มเติม',
            targetStat: 'luck',
            statBoost: 0,
            priority: 'low-priority'
        });
    }

    // Remove duplicates and sort by priority
    const uniqueRecommendations = recommendations.filter((rec, index, self) =>
        index === self.findIndex(r => r.equipment === rec.equipment)
    );

    const priorityOrder = { 'high-priority': 1, 'medium-priority': 2, 'low-priority': 3 };
    uniqueRecommendations.sort((a, b) => {
        const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        if (priorityDiff !== 0) return priorityDiff;
        return (b.statBoost || 0) - (a.statBoost || 0);
    });

    return uniqueRecommendations.slice(0, 10); // Limit to top 10 recommendations
}