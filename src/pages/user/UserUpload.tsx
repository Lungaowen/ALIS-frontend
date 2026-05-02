import { PortalLayout } from "@/components/app/PortalLayout";
import { UploadAndPoll } from "@/components/app/UploadAndPoll";

export default function UserUploadPage() {
  return (
    <PortalLayout title="Upload" eyebrow="My account" description="Drop a PDF and ALIS will analyze it for you.">
      <div className="mx-auto max-w-3xl"><UploadAndPoll variant="full" /></div>
    </PortalLayout>
  );
}
