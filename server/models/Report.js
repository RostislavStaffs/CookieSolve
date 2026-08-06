import mongoose from "mongoose";

const reportSchema =
  new mongoose.Schema(
    {
      user: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      scan: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "Scan",
        required: true,
        index: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      format: {
        type: String,
        enum: [
          "html",
          "json",
        ],
        required: true,
      },

      target: {
        type: String,
        required: true,
        trim: true,
      },

      scanMode: {
        type: String,
        enum: [
          "runtime",
          "source-code",
          "hybrid",
        ],
        default: "runtime",
      },

      status: {
        type: String,
        enum: [
          "passed",
          "warning",
          "failed",
        ],
        required: true,
      },

      findingCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      highSeverityCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      mediumSeverityCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      lowSeverityCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      exportedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
    },
    {
      timestamps: true,
    },
  );

reportSchema.index({
  user: 1,
  exportedAt: -1,
});

reportSchema.index({
  user: 1,
  scan: 1,
});

const Report = mongoose.model(
  "Report",
  reportSchema,
);

export default Report;