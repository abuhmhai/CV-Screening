import { AuthGate } from "../../../components/auth-gate";
import { AiScoreDetailRedesign } from "../../../components/ai-score-detail-redesign";

export default function AiScorePage() {
  return (
    <AuthGate roles={["CANDIDATE", "RECRUITER", "ADMIN"]}>
      <AiScoreDetailRedesign />
    </AuthGate>
  );
}

