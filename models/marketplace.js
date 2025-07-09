const mongoose = require('mongoose');

const marketplaceSchema = new mongoose.Schema({
  name: String,
  description: String,
  crops: [String],
  location: [String],
  price: String,
  contact: String,
  image: String
});

const Marketplace = mongoose.model('Marketplace', marketplaceSchema);

module.exports = Marketplace;