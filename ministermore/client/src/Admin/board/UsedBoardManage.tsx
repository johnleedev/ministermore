import CommunityBoardManage from './CommunityBoardManage';
import { USED_BOARD_CONFIG } from '../../screens/board/boardConfigs';

export default function UsedBoardManage() {
  return <CommunityBoardManage config={USED_BOARD_CONFIG} manageTitle="중고장터" />;
}
