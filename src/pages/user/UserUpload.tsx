import { PortalLayout } from "@/components/app/PortalLayout";
import { UploadAndPoll } from "@/components/app/UploadAndPoll";

export default function UserUploadPage() {
  return (
    <PortalLayout title="Upload" eyebrow="My account" description="Upload a supported document and ALIS will prepare an AI compliance report.">
      <div className="mx-auto max-w-3xl"><UploadAndPoll variant="full" /></div>
    </PortalLayout>
  );
}
