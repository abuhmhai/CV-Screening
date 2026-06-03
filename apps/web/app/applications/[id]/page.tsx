import { AuthGate } from "../../../components/auth-gate";
import { ApplicationDetailCandidateRedesign } from "../../../components/application-detail-candidate-redesign";

export default function ApplicationDetailPage() {
  return (
    <AuthGate roles={["CANDIDATE", "RECRUITER", "ADMIN"]}>
      <ApplicationDetailCandidateRedesign />
    </AuthGate>
  );
}
