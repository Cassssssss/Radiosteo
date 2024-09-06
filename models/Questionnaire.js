const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  id: String,
  text: String,
  type: String,
  options: [{
    id: String,
    text: String,
    subQuestions: [this] // Permet des sous-questions récursives
  }],
  image: {
    src: String,
    caption: String
  }
});

const QuestionnaireSchema = new mongoose.Schema({
  title: String,
  questions: [QuestionSchema],
  selectedOptions: mongoose.Schema.Types.Mixed,
  crData: {
    crTexts: mongoose.Schema.Types.Mixed,
    freeTexts: mongoose.Schema.Types.Mixed
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Questionnaire', QuestionnaireSchema);