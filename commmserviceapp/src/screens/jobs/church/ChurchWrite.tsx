import { RecruitSimpleWriteView } from '../common/RecruitSimpleWriteView';

type Props = {
  onBack: () => void;
  onSuccess?: () => void;
};

export function ChurchWrite({ onBack, onSuccess }: Props) {
  return (
    <RecruitSimpleWriteView
      apiBase="recruitchurch"
      pageTitle="찬양대/방송/직원 구인"
      orgLabel="교회명"
      orgLeaderLabel="담임목사"
      onBack={onBack}
      onSuccess={onSuccess}
    />
  );
}
