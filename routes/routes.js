// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const XLSX = require("xlsx");

// // Import Models
// //const Question = require("../models/Question");
// const User = require("../models/User");

// // Configure multer
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// const Question = require('../models/Question');
// const { getNextSequence } = require('../utils/counterUtils');

// router.post("/upload", upload.single("file"), async (req, res) => {
//   if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//   try {
//     const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
//     const sheetName = workbook.SheetNames[0];
//     const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     // Get the last used questionId
//     const lastQuestion = await Question.findOne().sort({ questionId: -1 });
//     let nextId = lastQuestion ? lastQuestion.questionId + 1 : 1;

//     const questions = [];
    
//     // Prepare all questions without async/await in the map
//     for (const row of sheetData) {
//       // If questionId is provided in the Excel file, use it; otherwise, assign the next one
//       const questionId = row.QuestionId || nextId++;
      
//       questions.push({
//         questionId,
//         question: row.Question,
//         options: [row.Option1, row.Option2, row.Option3, row.Option4],
//         correct: row.Correct,
//         subject: row.Subject?.toLowerCase().trim() || "",
//         chapter: row.Chapter?.toLowerCase().trim() || "",
//         description: row.Description || "",
//         class: row.Class?.toString().trim() || "",
//         difficultyLevel: row.DifficultyLevel?.trim() || "",
//       });
//     }

//     await Question.insertMany(questions);
//     res.json({ message: "✅ File uploaded and questions saved" });
//   } catch (error) {
//     console.error("Upload error:", error.message);
//     res.status(500).json({ error: "Server error while uploading file: " + error.message });
//   }
// });



// // Get distinct classes
// router.get("/classes", async (req, res) => {
//   try {
//    // console.log("Entered classes Route");
//     const classes = await Question.distinct("class");
//    // console.log("server.js ", classes);
//     res.json(classes.sort());
//   } catch (error) {
//     console.error("Error fetching classes:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Get distinct difficulty levels
// router.get("/difficulties", async (req, res) => {
//   try {
//     const difficulties = await Question.distinct("difficultyLevel");
//     //console.log(difficulties);
//     res.json(difficulties);
//   } catch (error) {
//     console.error("Error fetching difficulties:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Get subjects by class
// router.post("/subjects", async (req, res) => {
//   try {
//     const className = req.body.class.toLowerCase();
//     const subjects = await Question.distinct("subject", { class: className });
//     res.json(subjects);
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Get chapters by class and subjects
// router.post("/chapters", async (req, res) => {
//   try {
//     console.log("Received body:", req.body);

//     const className = req.body.class.toLowerCase();
//     const subjects = req.body.subjects.map((s) => s.toLowerCase());

//     const chapters = await Question.distinct("chapter", {
//       class: className,
//       subject: { $in: subjects },
//     });

//    // console.log("Found chapters:", chapters);

//     res.json(chapters);
//   } catch (error) {
//     console.error("Backend error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });



// router.post("/test", async (req, res) => {
//     try {
//       const { class: className, subjects, chapters, difficulty, limit } = req.body;
      
//       // Base criteria without subject/chapter for more flexible querying
//       const baseCriteria = { class: className };
      
//       // Add difficulty if provided
//       if (difficulty) {
//         baseCriteria.difficultyLevel = difficulty.toLowerCase();
//       }
      
//       // Calculate how many questions to fetch per subject
//       const questionsPerSubject = Math.ceil(parseInt(limit) / subjects.length);
//       let allQuestions = [];
      
//       // First get questions organized by subject
//       for (const subject of subjects) {
//         // Calculate questions per chapter for this subject
//         const questionsPerChapter = Math.ceil(questionsPerSubject / chapters.length);
//         let subjectQuestions = [];
        
//         // Get questions for each chapter within this subject
//         for (const chapter of chapters) {
//           const chapterCriteria = {
//             ...baseCriteria,
//             subject: subject.toLowerCase(),
//             chapter: chapter.toLowerCase()
//           };
          
//           // Get randomized questions for this subject and chapter
//           const chapterQuestions = await Question.aggregate([
//             { $match: chapterCriteria },
//             { $sample: { size: questionsPerChapter } }
//           ]);
          
//           // Add chapter details to each question for sorting later
//           const questionsWithMeta = chapterQuestions.map(q => ({
//             ...q,
//             _meta: { subject, chapter }
//           }));
          
//           subjectQuestions = subjectQuestions.concat(questionsWithMeta);
//         }
        
