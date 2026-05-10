// Typed ALIS backend client (axios). All endpoints from the API brief.
import { httpGet, httpPost, httpPut, httpDelete, httpPatch, http, AlisApiError } from "./http";
import { getApiBaseUrl } from "./api";
import { getStoredSession } from "./auth";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type DocumentStatus =
  | "PENDING"
  | "PROCESSING"
  | "EXTRACTED"
  | "ANALYZED"
  | "FAILED"
  | string;
export type AnalysisStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | string;

// ---------- Types ----------
export interface DocumentItem {
  documentId: number;
  title: string;
  status: DocumentStatus;
  ingestionSource?: string;
  uploadedAt: string;
  filePath?: string;
  fileUrl?: string;
  clientId: number;
  riskLevel?: RiskLevel;
  similarityScore?: number;
  reportId?: number;
}

export interface UploadResponse {
  message: string;
  documentId: number;
  title: string;
  status: DocumentStatus;
  fileUrl?: string;
}

export interface ComplianceStatus {
  documentId: number;
  title: string;
  documentStatus: DocumentStatus;
  analysisStatus?: AnalysisStatus;
  riskLevel?: RiskLevel;
  similarityScore?: number;
  reportId?: number;
  reportReady: boolean;
  message?: string;
}

export interface ReportInfo {
  reportId: number;
  documentId: number;
  documentTitle: string;
  clientId: number;
  clientName?: string;
  riskLevel: RiskLevel;
  analysisStatus: AnalysisStatus;
  similarityScore: number;
  aiRecommendation: string;
  aiExplanation: string;
  generatedAt: string;
  modelVersion?: string;
  lawRuleId?: number;
  lawRuleKeyword?: string;
  actName?: string;
}

export interface Rule {
  ruleId: number;
  actId: number;
  actName?: string;
  keyword: string;
  requirements: string;
  riskLevel: RiskLevel;
  suggestion: string;
  edited?: boolean;
}

export interface RuleCreate {
  actId: number;
  keyword: string;
  requirements: string;
  riskLevel: RiskLevel;
  suggestion: string;
}

export interface RuleUpdate {
  requirements?: string;
  riskLevel?: RiskLevel;
  suggestion?: string;
  keyword?: string;
}

export interface ClientRecord {
  clientId: number;
  fullName: string;
  email: string;
  role: import("./auth").Role;
  active?: boolean;
  createdAt?: string;          // ← backend sends this
  registeredAt?: string;       // keep for backward compatibility (other endpoints might use it)
  documentCount?: number;      // still optional; the /by-role endpoint doesn't send it
  documentsUploaded?: number;
  username?: string;           // backend also includes this
  companyName?: string | null;
  dealSpecialty?: string | null;
  barNumber?: string | null;
  lawFirm?: string | null;
}

// Correctly matches the real GET /api/admin/dashboard response
export interface AdminDashboard {
  stats: {
    totalClients: number;
    totalDocuments: number;
    totalReports: number;
    activeClients: number;
    pendingDocuments: number;
    failedDocuments: number;
    processedDocuments: number;
    highRiskReports: number;
  };
  clients: Array<{
    clientId: number;
    fullName: string;
    email: string;
    role: string;
    registeredAt: string;
    documentCount: number;
    recentDocuments: null | unknown;
  }>;
  recentDocuments: Array<{
    documentId: number;
    title: string;
    status: string;
    ingestionSource: string;
    uploadedAt: string;
    filePath: string;
    fileUrl: string;
    clientId: number;
    clientName: string;
  }>;
  reports: Array<{
    reportId: number;
    documentId: number;
    documentTitle: string;
    clientId: number | null;
    clientName: string | null;
    riskLevel: string;
    analysisStatus: string;
    similarityScore: null | number;
    aiRecommendation: string;
    aiExplanation: null | string;
    generatedAt: string;
    modelVersion: string;
    lawRuleId: null | number;
    lawRuleKeyword: null | string;
    actName: null | string;
  }>;
  roleDistribution: Array<{ role: string; count: number }>;
  riskDistribution: Array<{ riskLevel: string; count: number }>;
  uploadTrend: Array<{ year: number; month: number; count: number; label: string }>;
}

export interface AuditEntry {
  logId: number;
  createdAt: string;        // ← correct field
  actionType: string;
  description: string;
  clientId?: number;
  documentId?: number;
  ipAddress?: string;
  clientName?: string;
  adminId?: number | null;
}

