import { PortalLayout } from "@/components/app/PortalLayout";
import { UploadAndPoll } from "@/components/app/UploadAndPoll";

export default function DealerUploadPage() {
  return (
    <PortalLayout
      title="Submit Document for Analysis"
      eyebrow="Deal Maker"
      description="Upload a deal document — ALIS will compute a Deal Readiness Score using llama-3.3-70b-versatile."
    >
      <div className="mx-auto max-w-3xl">
        <UploadAndPoll variant="full" showReadiness />
      </div>
    </PortalLayout>
  );
}