//         // If we got more questions than needed for this subject, randomly trim
//         if (subjectQuestions.length > questionsPerSubject) {
//           // Shuffle the array first to ensure randomness
//           subjectQuestions = subjectQuestions.sort(() => 0.5 - Math.random());
//           subjectQuestions = subjectQuestions.slice(0, questionsPerSubject);
//         }
        
//         allQuestions = allQuestions.concat(subjectQuestions);
//       }
      
//       // Make sure we don't exceed the total limit
//       if (allQuestions.length > parseInt(limit)) {
//         allQuestions = allQuestions
//           .sort(() => 0.5 - Math.random()) // Shuffle one more time
//           .slice(0, parseInt(limit));
//       }
      
//       // Sort questions by subject and then by chapter
//       allQuestions.sort((a, b) => {
//         // First sort by subject
//         if (a._meta.subject !== b._meta.subject) {
//           return a._meta.subject.localeCompare(b._meta.subject);
//         }
//         // Then sort by chapter
//         return a._meta.chapter.localeCompare(b._meta.chapter);
//       });
      
//       // Remove the metadata before sending
//       const finalQuestions = allQuestions.map(q => {
//         const question = { ...q };
//         delete question._meta;
//         return question;
//       });
      
//       if (finalQuestions.length === 0) {
//         return res.status(404).json({ message: "No questions found" });
//       }
      
//       console.log(`Returning ${finalQuestions.length} questions organized by subject and chapter`);
//       res.json(finalQuestions);
//     } catch (error) {
//       console.error("🔥 Error in /test route:", error);
//       res.status(500).json({ error: "Server error" });
//     }
//   });

// // Get questions by class, subjects, and chapters
// router.post("/questions", async (req, res) => {
//   try {
//     const { class: className, subjects, chapters } = req.body;
    
//     // Validate input
//     if (!className || !subjects || !chapters || !Array.isArray(subjects) || !Array.isArray(chapters)) {
//       return res.status(400).json({ error: "Invalid request parameters" });
//     }
    
//     // Create query to find questions matching any of the selected subjects and chapters
//     const questions = await Question.find({
//       class: className,
//       subject: { $in: subjects },
//       chapter: { $in: chapters }
//     });
    
//     res.json(questions);
//   } catch (error) {
//     console.error("Error fetching questions:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Update question
// router.post("/update-question", async (req, res) => {
//   const { _id, question, options, answer, difficulty, description } = req.body;

//   try {
//     await Question.findByIdAndUpdate(_id, {
//       question,
//       options,
//       answer,
//       difficulty,
//       description,
//     });
//     res.json({ message: "Question updated successfully" });
//   } catch (error) {
//     console.error("Update error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // User signup
// router.post("/signup", async (req, res) => {
//   const { username, password, role } = req.body;
//   //console.log("Signup request body:", req.body);

//   try {
//     const existingUser = await User.findOne({ username });
//     if (existingUser) return res.status(400).json({ error: "Username already exists" });

//     const newUser = new User({ username, password, role });
//     await newUser.save();
//     res.json({ message: "Signup successful" });
//   } catch (err) {
//     console.error("Signup error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // User login
// router.post("/login", async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const user = await User.findOne({ username });
//     if (!user || user.password !== password) {
//       return res.status(401).json({ error: "Invalid username or password" });
//     }

//     res.json({ message: "Login successful", user: { username: user.username, role: user.role, id: user._id } });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// router.get('/questions/:questionId', async (req, res) => {
//     try {
//       const questionId = parseInt(req.params.questionId);
      
//       // Validate that questionId is a number
//       if (isNaN(questionId)) {
//         return res.status(400).json({ error: "Invalid question ID. Must be a number." });
//       }
      
//       const question = await Question.findOne({ questionId });
      
//       if (!question) {
//         return res.status(404).json({ error: "Question not found" });
//       }
      
//       res.json(question);
//     } catch (error) {
//       console.error("Error fetching question by ID:", error);
//       res.status(500).json({ error: "Server error while fetching question" });
//     }
//   });

// // Submit test result
// router.post("/submit-result", async (req, res) => {
//   const { userId, result } = req.body;

//   if (!userId || !result) {
//     return res.status(400).json({ error: "Missing userId or result data" });
//   }

//   try {
//     const user = await User.findById(userId);
//     if (!user || user.role !== "student") {
//       return res.status(404).json({ error: "Student not found or invalid role" });
//     }

