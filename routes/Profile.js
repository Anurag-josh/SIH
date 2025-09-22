const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Profile route - render the profile page
router.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'Please login to access your profile');
        return res.redirect('/login');
    }
    res.render('Profile', { farmerId: req.user._id });
});

// API endpoint to get farmer data
router.get('/api/farmer-data/:farmerId', async (req, res) => {
    try {
        const farmerId = req.params.farmerId;
        const farmer = await User.findById(farmerId);
        
        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found' });
        }
        
        res.json(farmer);
    } catch (error) {
        console.error('Error fetching farmer data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API endpoint to get crop calendar
router.get('/api/crop-calendar/:cropName', async (req, res) => {
    try {
        const cropName = req.params.cropName;
        
        // This is a placeholder implementation
        // You would typically fetch this from a database or external API
        const cropCalendars = {
            'Rice': {
                activities: [
                    { stage: 'Land Preparation', start_day: 0, end_day: 7, description: 'Prepare the land by plowing and leveling', critical_info: 'Ensure proper water drainage' },
                    { stage: 'Seedling/Transplanting', start_day: 8, end_day: 15, description: 'Transplant seedlings or direct seeding', critical_info: 'Maintain optimal water level' },
                    { stage: 'Vegetative Growth', start_day: 16, end_day: 45, description: 'Monitor plant growth and apply fertilizers', critical_info: 'Watch for pest infestations' },
                    { stage: 'Tillering', start_day: 46, end_day: 75, description: 'Plants develop tillers', critical_info: 'Ensure adequate nutrition' },
                    { stage: 'Flowering', start_day: 76, end_day: 105, description: 'Plants start flowering', critical_info: 'Critical stage - avoid stress' },
                    { stage: 'Grain Development', start_day: 106, end_day: 135, description: 'Grains develop and fill', critical_info: 'Monitor for diseases' },
                    { stage: 'Maturity', start_day: 136, end_day: 150, description: 'Crop reaches maturity', critical_info: 'Plan harvesting time' }
                ]
            },
            'Wheat': {
                activities: [
                    { stage: 'Land Preparation', start_day: 0, end_day: 5, description: 'Prepare the land for sowing', critical_info: 'Ensure good seedbed preparation' },
                    { stage: 'Sowing', start_day: 6, end_day: 10, description: 'Sow wheat seeds', critical_info: 'Optimal depth and spacing' },
                    { stage: 'Germination', start_day: 11, end_day: 20, description: 'Seeds germinate and emerge', critical_info: 'Monitor soil moisture' },
                    { stage: 'Vegetative Growth', start_day: 21, end_day: 60, description: 'Plants grow leaves and stems', critical_info: 'Apply nitrogen fertilizers' },
                    { stage: 'Flowering', start_day: 61, end_day: 80, description: 'Plants flower', critical_info: 'Critical stage for yield' },
                    { stage: 'Grain Filling', start_day: 81, end_day: 110, description: 'Grains develop and fill', critical_info: 'Monitor for diseases' },
                    { stage: 'Maturity', start_day: 111, end_day: 130, description: 'Crop reaches maturity', critical_info: 'Plan harvesting' }
                ]
            },
            'Cotton': {
                activities: [
                    { stage: 'Land Preparation', start_day: 0, end_day: 7, description: 'Prepare the land for cotton cultivation', critical_info: 'Ensure proper drainage' },
                    { stage: 'Sowing', start_day: 8, end_day: 15, description: 'Sow cotton seeds', critical_info: 'Optimal soil temperature' },
                    { stage: 'Germination', start_day: 16, end_day: 25, description: 'Seeds germinate and emerge', critical_info: 'Monitor soil moisture' },
                    { stage: 'Vegetative Growth', start_day: 26, end_day: 60, description: 'Plants develop leaves and branches', critical_info: 'Control weeds' },
                    { stage: 'Flowering', start_day: 61, end_day: 90, description: 'Cotton flowers appear', critical_info: 'Monitor for pests' },
                    { stage: 'Boll Development', start_day: 91, end_day: 120, description: 'Cotton bolls develop', critical_info: 'Critical for yield' },
                    { stage: 'Maturity', start_day: 121, end_day: 150, description: 'Bolls mature and open', critical_info: 'Harvest when bolls open' }
                ]
            },
            'Tomato': {
                activities: [
                    { stage: 'Nursery Preparation', start_day: 0, end_day: 7, description: 'Prepare nursery for tomato seedlings', critical_info: 'Use disease-free seeds' },
                    { stage: 'Transplanting', start_day: 8, end_day: 15, description: 'Transplant seedlings to main field', critical_info: 'Proper spacing important' },
                    { stage: 'Vegetative Growth', start_day: 16, end_day: 40, description: 'Plants develop leaves and stems', critical_info: 'Support plants with stakes' },
                    { stage: 'Flowering', start_day: 41, end_day: 60, description: 'Plants start flowering', critical_info: 'Monitor pollination' },
                    { stage: 'Fruit Setting', start_day: 61, end_day: 80, description: 'Flowers develop into fruits', critical_info: 'Ensure adequate nutrition' },
                    { stage: 'Fruit Development', start_day: 81, end_day: 110, description: 'Fruits grow and develop', critical_info: 'Control pests and diseases' },
                    { stage: 'Harvesting', start_day: 111, end_day: 130, description: 'Harvest mature fruits', critical_info: 'Harvest at right stage' }
                ]
            }
        };
        
        const calendar = cropCalendars[cropName];
        if (!calendar) {
            return res.status(404).json({ message: 'Crop calendar not found' });
        }
        
        res.json(calendar);
    } catch (error) {
        console.error('Error fetching crop calendar:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
