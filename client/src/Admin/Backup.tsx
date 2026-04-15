import { useEffect, useState } from 'react';
import axios from 'axios';
import MainURL from '../MainURL';
import { PiPencilSimpleLineFill } from 'react-icons/pi';
import { RiDeleteBinLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';


export default function Sub4_Backup (props:any) {

	// 게시글 가져오기 ------------------------------------------------------
	const [refresh, setRefresh] = useState(true);
	const [list, setList] = useState<any>([]);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [hoveredId, setHoveredId] = useState<number | null>(null);


	const fetchPosts = async () => {
		const res = await axios.get(`${MainURL}/recruitwork/getrecruitdataall`);
		if (res.data) {
			let copy = res.data;
			
			console.log('copy', copy);
      const filterList = copy.filter((item:any) => item.title.includes('대학교'));
      console.log('filterList', filterList);
			
			setList(filterList);
      
		} 
	};

	

	useEffect(() => {
		fetchPosts();
	}, [refresh, currentPage]);  
 
  const saveSingleItem = async (item: any) => {
    try {
      const res = await axios.post(`${MainURL}/recruitwork/postsrecruitinstitute`, {
        id: item.id, // recruitMinister 테이블에서 삭제하기 위한 id
        source: item.source,
        title: item.title,
        writer: item.writer,
        date: item.date,
        link: item.link,
        church: item.church,
        religiousbody: item.religiousbody,
        location: item.location,
        locationDetail: item.locationDetail,
        address: item.address,
        mainpastor: item.mainPastor || item.mainpastor,
        homepage: item.homepage,
        school: item.school,
        career: item.career,
        sort: item.sort,
        part: item.part,
        partDetail: item.partDetail,
        recruitNum: item.recruitNum,
        workday: item.workday,
        workTimeSunDay: item.workTimeSunDay,
        workTimeWeek: item.workTimeWeek,
        dawnPray: item.dawnPray,
        pay: item.pay,
        welfare: item.welfare,
        insurance: item.insurance,
        severance: item.severance,
        applydoc: item.applydoc,
        applyhow: item.applyhow,
        applytime: item.applytime,
        etcNotice: item.etcNotice,
        inquiry: item.inquiry,
        customInput: item.customInput,
        saveDate: item.saveDate,
        saveUser: item.saveUser
      });
      
      if (res.data.success) {
        console.log(`저장 성공: ${item.title}`);
        // 저장 성공 후 리스트에서 제거 (recruitMinister에서 삭제되었으므로)
        setList((prevList: any[]) => prevList.filter((listItem: any) => listItem.id !== item.id));
      } else {
        alert(`저장 실패: ${item.title}`);
      }
    } catch (error: any) {
      console.error(`저장 실패: ${item.title}`, error);
      if (error.response?.data?.duplicate) {
        alert(`중복된 데이터입니다: ${item.title}`);
      } else {
        alert(`저장 중 오류가 발생했습니다: ${item.title}`);
      }
    }
  };

  const register = async () => {

    const inputListOrigin = [...list];
    const promises = [];
  
    for (let index = 0; index < inputListOrigin.length; index++) {
      const copy = inputListOrigin[index];
      
      // 새로운 테이블에 차례대로 저장
      const postPromise = axios.post(`${MainURL}/recruitwork/postsrecruitinstitute`, {
        source: copy.source,
        title: copy.title,
        writer: copy.writer,
        date: copy.date,
        link: copy.link,
        church: copy.church,
        religiousbody: copy.religiousbody,
        location: copy.location,
        locationDetail: copy.locationDetail,
        address: copy.address,
        mainpastor: copy.mainPastor || copy.mainpastor,
        homepage: copy.homepage,
        school: copy.school,
        career: copy.career,
        sort: copy.sort,
        part: copy.part,
        partDetail: copy.partDetail,
        recruitNum: copy.recruitNum,
        workday: copy.workday,
        workTimeSunDay: copy.workTimeSunDay,
        workTimeWeek: copy.workTimeWeek,
        dawnPray: copy.dawnPray,
        pay: copy.pay,
        welfare: copy.welfare,
        insurance: copy.insurance,
        severance: copy.severance,
        applydoc: copy.applydoc,
        applyhow: copy.applyhow,
        applytime: copy.applytime,
        etcNotice: copy.etcNotice,
        inquiry: copy.inquiry,
        customInput: copy.customInput,
        saveDate: copy.saveDate,
        saveUser: copy.saveUser
      })
        .then((response) => {
          console.log(`저장 성공: ${copy.title}`);
          return { success: true, data: response.data };
        })
        .catch((error) => {
          console.error(`저장 실패: ${copy.title}`, error);
          return { success: false, error: error.message };
        });
      promises.push(postPromise);
    }
  
    try {
      const results = await Promise.all(promises);
      const successCount = results.filter(result => result.success).length;
      const totalCount = results.length;
      
      if (successCount === totalCount) {
        alert(`모든 데이터가 정상적으로 저장되었습니다. (${successCount}/${totalCount})`);
        setRefresh(!refresh); // 데이터 새로고침
      } else {
        alert(`일부 데이터만 저장되었습니다. (${successCount}/${totalCount})`);
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
      console.error('전체적인 오류 발생', error);
    }

  };

	return ( 
		<div className='Main-cover'>

			<div className="main-title" style={{display:'flex', justifyContent:'center', alignItems:'center', gap: '10px'}}>
        <div className="addBtn"
					onClick={()=>{
						register();
					}}
				>
					<PiPencilSimpleLineFill />
					<p>저장</p>
				</div>
				
			</div>
			
			<div style={{maxWidth:'800px', margin:'20px auto', padding:'10px'}}>
				<div style={{padding:0, margin:0}}>
					{list.map((item:any)=> (
						<div 
							style={{
								display:'flex', 
								justifyContent:'space-between', 
								alignItems:'center',
								backgroundColor: hoveredId === item.id ? '#f0f0f0' : 'transparent',
								cursor: 'pointer',
								transition: 'background-color 0.2s'
							}} 
							key={item.id}
							onMouseEnter={() => setHoveredId(item.id)}
							onMouseLeave={() => setHoveredId(null)}
							onClick={() => saveSingleItem(item)}
						>
              <p style={{padding:'8px 0', borderBottom:'1px solid #eee', flex: '0 0 80px'}}>
							 {item.id}
              </p>
              <p style={{padding:'8px 0', borderBottom:'1px solid #eee', flex: '1'}}>
                {item.title}
              </p>
						</div>
					))}
				</div>
			</div>
			<div style={{height:'100px'}}></div>
		</div>
		
	);
}
