const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Onboarding route - render the onboarding page
router.get('/onboarding', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'Please login to access onboarding');
        return res.redirect('/login');
    }
    res.render('onboarding', { farmerId: req.user._id });
});

// API endpoint to update farmer details
router.post('/api/update-farmer/:farmerId', async (req, res) => {
    try {
        const farmerId = req.params.farmerId;
        const farmerData = req.body;
        
        // Create farm details object with the provided data
        const farmDetails = {
            landSize: farmerData.landSize,
            mainCrop: farmerData.mainCrop,
            irrigationMethod: farmerData.irrigationMethod,
            sowingDate: new Date() // Default to current date, can be updated later
        };

        // Update the user with the new information
        const updatedUser = await User.findByIdAndUpdate(
            farmerId,
            {
                name: farmerData.name,
                location: farmerData.location,
                farmDetails: [farmDetails] // Store as array for future farm details
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Farmer not found' });
        }

        res.json({ message: 'Farmer details updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating farmer details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
