const express = require('express');
const router = express.Router();
const axios = require('axios');
const Marketplace = require('../models/marketplace');

// ✅ API to get your local MongoDB data directly
router.get('/api', async (req, res) => {
    const { crop, district } = req.query;
    try {
        const query = {};
        if (crop) query.crops = { $in: [crop] };
        if (district) query.location = { $in: [district] };
        const products = await Marketplace.find(query);
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// ✅ Main Marketplace route - with fallback to Friday data
router.get('/', async (req, res) => {
    const { crop, district } = req.query;

    let products = [];
    let dataDate = null;

    try {
        // prepare filters for API
        const filters = { 'filters[state.keyword]': 'Maharashtra' };
        if (district && district !== "") {
            filters['filters[district.keyword]'] = district;
        }

        // call API
        const response = await axios.get(
            'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
            {
                params: {
                    'api-key': '579b464db66ec23bdd00000194a092a9f1a34aab722223cb63d89b60',
                    'format': 'json',
                    'limit': 500,
                    'offset': 0,
                    ...filters
                }
            }
        );

        products = response.data.records;

        // filter crop if needed
        if (crop && crop !== "") {
            products = products.filter(p =>
                p.commodity &&
                p.commodity.toLowerCase().includes(crop.toLowerCase())
            );
        }

        // check if data available
        if (products.length > 0) {
            // map data for EJS
            products = products.map(record => ({
                commodity: record.commodity || '',
                variety: record.variety || '',
                grade: record.grade || '',
                state: record.state || '',
                district: record.district || '',
                market: record.market || '',
                arrival_date: record.arrival_date || '',
                min_price: record.min_price || '',
                max_price: record.max_price || '',
                modal_price: record.modal_price || ''
            }));

            dataDate = products[0].arrival_date; // pick arrival_date of first record
        } else {
            console.log("No live data found. Loading fallback from Friday data...");
            // fallback to local DB (Friday data)
            const fridayData = await Marketplace.find({});
            products = fridayData.map(doc => ({
                commodity: doc.crops[0] || '',
                variety: '',
                grade: '',
                state: 'Maharashtra',
                district: doc.location[0] || '',
                market: doc.description.replace('Market: ', '') || '',
                arrival_date: 'Last Friday',
                min_price: doc.price.split('-')[0].trim() || '',
                max_price: doc.price.split('-')[1].trim() || '',
                modal_price: ''
            }));
            dataDate = "Last Friday";
        }

        res.render('marketplace', { products, dataDate });

    } catch (err) {
        console.error("Failed fetching data:", err);
        res.render('marketplace', { products: [], dataDate: null });
    }
});

// ✅ Only Fridays: update local DB with latest Maharashtra data
router.get('/update-maharashtra', async (req, res) => {
    try {
        // check if today is Friday
        const today = new Date();
        const dayOfWeek = today.getDay(); // Sunday = 0, Friday = 5

        if (dayOfWeek !== 5) {
            return res.send("Today is not Friday. This route only saves data on Fridays.");
        }

        // delete old Friday data
        await Marketplace.deleteMany({});

        // fetch new Friday data
        const response = await axios.get(
            'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
            {
                params: {
                    'api-key': '579b464db66ec23bdd00000194a092a9f1a34aab722223cb63d89b60',
                    'format': 'json',
                    'filters[state.keyword]': 'Maharashtra',
                    'limit': 500,
                    'offset': 0
                }
            }
        );

        const saved = [];
        for (let record of response.data.records) {
            const doc = await Marketplace.create({
                name: record.commodity,
                description: `Market: ${record.market}`,
                crops: [record.commodity],
                location: [record.district],
                price: `₹${record.min_price} - ₹${record.max_price}`,
                contact: 'N/A',
                image: "https://via.placeholder.com/300"
            });
            saved.push(doc);
        }

        res.send(`Saved ${saved.length} records to local database for Friday fallback.`);

    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to fetch or save data');
    }
});

module.exports = router;