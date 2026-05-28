import { useState } from 'react';
import CastingManage from './CastingManage';
import PlaceManage from './PlaceManage';
import './RetreatManage.scss';

type RetreatTab = 'casting' | 'place';

export default function RetreatManage() {
  const [tab, setTab] = useState<RetreatTab>('place');

  return (
    <div>
      <div className="retreat-admin__tabs">
        <button
          type="button"
          className={`retreat-admin__tab${tab === 'place' ? ' is-active' : ''}`}
          onClick={() => setTab('place')}
        >
          수련회 장소
        </button>
        <button
          type="button"
          className={`retreat-admin__tab${tab === 'casting' ? ' is-active' : ''}`}
          onClick={() => setTab('casting')}
        >
          수련회 강사
        </button>
       
      </div>

      {tab === 'casting' ? <CastingManage /> : <PlaceManage />}
    </div>
  );
}
