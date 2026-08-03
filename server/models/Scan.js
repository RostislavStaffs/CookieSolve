import mongoose from "mongoose";

const cookieSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    value: {
      type: String,
      default: "",
    },

    domain: {
      type: String,
      default: "",
    },

    path: {
      type: String,
      default: "/",
    },

    expires: {
      type: Number,
      default: -1,
    },

    httpOnly: {
      type: Boolean,
      default: false,
    },

    secure: {
      type: Boolean,
      default: false,
    },

    sameSite: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const networkRequestSchema =
  new mongoose.Schema(
    {
      url: {
        type: String,
        required: true,
      },

      method: {
        type: String,
        default: "GET",
      },

      resourceType: {
        type: String,
        default: "",
      },

      hostname: {
        type: String,
        default: "",
      },

      isThirdParty: {
        type: Boolean,
        default: false,
      },

      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    },
  );

const browserStorageSchema =
  new mongoose.Schema(
    {
      origin: {
        type: String,
        default: "",
      },

      key: {
        type: String,
        required: true,
      },

      value: {
        type: String,
        default: "",
      },

      storageType: {
        type: String,
        enum: [
          "localStorage",
          "sessionStorage",
        ],
        required: true,
      },
    },
    {
      _id: false,
    },
  );

const runtimePhaseSchema =
  new mongoose.Schema(
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
        type: [browserStorageSchema],
        default: [],
      },
    },
    {
      _id: false,
    },
  );

const findingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        "cookie",
        "network",
        "browser-storage",
        "source-code",
      ],
      required: true,
    },

    phase: {
      type: String,
      enum: [
        "pre-consent",
        "post-rejection",
        "source-analysis",
      ],
      required: true,
    },

    type: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["high", "medium", "low"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    evidence: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

const findingsSummarySchema =
  new mongoose.Schema(
    {
      total: {
        type: Number,
        default: 0,
      },

      high: {
        type: Number,
        default: 0,
      },

      medium: {
        type: Number,
        default: 0,
      },

      low: {
        type: Number,
        default: 0,
      },

      cookies: {
        type: Number,
        default: 0,
      },

      network: {
        type: Number,
        default: 0,
      },

      browserStorage: {
        type: Number,
        default: 0,
      },

      preConsent: {
        type: Number,
        default: 0,
      },

      postRejection: {
        type: Number,
        default: 0,
      },
    },
    {
      _id: false,
    },
  );

const legacySummarySchema =
  new mongoose.Schema(
    {
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
      enum: [
        "chromium",
        "firefox",
        "webkit",
      ],
      default: "chromium",
    },

    waitTime: {
      type: Number,
      min: 0,
      max: 30000,
      default: 1500,
    },

    necessaryCookieAllowlist: {
      type: [String],
      default: [],
    },

    scanOptions: {
      cookies: {
        type: Boolean,
        default: true,
      },

      networkRequests: {
        type: Boolean,
        default: true,
      },

      browserStorage: {
        type: Boolean,
        default: true,
      },

      sourceCode: {
        type: Boolean,
        default: false,
      },
    },

    sourceCodeFolder: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "running",
        "completed",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    currentStep: {
      type: String,
      default: "Waiting to start",
    },

    errorMessage: {
      type: String,
      default: "",
    },

    preConsent: {
      type: runtimePhaseSchema,
      default: () => ({}),
    },

    postRejection: {
      type: runtimePhaseSchema,
      default: () => ({}),
    },

    findings: {
      type: [findingSchema],
      default: [],
    },

    findingsSummary: {
      type: findingsSummarySchema,
      default: () => ({}),
    },

    /*
     * Kept temporarily so existing frontend code
     * does not break while we migrate it.
     */
    summary: {
      type: legacySummarySchema,
      default: () => ({}),
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

scanSchema.index({
  user: 1,
  createdAt: -1,
});

const Scan = mongoose.model(
  "Scan",
  scanSchema,
);

export default Scan;