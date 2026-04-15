import { useState } from 'react'
import '../Company.scss';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../../MainURL';

export default function Advertise (props:any) {

  let navigate = useNavigate();
  const [currentMenu, setCurrentMenu] = useState(3);

  const [sort, setSort] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profile, setProfile] = useState('');
  const [userContact, setUserContact] = useState('');

  // 종류 선택 ----------------------------------------------
  const sortOptions = [
    { value: '선택', label: '선택' },
    { value: '설교자', label: '설교자' },
    { value: '찬양사역자', label: '찬양사역자' },
    { value: '기타', label: '기타' }
  ];

  // 글쓰기 등록 함수 ----------------------------------------------
  const currentDate = new Date();
  const date = currentDate.toISOString().slice(0, 10);
 
  const registerPost = async () => {

     const getParams = {
       sort : sort,
       name : name,
       phone: phone,
       date: date,
       profile: profile,
       userContact: userContact,
    }
    axios
      .post(`${MainURL}/booklets/postscasting`, getParams)
      .then((res) => {
         if (res.data) {
           setSort('');
           setName('');
           setPhone('');
           setProfile('');
           setUserContact('')
           alert('요청되었습니다. 운영진이 검토후에 업로드 됩니다.');
         }
      })
      .catch(() => {
        console.log('실패함')
      })
  };
 

  return (
    <div className="company">

      <div className="inner">

        <div className="subpage__main">
          <div className="subpage__main__title">광고및제휴</div>
          <div className="subpage__main__content" style={{display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
            
            <p style={{marginBottom:'10px'}}>아래 메일로 문의 바랍니다.</p>
            <p>yeplat@naver.com</p>

          </div>
        </div>
      </div>


      <div className="inner">

        
      
        

      </div>



    </div>
  );
}
