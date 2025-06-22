

const mongoose = require("mongoose");

// Create a separate schema for counter
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Updated Question Schema with questionId
const questionSchema = new mongoose.Schema({
  questionId: {
    type: Number,
    unique: true,
    required: true
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
  },
  correct: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  chapter: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  class: {
    type: String,
    required: true,
  },
  difficultyLevel: {
    type: String,
    required: true,
  },
});

// Export the model directly - simpler approach
const Question = mongoose.model("Question", questionSchema);
module.exports = Question;