// Global data storage
let equipmentData = [];
let oresData = [];
let zonesData = [];
let selectedEquipmentList = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllData();
    setupEventListeners();
    displayEquipment();
});

// Load all data from API
async function loadAllData() {
    try {
        const [equipmentRes, oresRes, zonesRes] = await Promise.all([
            fetch('/api/equipment'),
            fetch('/api/ores'),
            fetch('/api/zones')
        ]);

        equipmentData = await equipmentRes.json();
        oresData = await oresRes.json();
        zonesData = await zonesRes.json();
        
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
    
    // Populate equipment selector
    populateEquipmentSelector();
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
    switch(tabName) {
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