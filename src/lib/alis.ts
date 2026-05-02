// Typed ALIS backend client (axios). All endpoints from the API brief.
import { httpGet, httpPost, httpPut, httpDelete, http, AlisApiError } from "./http";
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
  registeredAt?: string;
  documentCount?: number;
  companyName?: string;
}

export interface AdminDashboardData {
  totalClients?: number;
  totalDocuments?: number;
  totalReports?: number;
  highRiskDocuments?: number;
  roleDistribution?: Array<{ role: string; count: number }> | Record<string, number>;
  uploadTrend?: Array<{ date?: string; month?: string; count: number }>;
}

export interface AuditEntry {
  logId: number;
  timestamp: string;
  actionType: string;
  description: string;
  clientId?: number;
  documentId?: number;
  ipAddress?: string;
  clientName?: string;
}

export interface RoleDistributionRow {
  role: string;
  count: number;
  percentage?: number;
}

export interface RegistrationTrendRow {
  month: string;
  count: number;
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

// ---------- Documents ----------
export const listDocuments = () => httpGet<DocumentItem[]>("/api/client/documents");
export const getDocument = (id: number) => httpGet<DocumentItem>(`/api/client/documents/${id}`);
export const getDocumentReports = (id: number) =>
  httpGet<ReportInfo[]>(`/api/client/documents/${id}/reports`);

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
  const session = getStoredSession();
  const res = await fetch(
    `${getApiBaseUrl().replace(/\/+$/, "")}/api/client/reports/${reportId}/download`,
    { headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {} }
  );
  if (!res.ok) throw new AlisApiError(res.status, `Download failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName ?? `report-${reportId}.pdf`;
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
export const listReportsForClient = (clientId: number) =>
  httpGet<ReportInfo[]>(`/api/reports/client/${clientId}`);

// ---------- Admin ----------
export const adminDashboard = () => httpGet<AdminDashboardData>("/api/admin/dashboard");

export interface PagedClients {
  content?: ClientRecord[];
  items?: ClientRecord[];
  totalPages?: number;
  totalElements?: number;
  number?: number;
  size?: number;
}
export const adminListClients = (page = 0, size = 20) =>
  httpGet<PagedClients | ClientRecord[]>(`/api/admin/clients?page=${page}&size=${size}`);

export interface ClientFilter {
  searchQuery?: string;
  role?: string | null;
  registeredFrom?: string | null;
  registeredTo?: string | null;
}
export const adminFilterClients = (filter: ClientFilter) =>
  httpPost<PagedClients | ClientRecord[]>("/api/admin/clients/filter", filter);

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
export const adminRoleDistribution = () =>
  httpGet<RoleDistributionRow[]>("/api/admin/clients/reports/role-distribution");
export const adminRegistrationTrend = (months = 12) =>
  httpGet<RegistrationTrendRow[]>(`/api/admin/clients/reports/registration-trend?months=${months}`);
export const adminTopUploaders = () =>
  httpGet<TopUploaderRow[]>("/api/admin/clients/reports/top-uploaders");
export const adminInactiveClients = () =>
  httpGet<{ count?: number; clients?: ClientRecord[] } | ClientRecord[]>(
    "/api/admin/clients/reports/inactive"
  );