//     user.results.push(result);
//     await user.save();

//     res.json({ message: "✅ Result saved successfully" });
//   } catch (err) {
//     console.error("Submit result error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Get user results
// router.get("/results/:userId", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId);

//     if (!user) {
//       console.log("User not found");
//       return res.status(404).json({ error: "User not found" });
//     }

//     if (user.role !== "student") {
//       console.log("User is not a student:", user.role);
//       return res.status(404).json({ error: "Not a student" });
//     }

//     res.json(user.results);
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Add a new question
// router.post("/questions/add", async (req, res) => {
//   try {
//     const {
//       question,
//       options,
//       correct,
//       subject,
//       chapter,
//       description,
//       class: classValue,
//       difficultyLevel
//     } = req.body;
    
//     // Validate required fields
//     if (!question || !options || !correct || !subject || !chapter || !classValue || !difficultyLevel) {
//       return res.status(400).json({ message: "All required fields must be provided" });
//     }
    
//     // Create new question
//     const newQuestion = new Question({
//       question,
//       options,
//       correct,
//       subject,
//       chapter,
//       description,
//       class: classValue,
//       difficultyLevel
//     });
    
//     // Save to database
//     const savedQuestion = await newQuestion.save();
    
//     res.status(201).json(savedQuestion);
//   } catch (error) {
//     console.error("Error adding question:", error);
//     res.status(500).json({ message: "Server error while adding question" });
//   }
// });

// // Update an existing question
// router.put("/questions/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       question,
//       options,
//       correct,
//       subject,
//       chapter,
//       description,
//       class: classValue,
//       difficultyLevel
//     } = req.body;
    
//     // Validate required fields
//     if (!question || !options || !correct || !subject || !chapter || !classValue || !difficultyLevel) {
//       return res.status(400).json({ message: "All required fields must be provided" });
//     }
    
//     // Find and update question
//     const updatedQuestion = await Question.findByIdAndUpdate(
//       id,
//       {
//         question,
//         options,
//         correct,
//         subject,
//         chapter,
//         description,
//         class: classValue,
//         difficultyLevel
//       },
//       { new: true } // Return the updated document
//     );
    
//     if (!updatedQuestion) {
//       return res.status(404).json({ message: "Question not found" });
//     }
    
//     res.status(200).json(updatedQuestion);
//   } catch (error) {
//     console.error("Error updating question:", error);
//     res.status(500).json({ message: "Server error while updating question" });
//   }
// });

// // Delete a question
// router.delete("/questions/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // Find and delete question
//     const deletedQuestion = await Question.findByIdAndDelete(id);
    
//     if (!deletedQuestion) {
//       return res.status(404).json({ message: "Question not found" });
//     }
    
//     res.status(200).json({ message: "Question deleted successfully", deletedQuestion });
//   } catch (error) {
//     console.error("Error deleting question:", error);
//     res.status(500).json({ message: "Server error while deleting question" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const XLSX = require("xlsx");

// Import Models
const User = require("../models/User");

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

const Question = require('../models/Question');
const { getNextSequence } = require('../utils/counterUtils');
const logger = {
  error: (message, data) => console.error(`[ERROR] ${message}`, data || ''),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data || ''),
  info: (message, data) => console.info(`[INFO] ${message}`, data || ''),
  debug: (message, data) => console.debug(`[DEBUG] ${message}`, data || '')
};// Assuming a logger utility exists

// router.post("/upload", upload.single("file"), async (req, res) => {
//   if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//   try {
//     const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
//     const sheetName = workbook.SheetNames[0];
//     const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     // Get the last used questionId
//     const lastQuestion = await Question.findOne().sort({ questionId: -1 });
//     let nextId = lastQuestion ? lastQuestion.questionId + 1 : 1;

//     const questions = [];
    
//     // Prepare all questions without async/await in the map
//     for (const row of sheetData) {
//       // If questionId is provided in the Excel file, use it; otherwise, assign the next one
//       const questionId = row.QuestionId || nextId++;
      
//       questions.push({
//         questionId,
//         question: row.Question,
//         options: [row.Option1, row.Option2, row.Option3, row.Option4],
//         correct: row.Correct,
//         subject: row.Subject?.toLowerCase().trim() || "",
//         chapter: row.Chapter?.toLowerCase().trim() || "",
//         description: row.Description || "",
//         class: row.Class?.toString().trim() || "",
//         difficultyLevel: row.DifficultyLevel?.trim() || "",
//       });
//     }

