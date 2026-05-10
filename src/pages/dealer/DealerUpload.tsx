import { PortalLayout } from "@/components/app/PortalLayout";
import { UploadAndPoll } from "@/components/app/UploadAndPoll";

export default function DealerUploadPage() {
  return (
    <PortalLayout
      title="Submit Document for Analysis"
      eyebrow="Deal Maker"
      description="Upload a deal document and ALIS will extract text, check the rule library, and compute a readiness score."
    >
      <div className="mx-auto max-w-3xl">
        <UploadAndPoll variant="full" showReadiness />
      </div>
    </PortalLayout>
  );
}
