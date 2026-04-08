export type AthleteSeedRecord = {
  externalKey: string;
  name: string;
  gender?: string;
  region?: string;
  organization?: string;
  level: string;
  certificateNo?: string;
  sport?: string;
  certifiedAt?: string;
  sourceName: string;
  sourceUrl?: string;
  sourceType?: string;
  dataStatus?: string;
  providerKey?: string;
};

export type UserRole = "ADMIN";
export type EventStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type UploadStatus = "PENDING" | "NEEDS_MAPPING" | "PROCESSED" | "FAILED";
export type VerificationStatus = "PASSED" | "RISK" | "NOT_FOUND" | "REVIEW";
export type RiskCategory = "CLEAR" | "HIGH" | "UNKNOWN" | "REVIEW";
export type HistoryAction = "delete" | "archive";
export type BatchAuditAction = "DELETE" | "ARCHIVE" | "DELETE_BLOCKED";
export type HistoryRiskFilter = "all" | "risk" | "review" | "clear";
export type HistoryView = "active" | "archived" | "deleted" | "all";

export type AthleteSearchSourceMode = "public_realtime" | "mock_demo";

export type AthleteSearchRecord = {
  id: string;
  name: string;
  gender: string | null;
  region: string | null;
  organization: string | null;
  level: string;
  certificateNo: string | null;
  awardDate: string | null;
  sport: string | null;
  sourceName: string;
  sourceUrl: string | null;
  sourceMode: AthleteSearchSourceMode;
  sourceLabel: string;
  sourceNote: string;
  recordStatus: string;
};

export type AthleteSearchResponse = {
  provider: AthleteSearchSourceMode;
  sourceSummary: string;
  fallbackUsed: boolean;
  warningMessage: string;
  hintMessage: string;
  results: AthleteSearchRecord[];
};

export type ParsedRosterRow = Record<string, string>;

export type UploadParseResult = {
  columns: string[];
  rows: ParsedRosterRow[];
  previewRows: ParsedRosterRow[];
  detectedNameColumn: string | null;
  fileType: string;
};

export type HistoryBatchListItem = {
  id: string;
  eventId: string;
  originalFileName: string;
  fileType: string;
  status: string;
  totalRows: number;
  processedRows: number;
  matchedRows: number;
  riskRows: number;
  unresolvedRows: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  archivedAt: string | null;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    name: string;
    organizerName: string;
  };
};

export type EventFormValues = {
  name: string;
  organizerName: string;
  eventDate: string;
  notes: string;
};

export type EventEditableSummary = {
  id: string;
  name: string;
  organizerName: string;
  eventDate: string;
  notes: string;
  updatedAt?: string;
};