export interface RoleDistributionRow {
  role: string;
  count: number;
  percentage?: number;
}
export interface RoleDistributionResponse {
  countByRole: Record<string, number>;
  totalClients: number;
}

export interface RegistrationTrendRow {
  month: string;
  count: number;
}
export interface RegistrationTrendResponse {
    trend: Array<{
    year: number;
    month: number;   // 1‑12
    count: number;
  }>;
}

export interface TopUploaderRow {
  rank?: number;
  clientId?: number;
  fullName: string;
  email: string;
  role: string;
  documentsUploaded?: number;
  count?: number;
}
export interface TopUploaderResponse {
  content: Array<{
    clientId: number;
    fullName: string;
    email: string;
    role: string;
    documentCount: number;
  }>;
  totalElements: number;
  totalPages: number;
  // …other pageable fields
}

export interface PagedClients {
  content?: ClientRecord[];
  items?: ClientRecord[];
  totalPages?: number;
  totalElements?: number;
  number?: number;
  size?: number;
}

export interface ClientFilter {
  searchQuery?: string;
  role?: string | null;
  registeredFrom?: string | null;
  registeredTo?: string | null;
}
export interface ClientProfile {
  clientId?: number;
  fullName: string;
  email: string;
  username?: string;
  role?: string;
  createdAt?: string;
  active?: boolean;
  deactivatedAt?: string | null;
  barNumber?: string | null;
  lawFirm?: string | null;
  companyName?: string | null;
  dealSpecialty?: string | null;
}
export interface UpdateProfileRequest {
  fullName?: string;
  username?: string;
  currentPassword?: string;  // added
  newPassword?: string;      // added
  barNumber?: string | null;
  lawFirm?: string | null;
  companyName?: string | null;
  dealSpecialty?: string | null;
}
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SpecialistAccountInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LegalPractitionerInput extends SpecialistAccountInput {
  barNumber: string;
  lawFirm: string;
}

export interface DealMakerInput extends SpecialistAccountInput {
  companyName: string;
  dealSpecialty: string;
}

// ---------- Documents ----------
export const listDocuments = () => httpGet<DocumentItem[]>("/api/client/documents");
export const getDocument = (id: number) => httpGet<DocumentItem>(`/api/client/documents/${id}`);
export const getDocumentReports = (id: number) =>
  httpGet<ReportInfo[]>(`/api/client/documents/${id}/reports`);
export const updateDocument = (id: number, title: string) =>
  httpPatch<DocumentItem>(`/api/client/documents/${id}`, { title });
export const deleteDocument = (id: number) =>
  httpDelete<{ message?: string }>(`/api/client/documents/${id}`);

function getDownloadFileName(res: Response, fallback: string): string {
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1] ?? fallback;
}

async function fetchProtectedBlob(path: string, fallbackName: string): Promise<{ blob: Blob; fileName: string }> {
  const session = getStoredSession();
  const res = await fetch(`${getApiBaseUrl().replace(/\/+$/, "")}${path}`, {
    headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
  });
  if (!res.ok) throw new AlisApiError(res.status, `Download failed (${res.status})`);
  return {
    blob: await res.blob(),
    fileName: getDownloadFileName(res, fallbackName),
  };
}

