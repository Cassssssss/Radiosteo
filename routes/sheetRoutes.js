const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Détermination du chemin de stockage pour le fichier');
        const uploadPath = path.join(__dirname, '..', 'uploads');
        console.log('Chemin de stockage:', uploadPath);
        if (!fs.existsSync(uploadPath)) {
            console.log('Création du dossier uploads');
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        console.log('Détermination du nom du fichier:', file);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.use(authMiddleware);

// Récupérer la fiche d'un cas
router.get('/:caseId/sheet', async (req, res) => {
  try {
    const caseDoc = await Case.findOne({ _id: req.params.caseId, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }
    res.json({ content: caseDoc.sheet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer ou mettre à jour la fiche d'un cas
router.post('/:caseId/sheet', async (req, res) => {
  try {
    const caseDoc = await Case.findOne({ _id: req.params.caseId, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }
    caseDoc.sheet = req.body.content;
    await caseDoc.save();
    res.json({ message: 'Fiche sauvegardée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ajouter une image à la fiche
router.post('/:caseId/images', (req, res, next) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  next();
}, upload.single('file'), (req, res) => {
    console.log('Requête reçue pour ajouter une image');
    console.log('Fichier reçu:', req.file);
    console.log('Corps de la requête:', req.body);

    if (!req.file) {
        console.log('Aucun fichier reçu');
        return res.status(400).json({ message: 'Aucun fichier reçu.' });
    }

    console.log('Fichier sauvegardé:', req.file.path);
    const fileUrl = `/uploads/${req.file.filename}`;
    console.log('URL du fichier:', fileUrl);

    res.json({ location: fileUrl });
});

module.exports = router;