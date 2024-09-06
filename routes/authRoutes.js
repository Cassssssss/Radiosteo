const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  console.log('Tentative d\'inscription:', req.body);
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    console.log('Utilisateur inscrit avec succès:', username);
    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(400).json({ message: "Erreur lors de l'inscription", error: error.message });
  }
});

router.post('/login', async (req, res) => {
  console.log('Tentative de connexion:', req.body);
  try {
    const { username, password } = req.body;
    console.log('Recherche de l\'utilisateur:', username);
    const user = await User.findOne({ username });
    if (!user) {
      console.log('Utilisateur non trouvé:', username);
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    console.log('Utilisateur trouvé, vérification du mot de passe');
    const isMatch = await user.comparePassword(password);
    console.log('Mot de passe correct ?', isMatch);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    console.log('Génération du token JWT');
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      res.json({ token, userId: user._id });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
      }
    });

module.exports = router;