export async function viewDocumentFile(documentId: number) {
  const { blob } = await fetchProtectedBlob(`/api/client/documents/${documentId}/view`, `document-${documentId}.pdf`);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadDocumentFile(documentId: number, fileName?: string) {
  const res = await fetchProtectedBlob(`/api/client/documents/${documentId}/download`, fileName ?? `document-${documentId}.pdf`);
  const url = URL.createObjectURL(res.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName ?? res.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await http.post<UploadResponse>("/api/client/documents/upload", fd, {
    onUploadProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return r.data;
}

// ---------- Compliance ----------
export const triggerAnalysis = (documentId: number) =>
  httpPost<{ message: string; documentId: number; currentStatus: string }>(
    `/api/compliance/analyze/${documentId}`,
    {}
  );
export const getStatus = (documentId: number) =>
  httpGet<ComplianceStatus>(`/api/compliance/status/${documentId}`);
export const getResult = (documentId: number) =>
  httpGet<ReportInfo>(`/api/compliance/result/${documentId}`);

// ---------- Report PDF ----------
export async function downloadReportPdf(reportId: number, fileName?: string) {
  const res = await fetchProtectedBlob(
    `/api/reports/${reportId}/download-pdf`,
    fileName ?? `report-${reportId}.pdf`
  );
  const url = URL.createObjectURL(res.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName ?? res.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Rules ----------
export const listRules = () => httpGet<Rule[]>("/api/rules");
export const getRule = (id: number) => httpGet<Rule>(`/api/rules/${id}`);
export const createRule = (input: RuleCreate) => httpPost<Rule>("/api/rules", input);
export const updateRule = (id: number, input: RuleUpdate) => httpPut<Rule>(`/api/rules/${id}`, input);
export const deleteRule = (id: number) =>
  httpDelete<{ success?: boolean; message?: string }>(`/api/rules/${id}`);

// ---------- Reports ----------
export const getReportById = (reportId: number) =>
  httpGet<ReportInfo>(`/api/reports/${reportId}`);

export const listReportsForClient = (clientId: number) =>
  httpGet<ReportInfo[]>(`/api/reports/client/${clientId}`);

// ---------- Admin ----------
export const adminDashboard = () => httpGet<AdminDashboard>("/api/admin/dashboard");

export const adminListClients = (page = 0, size = 20, sort = "createdAt", dir = "desc") =>
  httpGet<PagedClients | ClientRecord[]>(
    `/api/admin/clients?page=${page}&size=${size}&sort=${encodeURIComponent(sort)}&dir=${encodeURIComponent(dir)}`
  );

export const adminFilterClients = (filter: ClientFilter, page = 0, size = 20) =>
  httpPost<PagedClients | ClientRecord[]>(
    `/api/admin/clients/filter?page=${page}&size=${size}`,
    filter
  );

export const adminGetClient = (id: number) => httpGet<ClientRecord>(`/api/admin/clients/${id}`);
export const adminUpdateClient = (
  id: number,
  body: Partial<ClientRecord> & { active?: boolean }
) => httpPut<ClientRecord>(`/api/admin/clients/${id}`, body);
export const adminDeleteClient = (id: number) =>
  httpDelete<{ success?: boolean; message?: string }>(`/api/admin/clients/${id}`);

export const adminRecentAudit = (limit = 100) =>
  httpGet<AuditEntry[]>(`/api/admin/audit/recent?limit=${limit}`);
export const adminClientAudit = (clientId: number) =>
  httpGet<AuditEntry[]>(`/api/admin/audit/client/${clientId}`);

export const adminReportSummary = () =>
  httpGet<Record<string, number | string>>("/api/admin/clients/reports/summary");

export const adminRegistrationTrend = (months = 12) =>
  httpGet<RegistrationTrendResponse>(
    `/api/admin/clients/reports/registration-trend?months=${months}`
  );


export const adminTopUploaders = (page = 0, size = 10) =>
  httpGet<TopUploaderResponse>(
    `/api/admin/clients/reports/top-uploaders?page=${page}&size=${size}`
  );


export const adminInactiveClients = () =>
  httpGet<{ count?: number; clients?: ClientRecord[] } | ClientRecord[]>(
    "/api/admin/clients/reports/inactive"
  );
  export const adminListClientsByRole = (role: string, page = 0, size = 20) =>
  httpGet<PagedClients | ClientRecord[]>(
    `/api/admin/clients/by-role?role=${encodeURIComponent(role)}&page=${page}&size=${size}`
  );
  export const adminListClientsByDate = (from: string, to: string, page = 0, size = 20) =>
  httpGet<PagedClients | ClientRecord[]>(
    `/api/admin/clients/by-date?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&page=${page}&size=${size}`
  );
  export const adminDocumentCount = (clientId: number) =>
  httpGet<number>(`/api/admin/clients/${clientId}/document-count`);
  export const adminRoleDistribution = () =>
  httpGet<RoleDistributionResponse>("/api/admin/clients/reports/role-distribution");

  export const getClientProfile = () => httpGet<ClientProfile>("/api/client/profile");

  export const updateClientProfile = (body: UpdateProfileRequest) =>
  httpPut<ClientProfile>("/api/client/profile", body);

  export const changeClientPassword = (body: ChangePasswordRequest) =>
  httpPost<{ message: string }>("/api/client/change-password", body);

  export const deactivateClientProfile = () =>
  httpPatch<ClientProfile>("/api/client/profile/deactivate");

  export const deleteClientProfile = () =>
  httpDelete<{ message: string }>("/api/client/profile");

  export const createLegalPractitioner = (body: LegalPractitionerInput) =>
  httpPost<ClientRecord>("/api/legal-practitioners", body);

  export const createDealMaker = (body: DealMakerInput) =>
  httpPost<ClientRecord>("/api/dealmakers", body);
