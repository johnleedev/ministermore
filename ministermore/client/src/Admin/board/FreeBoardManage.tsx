import CommunityBoardManage from './CommunityBoardManage';
import { FREE_BOARD_CONFIG } from '../../screens/board/boardConfigs';

export default function FreeBoardManage() {
  return <CommunityBoardManage config={FREE_BOARD_CONFIG} manageTitle="자유게시판" />;
}
