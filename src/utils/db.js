const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Connexion à MongoDB sans les options dépréciées
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connecté à MongoDB Atlas');
    } catch (error) {
        console.error('Erreur de connexion à MongoDB:', error);
    }
};

module.exports = connectDB;
