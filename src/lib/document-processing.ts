export const MAX_DOCUMENT_SIZE_MB = 50;

export const SUPPORTED_DOCUMENT_TYPES = [
  {
    label: "PDF",
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
  },
  {
    label: "DOCX",
    extensions: [".docx"],
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  },
  {
    label: "TXT",
    extensions: [".txt"],
    mimeTypes: ["text/plain"],
  },
  {
    label: "CSV",
    extensions: [".csv"],
    mimeTypes: ["text/csv"],
  },
  {
    label: "Markdown",
    extensions: [".md", ".markdown"],
    mimeTypes: ["text/markdown"],
  },
] as const;

export const DOCUMENT_ACCEPT = SUPPORTED_DOCUMENT_TYPES.flatMap((type) => [
  ...type.extensions,
  ...type.mimeTypes,
]).join(",");

export const DOCUMENT_FORMAT_LABEL = SUPPORTED_DOCUMENT_TYPES.map((type) => type.label).join(", ");

export const DOCUMENT_PROCESSING_STEPS = [
  {
    title: "File received",
    description: "The document is uploaded and linked to the client record.",
  },
  {
    title: "Text extracted",
    description: "Readable text is extracted from the uploaded file for analysis.",
  },
  {
    title: "Rules selected",
    description: "Relevant legal rules are selected from the active rule library.",
  },
  {
    title: "AI report saved",
    description: "Groq returns risk, explanation, recommendation, and score as a report.",
  },
] as const;

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function validateDocumentFile(file: File): string | null {
  const fileName = file.name.toLowerCase();
  const supported = SUPPORTED_DOCUMENT_TYPES.some((type) => {
    const hasExtension = type.extensions.some((ext) => fileName.endsWith(ext));
    const hasMimeType = file.type ? type.mimeTypes.some((mimeType) => mimeType === file.type) : false;
    return hasExtension || hasMimeType;
  });

  if (!supported) {
    return `Please upload a supported document: ${DOCUMENT_FORMAT_LABEL}.`;
  }

  const maxBytes = MAX_DOCUMENT_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Please upload a file smaller than ${MAX_DOCUMENT_SIZE_MB} MB.`;
  }

  return null;
}
