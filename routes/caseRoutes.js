const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');

// Configuration de DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

// Configuration de Multer pour l'upload de fichiers
const upload = multer({ storage: multer.memoryStorage() });

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// Fonction utilitaire pour sanitizer le titre du cas
const sanitizeTitle = (title) => {
  return title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

// GET all cases
router.get('/', async (req, res) => {
  try {
    const cases = await Case.find({ user: req.userId });
    console.log('Cas récupérés du serveur:', cases);
    res.json(cases);
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération des cas:', error);
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

    const caseObject = caseDoc.toObject();

    // Convertir `folderMainImages` de Map en objet si nécessaire
    if (caseDoc.folderMainImages instanceof Map) {
      caseObject.folderMainImages = Object.fromEntries(caseDoc.folderMainImages);
    }

    res.json(caseObject);
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

    const { folder } = req.body;
    const sanitizedCaseTitle = sanitizeTitle(caseDoc.title);
    const uploadPromises = req.files.map(file => {
      const caseTitle = caseDoc.title.trim(); // Utilise toujours la casse du titre original
      const params = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: `${caseTitle}/${folder}/${file.originalname}`, // Utilise `caseTitle` au lieu de `caseDoc._id`
        Body: file.buffer,
        ACL: 'public-read'
      };

      return s3.upload(params).promise();
    });

    const results = await Promise.all(uploadPromises);

    if (!caseDoc.images) {
      caseDoc.images = {};
    }

    if (!caseDoc.images[folder]) {
      caseDoc.images[folder] = [];
    }

    caseDoc.images[folder].push(...results.map(result => result.Location));
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

    const folder = sanitizeTitle(caseDoc.title);
    const caseTitle = caseDoc.title.trim();
    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: `${caseTitle}/main-image/${req.file.originalname}`, // Utilise `caseTitle`
      Body: req.file.buffer,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();
    console.log(result.Location);

    caseDoc.mainImage = result.Location;
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
    const folder = req.body.folder; // Le nom du dossier comme "FLAIR"
    
    const caseTitle = caseDoc.title.trim();
    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: `${caseTitle}/${folder}/folder-main-image/${req.file.originalname}`, // Utilise `caseTitle`
      Body: req.file.buffer,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();

    if (!caseDoc.folderMainImages) {
      caseDoc.folderMainImages = {};
    }
    caseDoc.folderMainImages.set(folder, result.Location);

    // Convertir la Map en objet avant de sauvegarder dans MongoDB
    caseDoc.folderMainImages = Object.fromEntries(caseDoc.folderMainImages);
    caseDoc.markModified('folderMainImages');
    
    const updatedCase = await caseDoc.save();
    res.json(updatedCase);
  } catch (error) {
    console.error('Erreur lors de la définition de l\'image principale du dossier:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE image from a case
router.delete('/:id/images', async (req, res) => {
  try {
    const { folder, fileName } = req.body;
    const caseDoc = await Case.findOne({ _id: req.params.id, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }

    if (!caseDoc.images[folder]) {
      return res.status(404).json({ message: 'Dossier non trouvé' });
    }

    const imagePath = `${folder}/${fileName}`;
    const imageIndex = caseDoc.images[folder].findIndex(path => path.endsWith(fileName));
    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image non trouvée' });
    }

    // Suppression de l'image de la base de données
    caseDoc.images[folder].splice(imageIndex, 1);
    caseDoc.markModified('images');
    await caseDoc.save();

    // Suppression de l'image de DigitalOcean Spaces
    const key = `${caseDoc.title}/${imagePath}`;
    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key
    };

    await s3.deleteObject(params).promise();

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

    // Suppression des images de DigitalOcean Spaces
    const folder = sanitizeTitle(deletedCase.title);
    const listParams = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Prefix: `${folder}/`
    };

    try {
      const listedObjects = await s3.listObjectsV2(listParams).promise();
      if (listedObjects.Contents.length > 0) {
        const deleteParams = {
          Bucket: process.env.DO_SPACES_BUCKET,
          Delete: { Objects: [] }
        };

        listedObjects.Contents.forEach(({ Key }) => {
          deleteParams.Delete.Objects.push({ Key });
        });

        await s3.deleteObjects(deleteParams).promise();
      }
    } catch (spaceError) {
      console.error('Erreur lors de la suppression des images dans Spaces:', spaceError);
      // Ne pas bloquer la suppression du cas si la suppression des images échoue
    }

    res.json({ message: 'Cas et images associées supprimés avec succès' });
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
    const sanitizedCaseTitle = sanitizeTitle(caseDoc.title);

    caseDoc.folders = caseDoc.folders.filter(f => f !== folder);

    if (caseDoc.images[folder]) {
      delete caseDoc.images[folder];
    }

    if (caseDoc.folderMainImages && caseDoc.folderMainImages.has(folder)) {
      caseDoc.folderMainImages.delete(folder);
    }

    // Suppression des images du dossier dans DigitalOcean Spaces
    const listParams = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Prefix: `${sanitizedCaseTitle}/${folder}/`
    };

    const listedObjects = await s3.listObjectsV2(listParams).promise();
    if (listedObjects.Contents.length > 0) {
      const deleteParams = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Delete: { Objects: [] }
      };
      listedObjects.Contents.forEach(({ Key }) => {
        deleteParams.Delete.Objects.push({ Key });
      });
      await s3.deleteObjects(deleteParams).promise();
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

router.patch('/:id/tags', async (req, res) => {
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

// POST images for a sheet
router.post('/:id/sheet-images', upload.single('file'), async (req, res) => {
  try {
    const caseDoc = await Case.findOne({ _id: req.params.id, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé.' });
    }

    const caseTitle = caseDoc.title.trim();
    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: `${caseTitle}/fiche/${file.originalname}`,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    };

    const result = await s3.upload(params).promise();

    res.json({ location: result.Location });
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image de la fiche:', error);
    res.status(500).json({ message: 'Erreur lors du téléchargement de l\'image' });
  }
});

// GET sheet for a case
router.get('/:id/sheet', async (req, res) => {
  try {
    const caseDoc = await Case.findOne({ _id: req.params.id, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }
    res.json({ title: caseDoc.title, content: caseDoc.sheet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST update sheet for a case
router.post('/:id/sheet', async (req, res) => {
  try {
    const { title, content } = req.body;
    const caseDoc = await Case.findOne({ _id: req.params.id, user: req.userId });
    if (!caseDoc) {
      return res.status(404).json({ message: 'Cas non trouvé' });
    }
    caseDoc.title = title;
    caseDoc.sheet = content;
    await caseDoc.save();
    res.json({ message: 'Fiche mise à jour avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;