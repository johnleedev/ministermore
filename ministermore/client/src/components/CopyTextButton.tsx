import { useCallback, useState } from 'react';
import { copyToClipboard } from '../utils/copyToClipboard';
import './CopyTextButton.scss';

type CopyTextButtonProps = {
  text: string;
  className?: string;
  copiedLabel?: string;
  defaultLabel?: string;
};

export default function CopyTextButton({
  text,
  className,
  copiedLabel = '복사됨',
  defaultLabel = '복사',
}: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(text);
    if (!ok) {
      window.alert('클립보드 복사에 실패했습니다.');
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [text]);

  return (
    <button
      type="button"
      className={[
        'copy-text-btn',
        copied ? 'copy-text-btn--copied' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => void handleCopy()}
      aria-label={copied ? copiedLabel : `${defaultLabel}하기`}
    >
      {copied ? copiedLabel : defaultLabel}
    </button>
  );
}
