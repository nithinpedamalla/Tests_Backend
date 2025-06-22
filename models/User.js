const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "teacher"], required: true },
  results: [
    {
      test_id: String,
      subjects: [String],
      chapters: [String],
      difficulty: String,
      score: Number,
      total: Number,
      timeTaken: Number,
      date: Date,
      questions: [
        {
          question: String,
          options: [String],
          correct: String,
          selected: String,
          description: String,
        },
      ],
    }
  ]
});
module.exports = mongoose.model("User", userSchema);