//     await Question.insertMany(questions);
//     res.json({ message: "✅ File uploaded and questions saved" });
//   } catch (error) {
//     logger.error("Upload error:", error.message);
//     res.status(500).json({ error: "Server error while uploading file: " + error.message });
//   }
// });

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Get the last used questionId
    const lastQuestion = await Question.findOne().sort({ questionId: -1 });
    let nextId = lastQuestion ? lastQuestion.questionId + 1 : 1;

    const questions = [];
    const newQuestions = [];
    const duplicates = [];
    
    // Prepare all questions without async/await in the map
    for (const row of sheetData) {
      // If questionId is provided in the Excel file, use it; otherwise, assign the next one
      const questionId = row.QuestionId || nextId;
      
      const questionData = {
        questionId,
        question: row.Question,
        options: [row.Option1, row.Option2, row.Option3, row.Option4],
        correct: row.Correct,
        subject: row.Subject?.toLowerCase().trim() || "",
        chapter: row.Chapter?.toLowerCase().trim() || "",
        description: row.Description || "",
        class: row.Class?.toString().trim() || "",
        difficultyLevel: row.DifficultyLevel?.trim() || "",
      };
      
      // Check if question already exists (by text content)
      const existingQuestion = await Question.findOne({ question: row.Question });
      
      if (existingQuestion) {
        // Add to duplicates list
        duplicates.push(row.Question);
      } else {
        // Add to new questions list and increment ID for next question
        newQuestions.push(questionData);
        nextId++;
      }
    }

    // Only insert non-duplicate questions
    if (newQuestions.length > 0) {
      await Question.insertMany(newQuestions);
    }
    
    res.json({ 
      message: `✅ File processed successfully. ${newQuestions.length} questions added.`,
      duplicates: duplicates.length > 0 ? `${duplicates.length} duplicate questions were skipped.` : "No duplicates found.",
      total: sheetData.length
    });
  } catch (error) {
    logger.error("Upload error:", error.message);
    res.status(500).json({ error: "Server error while uploading file: " + error.message });
  }
});

