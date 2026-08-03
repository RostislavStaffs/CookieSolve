import mongoose from "mongoose";

const cookieSchema = new mongoose.Schema(
  {
    name: String,
    value: String,
    domain: String,
    path: String,
    expires: Number,
    httpOnly: Boolean,
    secure: Boolean,
    sameSite: String,
  },
  {
    _id: false,
  },
);

const networkRequestSchema = new mongoose.Schema(
  {
    url: String,
    method: String,
    resourceType: String,
    hostname: String,
    isThirdParty: Boolean,
    timestamp: Date,
  },
  {
    _id: false,
  },
);

const storageEntrySchema = new mongoose.Schema(
  {
    origin: String,
    key: String,
    value: String,
    storageType: {
      type: String,
      enum: ["localStorage", "sessionStorage"],
    },
  },
  {
    _id: false,
  },
);

const scanPhaseSchema = new mongoose.Schema(
  {
    cookies: {
      type: [cookieSchema],
      default: [],
    },
    networkRequests: {
      type: [networkRequestSchema],
      default: [],
    },
    browserStorage: {
      type: [storageEntrySchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const scanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    targetUrl: {
      type: String,
      required: true,
      trim: true,
    },

    rejectSelector: {
      type: String,
      required: true,
      trim: true,
    },

    browser: {
      type: String,
      enum: ["chromium", "firefox", "webkit"],
      default: "chromium",
    },

    waitTime: {
      type: Number,
      min: 0,
      max: 30000,
      default: 3000,
    },

    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
    },

    currentStep: {
      type: String,
      default: "Preparing scan",
    },

    preConsent: {
      type: scanPhaseSchema,
      default: () => ({}),
    },

    postRejection: {
      type: scanPhaseSchema,
      default: () => ({}),
    },

    summary: {
      cookiesBeforeConsent: {
        type: Number,
        default: 0,
      },
      cookiesAfterRejection: {
        type: Number,
        default: 0,
      },
      thirdPartyRequestsBeforeConsent: {
        type: Number,
        default: 0,
      },
      thirdPartyRequestsAfterRejection: {
        type: Number,
        default: 0,
      },
      issuesDetected: {
        type: Number,
        default: 0,
      },
    },

    errorMessage: {
      type: String,
      default: "",
    },

    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  },
);

const Scan = mongoose.model("Scan", scanSchema);

export default Scan;