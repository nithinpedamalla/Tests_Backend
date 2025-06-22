// In a separate utility file (e.g., counterUtils.js):
async function getNextSequence(name) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: name },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return counter.seq;
  }
  
  module.exports = { getNextSequence };
  