import CommunityBoardManage from './CommunityBoardManage';
import { EVENTS_BOARD_CONFIG } from '../../screens/board/boardConfigs';

export default function EventsBoardManage() {
  return <CommunityBoardManage config={EVENTS_BOARD_CONFIG} manageTitle="집회세미나" />;
}
