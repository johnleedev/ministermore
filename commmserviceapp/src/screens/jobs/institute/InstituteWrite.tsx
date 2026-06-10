import { RecruitSimpleWriteView } from '../common/RecruitSimpleWriteView';

type Props = {
  onBack: () => void;
  onSuccess?: () => void;
};

export function InstituteWrite({ onBack, onSuccess }: Props) {
  return (
    <RecruitSimpleWriteView
      apiBase="recruitinstitute"
      pageTitle="학교/기관/단체 구인"
      orgLabel="기관명"
      orgLeaderLabel="대표/담당자"
      onBack={onBack}
      onSuccess={onSuccess}
    />
  );
}
