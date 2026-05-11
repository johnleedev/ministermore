import { useEffect, useState } from 'react';
import axios from 'axios';
import MainURL from '../MainURL';
import { PiPencilSimpleLineFill } from 'react-icons/pi';


export default function Sub4_Backup (props:any) {

	// 게시글 가져오기 ------------------------------------------------------
	const [castingBackupStatus, setCastingBackupStatus] = useState<any>(null);
	const [castingBackupResult, setCastingBackupResult] = useState<any>(null);
	const [isCastingBackupLoading, setIsCastingBackupLoading] = useState(false);

	

	const fetchPosts = async () => {
		try {
			const res = await axios.get(`${MainURL}/admin/retreat-casting-backup-status`);
			console.log(res.data);
			setCastingBackupStatus(res.data);
		} catch (error) {
			console.error(error);
		}
	};

	
	

	useEffect(() => {
		fetchPosts();
	}, []);  

	const backupCasting = async () => {
		if (!window.confirm('retreatmoredb의 datacasting 데이터를 retreatdb로 복사하시겠습니까?')) return;

		setIsCastingBackupLoading(true);
		try {
			const res = await axios.post(`${MainURL}/admin/backup-retreat-casting`);
			setCastingBackupResult(res.data);
			if (res.data?.success) {
				alert('수련회강사 데이터 백업이 완료되었습니다.');
				fetchPosts();
			} else {
				alert('백업에 실패했습니다.');
			}
		} catch (error) {
			console.error(error);
			alert('백업 중 오류가 발생했습니다.');
		} finally {
			setIsCastingBackupLoading(false);
		}
	};
 

	return ( 
		<div className='Main-cover'>

			<div className="main-title" style={{display:'flex', justifyContent:'center', alignItems:'center', gap: '10px'}}>
        <div className="addBtn"
					onClick={backupCasting}
				>
					<PiPencilSimpleLineFill />
					<p>{isCastingBackupLoading ? '백업중...' : '수련회강사 백업'}</p>
				</div>
				
			</div>
			
			<div style={{maxWidth:'800px', margin:'20px auto', padding:'10px'}}>
				{castingBackupStatus && (
					<div style={{border:'1px solid #e8ebef', borderRadius:'12px', padding:'20px', marginBottom:'16px'}}>
						<h3 style={{fontSize:'18px', marginBottom:'12px'}}>수련회강사 데이터 현황</h3>
						<p>retreatmoredb.datacasting: {castingBackupStatus.sourceCount ?? 0}개</p>
						<p>retreatdb.datacasting: {castingBackupStatus.targetCount ?? 0}개</p>
					</div>
				)}
				{castingBackupResult && (
					<div style={{border:'1px solid #e8ebef', borderRadius:'12px', padding:'20px'}}>
						<h3 style={{fontSize:'18px', marginBottom:'12px'}}>수련회강사 백업 결과</h3>
						<p>전체 데이터: {castingBackupResult.totalCount ?? 0}개</p>
						<p>입력된 데이터: {castingBackupResult.insertedCount ?? 0}개</p>
						<p>건너뛴 데이터: {castingBackupResult.skippedCount ?? 0}개</p>
						<p style={{marginTop:'10px', color:'#666', fontSize:'13px'}}>
							복사 컬럼: {Array.isArray(castingBackupResult.columns) ? castingBackupResult.columns.join(', ') : '-'}
						</p>
					</div>
				)}
			</div>
			<div style={{height:'100px'}}></div>
		</div>
		
	);
}
