const express = require('express');
const router = express.Router();
const multer = require('multer');
const s3 = require('../src/utils/spacesConfig');
const authMiddleware = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-image', authMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Aucun fichier n\'a été téléchargé.');
  }

  const folderName = req.body.questionnaireTitle || 'default';
  // Conserve les majuscules et remplace les caractères non alphanumériques par des underscores
  const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9]/g, '_');

  const fileName = `${Date.now()}-${req.file.originalname}`;

  const params = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: `${sanitizedFolderName}/${fileName}`,
    Body: req.file.buffer,
    ACL: 'public-read',
    ContentType: req.file.mimetype,
  };

  try {
    const result = await s3.upload(params).promise();
    res.json({ imageUrl: result.Location });
  } catch (error) {
    console.error('Erreur lors du téléchargement vers DigitalOcean Spaces:', error);
    res.status(500).send('Erreur lors du téléchargement de l\'image');
  }
});

// Route pour récupérer une image (si nécessaire)
router.get('/:folderName/:fileName', (req, res) => {
  const { folderName, fileName } = req.params;
  const params = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: `${folderName}/${fileName}`,
  };

  s3.getObject(params, (err, data) => {
    if (err) {
      console.error('Erreur lors de la récupération de l\'image:', err);
      return res.status(404).send('Image non trouvée');
    }
    res.setHeader('Content-Type', data.ContentType);
    res.send(data.Body);
  });
});

// Route pour supprimer une image (si nécessaire)
router.delete('/:folderName/:fileName', authMiddleware, (req, res) => {
  const { folderName, fileName } = req.params;
  const params = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: `${folderName}/${fileName}`,
  };

  s3.deleteObject(params, (err, data) => {
    if (err) {
      console.error('Erreur lors de la suppression de l\'image:', err);
      return res.status(500).send('Erreur lors de la suppression de l\'image');
    }
    res.status(200).send('Image supprimée avec succès');
  });
});

// Fonction pour supprimer une image de Spaces
const deleteImageFromSpaces = async (folderName, fileName) => {
  const params = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: `${folderName}/${fileName}`,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`Image supprimée avec succès: ${folderName}/${fileName}`);
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'image ${folderName}/${fileName}:`, error);
    throw error;
  }
};

module.exports = {
  router,
  deleteImageFromSpaces
};