const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/equipment', (req, res) => {
    try {
        // Use all.json as primary data source
        if (fs.existsSync('./data/all.json')) {
            const data = fs.readFileSync('./data/all.json', 'utf8');
            const parsedData = JSON.parse(data);
            res.json(parsedData);
            return;
        }
        
        // Fallback to equipment.json
        if (fs.existsSync('./data/equipment.json')) {
            const data = fs.readFileSync('./data/equipment.json', 'utf8');
            const parsedData = JSON.parse(data);
            
            if (parsedData.crafting) {
                res.json(parsedData);
            } else {
                res.json({ crafting: parsedData });
            }
        } else {
            res.status(404).json({ error: 'Equipment data not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to load equipment data' });
    }
});

app.get('/api/ores', (req, res) => {
    try {
        // Use all.json as primary data source
        if (fs.existsSync('./data/all.json')) {
            const allData = fs.readFileSync('./data/all.json', 'utf8');
            const parsedAllData = JSON.parse(allData);
            
            if (parsedAllData.minerals) {
                res.json(parsedAllData.minerals);
                return;
            }
        }
        
        // Fallback to equipment.json
        if (fs.existsSync('./data/equipment.json')) {
            const equipmentData = fs.readFileSync('./data/equipment.json', 'utf8');
            const parsedEquipmentData = JSON.parse(equipmentData);
            
            if (parsedEquipmentData.minerals) {
                res.json(parsedEquipmentData.minerals);
                return;
            }
        }
        
        // Final fallback to ores.json
        if (fs.existsSync('./data/ores.json')) {
            const data = fs.readFileSync('./data/ores.json', 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.status(404).json({ error: 'Ores data not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to load ores data' });
    }
});

app.get('/api/zones', (req, res) => {
    try {
        // Use all.json as primary data source
        if (fs.existsSync('./data/all.json')) {
            const allData = fs.readFileSync('./data/all.json', 'utf8');
            const parsedAllData = JSON.parse(allData);
            
            if (parsedAllData.locations) {
                res.json({ locations: parsedAllData.locations });
                return;
            }
        }
        
        // Fallback to equipment.json
        if (fs.existsSync('./data/equipment.json')) {
            const equipmentData = fs.readFileSync('./data/equipment.json', 'utf8');
            const parsedEquipmentData = JSON.parse(equipmentData);
            
            if (parsedEquipmentData.locations) {
                res.json({ locations: parsedEquipmentData.locations });
                return;
            }
        }
        
        // Final fallback to zones.json
        if (fs.existsSync('./data/zones.json')) {
            const data = fs.readFileSync('./data/zones.json', 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.status(404).json({ error: 'Zones data not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to load zones data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});