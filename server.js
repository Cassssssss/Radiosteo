const express = require('express');
const connectDB = require('./src/utils/db');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Charger les variables d'environnement appropriées
const envFile = process.env.NODE_ENV === 'production' ? '.env.production.backend' : '.env.development.backend';
dotenv.config({ path: path.resolve(__dirname, envFile) });

const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');
const questionnaireRoutes = require('./routes/questionnaireRoutes');
const sheetRoutes = require('./routes/sheetRoutes');
const imageRoutes = require('./routes/imageRoutes');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/questionnaires', questionnaireRoutes);
app.use('/api/cases', sheetRoutes);
app.use('/api', imageRoutes.router);  // Modifié ici

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});