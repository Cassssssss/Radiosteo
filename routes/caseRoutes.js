const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// GET all cases
router.get('/', async (req, res) => {
  try {
    const cases = await Case.find({ user: req.userId });
    res.json(cases);
  } catch (error) {
    console.error('Erreur lors de la récupération des cas:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST new case
router.post('/', async (req, res) => {
  const newCase = new Case({
    ...req.body,
    user: req.userId
  });

  try {
    const savedCase = await newCase.save();
    res.status(201).json(savedCase);
  } catch (error) {
    console.error('Erreur lors de la création du cas:', error);
    res.status(400).json({ message: error.message });
  }
});

// GET specific case
router.get('/:id', async (req, res) => {
  try {
    const caseDoc = await Case.findOne({ _id: req.params.id, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }
    res.json(caseDoc);
  } catch (error) {
    console.error('Erreur lors de la récupération du cas:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST new folder to a case
router.post('/:id/folders', async (req, res) => {
  try {
    const caseDoc = await Case.findOne({ _id: req.params.id, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }

    const folderName = req.body.folderName;
    if (!caseDoc.folders.includes(folderName)) {
      caseDoc.folders.push(folderName);
      caseDoc.images[folderName] = [];
    }

    const updatedCase = await caseDoc.save();
    res.json(updatedCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST images to a case
router.post('/:id/images', upload.array('images'), async (req, res) => {
  try {
    const caseDoc = await Case.findOne({ _id: req.params.id, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }

    const folder = req.body.folder;
    const imagePaths = req.files.map(file => file.path);

    if (!caseDoc.images) {
      caseDoc.images = {};
    }

    if (!caseDoc.images[folder]) {
      caseDoc.images[folder] = [];
    }
    caseDoc.images[folder].push(...imagePaths);

    caseDoc.markModified('images');

    const updatedCase = await caseDoc.save();
    res.json(updatedCase);
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'images:', error);
    res.status(400).json({ message: error.message });
  }
});

// POST main image for a case
router.post('/:id/main-image', upload.single('mainImage'), async (req, res) => {
  try {
    const caseDoc = await Case.findOne({ _id: req.params.id, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }

    caseDoc.mainImage = req.file.path;
    const updatedCase = await caseDoc.save();
    res.json(updatedCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST main image for a folder
router.post('/:id/folder-main-image', upload.single('folderMainImage'), async (req, res) => {
  try {
    const caseDoc = await Case.findOne({ _id: req.params.id, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }
    const { folder } = req.body;
    if (!caseDoc.folderMainImages) {
      caseDoc.folderMainImages = {};
    }
    caseDoc.folderMainImages[folder] = req.file.path;
    const updatedCase = await caseDoc.save();
    res.json(updatedCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE image from a case
router.delete('/:id/images', async (req, res) => {
  try {
    const { folder, imagePath } = req.body;
    const caseDoc = await Case.findOne({ _id: req.params.id, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }

    caseDoc.images[folder] = caseDoc.images[folder].filter(img => img !== imagePath);

    caseDoc.markModified('images');

    await caseDoc.save();

    fs.unlink(imagePath, (err) => {
      if (err) console.error('Erreur lors de la suppression du fichier:', err);
    });

    res.json(caseDoc);
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE a case
router.delete('/:id', async (req, res) => {
  try {
    const deletedCase = await Case.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!deletedCase) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }

    for (const folder in deletedCase.images) {
      for (const imagePath of deletedCase.images[folder]) {
        try {
          await fs.promises.unlink(imagePath);
        } catch (err) {
          console.error(`Erreur lors de la suppression de l'image ${imagePath}:`, err);
        }
      }
    }

    res.json({ message: 'Cas supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du cas:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression du cas', error: error.message });
  }
});

// DELETE a folder from a case
router.delete('/:id/folders/:folder', async (req, res) => {
  try {
    const caseDoc = await Case.findOne({ _id: req.params.id, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }

    const folder = req.params.folder;

    caseDoc.folders = caseDoc.folders.filter(f => f !== folder);

    if (caseDoc.images[folder]) {
      for (const imagePath of caseDoc.images[folder]) {
        try {
          await fs.promises.unlink(imagePath);
        } catch (err) {
          console.error(`Erreur lors de la suppression de l'image ${imagePath}:`, err);
        }
      }
      delete caseDoc.images[folder];
    }

    if (caseDoc.folderMainImages && caseDoc.folderMainImages[folder]) {
      try {
        await fs.promises.unlink(caseDoc.folderMainImages[folder]);
      } catch (err) {
        console.error(`Erreur lors de la suppression de l'image principale du dossier ${folder}:`, err);
      }
      delete caseDoc.folderMainImages[folder];
    }

    await caseDoc.save();
    res.json(caseDoc);
  } catch (error) {
    console.error('Erreur lors de la suppression du dossier:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression du dossier', error: error.message });
  }
});

// PATCH update case difficulty
router.patch('/:id', async (req, res) => {
  try {
    const { difficulty, answer, sheet } = req.body;
    const updatedCase = await Case.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { difficulty, answer, sheet },
      { new: true }
    );

    if (!updatedCase) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }

    res.json(updatedCase);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du cas:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du cas', error: error.message });
  }
});

router.patch('/:id/tags', authMiddleware, async (req, res) => {
  try {
    const { tagToAdd, tagToRemove } = req.body;
    const caseDoc = await Case.findOne({ _id: req.params.id, user: req.userId });
    
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }

    if (tagToAdd && !caseDoc.tags.includes(tagToAdd)) {
      caseDoc.tags.push(tagToAdd);
    }

    if (tagToRemove) {
      caseDoc.tags = caseDoc.tags.filter(tag => tag !== tagToRemove);
    }

    await caseDoc.save();
    res.json(caseDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;