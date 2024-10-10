const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  id: String,
  text: String,
  image: {
    src: String,
    caption: String
  },
  subQuestions: [/* Définition récursive du schéma de question */]
});

const QuestionSchema = new mongoose.Schema({
  id: String,
  text: String,
  type: String,
  image: {
    src: String,
    caption: String
  },
  options: [OptionSchema]
});

const QuestionnaireSchema = new mongoose.Schema({
  title: String,
  questions: [QuestionSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  selectedOptions: mongoose.Schema.Types.Mixed,
  crData: {
    crTexts: mongoose.Schema.Types.Mixed,
    freeTexts: mongoose.Schema.Types.Mixed
  }
});

module.exports = mongoose.model('Questionnaire', QuestionnaireSchema);