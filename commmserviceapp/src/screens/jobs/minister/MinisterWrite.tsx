import { RecruitMinisterWriteView } from '../common/RecruitMinisterWriteView';

type Props = {
  onBack: () => void;
  onSuccess?: () => void;
};

export function MinisterWrite({ onBack, onSuccess }: Props) {
  return <RecruitMinisterWriteView onBack={onBack} onSuccess={onSuccess} />;
}