// Get distinct classes
router.get("/classes", async (req, res) => {
  try {
    logger.info("Fetching distinct classes");
    const classes = await Question.distinct("class");
    logger.debug("Found classes", { classes });
    res.json(classes.sort());
  } catch (error) {
    logger.error("Error fetching classes:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get distinct difficulty levels
router.get("/difficulties", async (req, res) => {
  try {
    logger.info("Fetching difficulty levels");
    const difficulties = await Question.distinct("difficultyLevel");
    logger.debug("Found difficulties", { difficulties });
    res.json(difficulties);
  } catch (error) {
    logger.error("Error fetching difficulties:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get subjects by class
router.post("/subjects", async (req, res) => {
  try {
    const className = req.body.class.toLowerCase();
    logger.info(`Fetching subjects for class: ${className}`);
    const subjects = await Question.distinct("subject", { class: className });
    logger.debug(`Found subjects for class ${className}`, { subjects });
    res.json(subjects);
  } catch (error) {
    logger.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get chapters by class and subjects
router.post("/chapters", async (req, res) => {
  try {
    logger.info("Received request for chapters", { body: req.body });

    const className = req.body.class.toLowerCase();
    const subjects = req.body.subjects.map((s) => s.toLowerCase());

    const chapters = await Question.distinct("chapter", {
      class: className,
      subject: { $in: subjects },
    });

    logger.debug("Found chapters", { count: chapters.length, chapters });
    res.json(chapters);
  } catch (error) {
    logger.error("Backend error in chapters route:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/test", async (req, res) => {
    try {
      const { class: className, subjects, chapters, difficulty, limit } = req.body;
      logger.info("Generating test", { className, subjectsCount: subjects.length, chaptersCount: chapters.length, difficulty, limit });
      
      // Base criteria without subject/chapter for more flexible querying
      const baseCriteria = { class: className };
      
      // Add difficulty if provided
      if (difficulty) {
        baseCriteria.difficultyLevel = difficulty.toLowerCase();
      }
      
      // Calculate how many questions to fetch per subject
      const questionsPerSubject = Math.ceil(parseInt(limit) / subjects.length);
      let allQuestions = [];
      
      // First get questions organized by subject
      for (const subject of subjects) {
        // Calculate questions per chapter for this subject
        const questionsPerChapter = Math.ceil(questionsPerSubject / chapters.length);
        let subjectQuestions = [];
        
        // Get questions for each chapter within this subject
        for (const chapter of chapters) {
          const chapterCriteria = {
            ...baseCriteria,
            subject: subject.toLowerCase(),
            chapter: chapter.toLowerCase()
          };
          
          // Get randomized questions for this subject and chapter
          const chapterQuestions = await Question.aggregate([
            { $match: chapterCriteria },
            { $sample: { size: questionsPerChapter } }
          ]);
          
          // Add chapter details to each question for sorting later
          const questionsWithMeta = chapterQuestions.map(q => ({
            ...q,
            _meta: { subject, chapter }
          }));
          
          subjectQuestions = subjectQuestions.concat(questionsWithMeta);
        }
        
        // If we got more questions than needed for this subject, randomly trim
        if (subjectQuestions.length > questionsPerSubject) {
          // Shuffle the array first to ensure randomness
          subjectQuestions = subjectQuestions.sort(() => 0.5 - Math.random());
          subjectQuestions = subjectQuestions.slice(0, questionsPerSubject);
        }
        
        allQuestions = allQuestions.concat(subjectQuestions);
      }
      
      // Make sure we don't exceed the total limit
      if (allQuestions.length > parseInt(limit)) {
        allQuestions = allQuestions
          .sort(() => 0.5 - Math.random()) // Shuffle one more time
          .slice(0, parseInt(limit));
      }
      
      // Sort questions by subject and then by chapter
      allQuestions.sort((a, b) => {
        // First sort by subject
        if (a._meta.subject !== b._meta.subject) {
          return a._meta.subject.localeCompare(b._meta.subject);
        }
        // Then sort by chapter
        return a._meta.chapter.localeCompare(b._meta.chapter);
      });
      
      // Remove the metadata before sending
      const finalQuestions = allQuestions.map(q => {
        const question = { ...q };
        delete question._meta;
        return question;
      });
      
      if (finalQuestions.length === 0) {
        logger.warn("No questions found for the given criteria");
        return res.status(404).json({ message: "No questions found" });
      }
      
      logger.info(`Returning ${finalQuestions.length} questions organized by subject and chapter`);
      res.json(finalQuestions);
    } catch (error) {
      logger.error("Error in /test route:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

// Get questions by class, subjects, and chapters
router.post("/questions", async (req, res) => {
  try {
    const { class: className, subjects, chapters } = req.body;
    logger.info("Fetching questions", { className, subjects, chapters });
    
    // Validate input
    if (!className || !subjects || !chapters || !Array.isArray(subjects) || !Array.isArray(chapters)) {
      logger.warn("Invalid request parameters for questions route");
      return res.status(400).json({ error: "Invalid request parameters" });
    }
    
    // Create query to find questions matching any of the selected subjects and chapters
    const questions = await Question.find({
      class: className,
      subject: { $in: subjects },
      chapter: { $in: chapters }
    });
    
    logger.debug(`Found ${questions.length} questions`);
    res.json(questions);
  } catch (error) {
    logger.error("Error fetching questions:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update question
router.post("/update-question", async (req, res) => {
  const { _id, question, options, answer, difficulty, description } = req.body;
  logger.info("Updating question", { _id });

  try {
    await Question.findByIdAndUpdate(_id, {
      question,
      options,
      answer,
      difficulty,
      description,
    });
    logger.info("Question updated successfully", { _id });
    res.json({ message: "Question updated successfully" });
  } catch (error) {
    logger.error("Update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// User signup
router.post("/signup", async (req, res) => {
  const { username, password, role } = req.body;
  logger.info("Processing signup request", { username, role });

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      logger.warn("Signup failed - username already exists", { username });
      return res.status(400).json({ error: "Username already exists" });
    }

    const newUser = new User({ username, password, role });
    await newUser.save();
    logger.info("Signup successful", { username, role });
    res.json({ message: "Signup successful" });
  } catch (err) {
    logger.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// User login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  logger.info("Processing login request", { username });

  try {
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      logger.warn("Login failed - invalid credentials", { username });
      return res.status(401).json({ error: "Invalid username or password" });
    }

    logger.info("Login successful", { username, role: user.role });
    res.json({ message: "Login successful", user: { username: user.username, role: user.role, id: user._id } });
  } catch (err) {
    logger.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get('/questions/:questionId', async (req, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      logger.info("Fetching question by ID", { questionId });
      
      // Validate that questionId is a number
      if (isNaN(questionId)) {
        logger.warn("Invalid question ID format", { questionId: req.params.questionId });
        return res.status(400).json({ error: "Invalid question ID. Must be a number." });
      }
      
      const question = await Question.findOne({ questionId });
      
      if (!question) {
        logger.warn("Question not found", { questionId });
        return res.status(404).json({ error: "Question not found" });
      }
      
      logger.debug("Found question", { questionId, question: question._id });
      res.json(question);
    } catch (error) {
      logger.error("Error fetching question by ID:", error);
      res.status(500).json({ error: "Server error while fetching question" });
    }
  });

// Submit test result
router.post("/submit-result", async (req, res) => {
  const { userId, result } = req.body;
  logger.info("Processing test result submission", { userId });

  if (!userId || !result) {
    logger.warn("Missing data in result submission", { userId, hasResult: !!result });
    return res.status(400).json({ error: "Missing userId or result data" });
  }

  try {
    const user = await User.findById(userId);
    if (!user || user.role !== "student") {
      logger.warn("Invalid user for result submission", { userId, userFound: !!user, role: user?.role });
      return res.status(404).json({ error: "Student not found or invalid role" });
    }

    user.results.push(result);
    await user.save();

    logger.info("Test result saved successfully", { userId, resultId: result.test_id });
    res.json({ message: "✅ Result saved successfully" });
  } catch (err) {
    logger.error("Submit result error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user results
router.get("/results/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    logger.info("Fetching results for user", { userId });
    
    const user = await User.findById(userId);

    if (!user) {
      logger.warn("User not found when fetching results", { userId });
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "student") {
      logger.warn("Non-student attempting to access results", { userId, role: user.role });
      return res.status(404).json({ error: "Not a student" });
    }

    logger.debug("Found results for user", { userId, resultsCount: user.results.length });
    res.json(user.results);
  } catch (err) {
    logger.error("Error fetching user results:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add a new question
router.post("/questions/add", async (req, res) => {
  try {
    const {
      question,
      options,
      correct,
      subject,
      chapter,
      description,
      class: classValue,
      difficultyLevel
    } = req.body;
    
    logger.info("Adding new question", { subject, chapter, class: classValue });
    
    // Validate required fields
    if (!question || !options || !correct || !subject || !chapter || !classValue || !difficultyLevel) {
      logger.warn("Missing required fields in question add request");
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    
    // Create new question
    const newQuestion = new Question({
      question,
      options,
      correct,
      subject,
      chapter,
      description,
      class: classValue,
      difficultyLevel
    });
    
    // Save to database
    const savedQuestion = await newQuestion.save();
    
    logger.info("Question added successfully", { questionId: savedQuestion._id });
    res.status(201).json(savedQuestion);
  } catch (error) {
    logger.error("Error adding question:", error);
    res.status(500).json({ message: "Server error while adding question" });
  }
});

// Update an existing question
router.put("/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    logger.info("Updating question", { id });
    
    const {
      question,
      options,
      correct,
      subject,
      chapter,
      description,
      class: classValue,
      difficultyLevel
    } = req.body;
    
    // Validate required fields
    if (!question || !options || !correct || !subject || !chapter || !classValue || !difficultyLevel) {
      logger.warn("Missing required fields in question update", { id });
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    
    // Find and update question
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      {
        question,
        options,
        correct,
        subject,
        chapter,
        description,
        class: classValue,
        difficultyLevel
      },
      { new: true } // Return the updated document
    );
    
    if (!updatedQuestion) {
      logger.warn("Question not found for update", { id });
      return res.status(404).json({ message: "Question not found" });
    }
    
    logger.info("Question updated successfully", { id });
    res.status(200).json(updatedQuestion);
  } catch (error) {
    logger.error("Error updating question:", error);
    res.status(500).json({ message: "Server error while updating question" });
  }
});

// Delete a question
router.delete("/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    logger.info("Deleting question", { id });
    
    // Find and delete question
    const deletedQuestion = await Question.findByIdAndDelete(id);
    
    if (!deletedQuestion) {
      logger.warn("Question not found for deletion", { id });
      return res.status(404).json({ message: "Question not found" });
    }
    
    logger.info("Question deleted successfully", { id });
    res.status(200).json({ message: "Question deleted successfully", deletedQuestion });
  } catch (error) {
    logger.error("Error deleting question:", error);
    res.status(500).json({ message: "Server error while deleting question" });
  }
});

module.exports = router;