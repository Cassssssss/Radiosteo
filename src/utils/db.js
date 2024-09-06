const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            // Ces options ne sont plus nécessaires dans les versions récentes de Mongoose,
            // mais les laisser ne causera pas de problème
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connecté à MongoDB Atlas');
    } catch (error) {
        console.error('Erreur de connexion à MongoDB:', error);
        // Ne pas quitter le processus permet au serveur de démarrer même si la connexion échoue initialement
    }
};

module.exports = connectDB;