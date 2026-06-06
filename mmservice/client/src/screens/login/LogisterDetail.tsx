import { useState } from "react";
import axios from "axios";
import './Login.scss'
import { useLocation, useNavigate } from 'react-router-dom';
import MainURL from "../../MainURL";
import { FaAngleDoubleRight } from "react-icons/fa";
import { FaCircleCheck } from "react-icons/fa6";
import { FaCheck } from "react-icons/fa";
import { CiWarning } from "react-icons/ci";

export default function LogisterDetail (props:any) {
  
  let navigate = useNavigate();
  const location = useLocation();
  const propsData = location.state.sort === 'sns' ? location.state.data : '';
  
  const [currentTab, setCurrentTab] = useState(1);

  const [checkAll, setCheckAll] = useState<boolean>(false);
  const [checkUsingPolicy, setCheckUsingPolicy] = useState<boolean>(false);
  const [checkPersonalInfo, setCheckPersonalInfo] = useState<boolean>(false);
  const [checkContentsRestrict, setCheckContentsRestrict] = useState<boolean>(false);
  const [checkInfoToOthers, setCheckInfoToOthers] = useState<boolean>(false);
  const [checkServiceNotifi, setCheckServiceNotifi] = useState<boolean>(false);

  const handleCheckAll = async () => {
    if (checkAll === true) {
      setCheckAll(false);
      setCheckServiceNotifi(false);
      setCheckInfoToOthers(false);
      setCheckContentsRestrict(false);
      setCheckPersonalInfo(false);
      setCheckUsingPolicy(false);
    } else {
      setCheckAll(true);
      setCheckServiceNotifi(true);
      setCheckInfoToOthers(true);
      setCheckContentsRestrict(true);
      setCheckPersonalInfo(true);
      setCheckUsingPolicy(true);
    }
   };


  const [logisterAccount, setlogisterAccount] = useState( location.state.sort === 'sns' ? propsData.email : '');
  const [logisterAccountCheck, setLogisterAccountCheck] = useState<boolean>(false);
  const [logisterAccountAuthNum, setLogisterAccountAuthNum] = useState('');
  const [logisterAccountAuthInput, setLogisterAccountAuthInput] = useState('');
  const [logisterAccountAuthCheck, setLogisterAccountAuthCheck] = useState<boolean>(false);
  const [logisterPasswd, setLogisterPasswd] = useState('');
  const [logisterPasswdCheck, setLogisterPasswdCheck] = useState('');
  const [logisterNickName, setLogisterNickName] = useState('');
  const [logisterChurch, setLogisterChurch] = useState('');
  const [logisterSort, setLogisterSort] = useState('');
  const [logisterDetail, setLogisterDetail] = useState('');

  
  const handleLogister = async () => {
    const userData = {
      checkUsingPolicy : checkUsingPolicy,
      checkPersonalInfo: checkPersonalInfo,
      checkContentsRestrict: checkContentsRestrict,
      checkInfoToOthers: checkInfoToOthers,
      checkServiceNotifi: checkServiceNotifi,
      email : logisterAccount,
      password : logisterPasswd,
      userNickname : logisterNickName,
      userChurch : logisterChurch,
      userSort : logisterSort,
      userDetail : logisterDetail,
      userURL : location.state.sort === 'sns' ? propsData.userURL : 'email'
    }

    if (location.state.sort !== 'sns' && !logisterAccountCheck) {
      alert('이메일 중복확인을 해주세요')
    } else if (location.state.sort !== 'sns' && !logisterAccountAuthCheck) {
      alert('이메일 인증을 완료해주세요')
    } else {
      await axios
      .post(`${MainURL}/login/logisterdo`, {userData})
      .then((res)=>{
        if (res.data) {
          alert('가입이 완료되었습니다. 다시 로그인 해주세요.');
          navigate('/login');
        }
      })
      .catch((err)=>{
        alert('다시 시도해주세요.')
      })
    }
  };

  // 이메일 중복 체크
  const handleCheckAccount = async () => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(logisterAccount);
    if (regex) {
      const res = await axios.get(`${MainURL}/login/logincheckaccount/${logisterAccount}`)
      if (res.data) { 
        alert('중복된 이메일 계졍이 있습니다.')
        setLogisterAccountCheck(false);
      } else {
        alert('사용할수 있는 이메일 계졍입나다. 해당 메일로 인증번호를 보냈습니다.')
        setLogisterAccountCheck(true);
        handleCheckAccountAuth();
      }
    } else {
      alert('이메일 형식이 아닙니다.')
    }
  }; 
  // 이메일 인증하기
  const handleCheckAccountAuth = async () => {
    const userData = {
      email : logisterAccount
    }
    await axios
     .post(`${MainURL}/login/loginaccountauth`, userData)
     .then((res)=>{
       if (res.data) {
          setLogisterAccountAuthNum(JSON.stringify(res.data.num));
       }
     })
     .catch((err)=>{
       alert('다시 시도해주세요.')
     })
   };
   
  return (
    <div className="login">
      
      <div className="inner">

      {
        currentTab === 1 &&
        <div className="container">
          <div className="title">
            <h1>회원가입</h1>
            <p>서비스 약관에 동의를 해주세요.</p>
          </div>

          <div className="stepnotice">
            <div className="currentbar">
              {
                location.state.sort === 'sns'
                ? <p>SNS가입</p>
                : <p>이메일가입</p>
              }
              <p style={{margin:'0 10px', paddingTop:'5px'}}><FaAngleDoubleRight /></p>
              <p className="current">동의</p>
              <p style={{margin:'0 10px', paddingTop:'5px'}}><FaAngleDoubleRight /></p>
              <p>정보입력</p>
            </div>
            <div className="rowbar"></div>
          </div>

          <div className="agree_check">
            <ul className="agree_check_tit">
              <li>
                <span className="checks check_all"
                  onClick={handleCheckAll}
                >
                  <FaCircleCheck size={20} color={checkAll ? "#33383f" : "EAEAEA"}/>
                  <label htmlFor="reg_allcheck">모두 동의 합니다.</label>
                </span>
              </li>
            </ul>
            <div style={{width:'100%', height:'2px', backgroundColor:'#EAEAEA', margin:'10px 0'}}></div>

            <ul className="agree_check_tit">
              <li>
                <span className="checks"
                  onClick={()=>{
                    setCheckUsingPolicy(!checkUsingPolicy);
                  }}
                >
                  <FaCircleCheck size={20} color={checkUsingPolicy ? "#33383f" : "EAEAEA"}/>
                  <label htmlFor="reg_use">[필수] 서비스 이용약관 동의</label>
                </span>
                <a href="http://www.ministermore.co.kr/usingpolicy.html" target="_blank" className="agree_link">이용약관 보기</a>
              </li>
              <li>
                <span className="checks"
                  onClick={()=>{
                    setCheckPersonalInfo(!checkPersonalInfo);
                  }}
                >
                  <FaCircleCheck  size={20} color={checkPersonalInfo ? "#33383f" : "EAEAEA"}/>
                  <label htmlFor="reg_personal">[필수] 개인정보 수집/이용 동의</label>
                </span>
                <a href="http://www.ministermore.co.kr/personalinfo.html" target="_blank" className="agree_link">개인정보 수집/이용 보기</a>
              </li>
              <li>
                <span className="checks"
                  onClick={()=>{
                    setCheckContentsRestrict(!checkContentsRestrict);
                  }}
                >
                  <FaCircleCheck  size={20} color={checkContentsRestrict ? "#33383f" : "EAEAEA"}/>
                  <label htmlFor="reg_provision">[필수] 유해 컨텐츠에 대한 제재 동의</label>
                </span>
              </li>
              <li>
                <span className="checks"
                  onClick={()=>{
                    setCheckInfoToOthers(!checkInfoToOthers);
                  }}
                >
                  <FaCircleCheck  size={20} color={checkInfoToOthers ? "#33383f" : "EAEAEA"}/>
                  <label htmlFor="reg_provision">[필수] 제3자 정보 제공 동의</label>
                </span>
              </li>
              <li>
                <span className="checks"
                  onClick={()=>{
                    setCheckServiceNotifi(!checkServiceNotifi);
                  }}
                >
                  <FaCircleCheck  size={20} color={checkServiceNotifi ? "#33383f" : "EAEAEA"}/>
                  <label htmlFor="reg_benefit">[선택] 혜택성 정보수신 동의</label>
                </span>
              </li>
            </ul>
          </div>

          <div className="buttonbox">
            <div className="button"
              style={{backgroundColor: (checkInfoToOthers && checkPersonalInfo && checkContentsRestrict && checkUsingPolicy) ? '#33383f' : '#bfbfbf'}}
              onClick={()=>{
                if (checkInfoToOthers && checkPersonalInfo && checkContentsRestrict && checkUsingPolicy) {
                  setCurrentTab(2);
                } else {
                  alert('필수 항목을 모두 체크해주세요.')
                }
              }}
            >
              <p>다음</p>
            </div>
          </div>
        </div>
      }

      {
        currentTab === 2 &&
        <div className="container">
          
          <div className="title">
            <h1>회원가입</h1>
            <p>다음 정보를 입력해주세요.</p>
          </div>

          <div className="stepnotice">
            <div className="currentbar">
              {
                location.state.sort === 'sns'
                ? <p>SNS가입</p>
                : <p>이메일가입</p>
              }
              <p style={{margin:'0 10px', paddingTop:'5px'}}><FaAngleDoubleRight /></p>
              <p>동의</p>
              <p style={{margin:'0 10px', paddingTop:'5px'}}><FaAngleDoubleRight /></p>
              <p className="current">정보입력</p>
            </div>
            <div className="rowbar"></div>
          </div>

          <h2>필수항목</h2>

          <div className="inputbox">
            <div className="inputbox-btncover">
              <p>이메일주소 <span>*</span></p>
              {
                location.state.sort === 'email' &&
                <>
                  {
                    (logisterAccount !== '')
                    &&
                    <div style={{marginRight:'5px'}}>
                    {
                      logisterAccountCheck
                      ? <FaCheck color='#1DDB16'/>
                      : <CiWarning color='#FF0000'/>
                    }
                    </div>
                  }
                  <div className="addBtn"
                    onClick={()=>{
                      handleCheckAccount();
                    }}
                  >중복확인</div>
                </>
              }
            </div>
            <input value={logisterAccount} className={logisterAccount === '' ? "inputdefault" : "inputdefault select" } type="text" 
              onChange={(e) => {
                const value = e.target.value;
                if (value.length === 0 ) {
                  setlogisterAccount('');
                  setLogisterAccountCheck(false);
                } else {
                  const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value);
                  if (isKorean) {
                    alert('한글은 입력할 수 없습니다.');
                    return;
                  }
                  setlogisterAccount(value);
                }
              }} maxLength={45}/>
          </div>
          {
            logisterAccountCheck &&
            <div className="inputbox">
              <div className="inputbox-btncover">
                <p>이메일 인증<span>*</span></p>
                {
                  location.state.sort === 'email' &&
                  <>
                    <div style={{marginRight:'5px'}}>
                      {
                        logisterAccountAuthCheck
                        ? <FaCheck color='#1DDB16'/>
                        : <CiWarning color='#FF0000'/>
                      }
                    </div>
                    <div className="addBtn"
                      onClick={()=>{
                        if (logisterAccountAuthNum === logisterAccountAuthInput) {
                          alert('인증되었습니다.')
                          setLogisterAccountAuthCheck(true);
                        } else {
                          alert('인증 번호가 일치하지 않습니다.')
                        }
                      }}
                    >인증하기</div>
                  </>
                }
              </div>
              <input value={logisterAccountAuthInput} className={logisterAccountAuthInput === '' ? "inputdefault" : "inputdefault select" } type="text" 
                onChange={(e) => {
                  const value = e.target.value;
                  const isNum = /^[0-9]*$/.test(value);
                  if (!isNum) {
                    alert('한글은 입력할 수 없습니다.');
                    return;
                  }
                  setLogisterAccountAuthInput(value);
                }} maxLength={45}/>
            </div>
          }

          {
            location.state.sort !== 'sns' &&
            <>
              <div className="inputbox">
                <p>비밀번호 <span>*</span></p>
                <input value={logisterPasswd} className={logisterPasswd === '' ? "inputdefault" : "inputdefault select" } type="password" 
                  onChange={(e) => {setLogisterPasswd(e.target.value)}} maxLength={100}/> 
              </div>
              <div className="inputbox">
                <p style={{display:'flex', alignItems:'center'}}>
                  <p>비밀번호확인</p>
                  {
                    (logisterPasswd !== '' && logisterPasswdCheck !== '')
                    &&
                    <>
                    {
                      logisterPasswd === logisterPasswdCheck
                      ? <FaCheck color='#1DDB16'/>
                      : <CiWarning color='#FF0000'/>
                    }
                    </>
                  }
                </p>
                <input value={logisterPasswdCheck} className={logisterPasswdCheck === '' ? "inputdefault" : "inputdefault select" } type="password" 
                  onChange={(e) => {setLogisterPasswdCheck(e.target.value)}}/>
              </div>
            </>
          }

          <div className="inputbox">
            <p>닉네임 <span>*</span></p>
            <input value={logisterNickName} className={logisterNickName === '' ? "inputdefault" : "inputdefault select" } type="text" 
              onChange={(e) => {setLogisterNickName(e.target.value)}}/>
          </div>
        
          <div className="inputbox">
            <p>교회명 <span>*</span></p>
            <input value={logisterChurch} className={logisterChurch === '' ? "inputdefault" : "inputdefault select" } type="text" 
              onChange={(e) => {setLogisterChurch(e.target.value)}}/>
          </div>

          <div className="inputbox">
            <p>직분이 무엇인가요? <span>*</span></p>
            <div className="checkInputCover">
              <div className='checkInput'>
                <input className="input" type="checkbox"
                    checked={logisterSort === '교역자'}
                    onChange={()=>{setLogisterSort('교역자')}}
                  />
                  <h5>교역자</h5>
                </div>
                <div className='checkInput' style={{marginLeft:'10px'}}>
                  <input className="input" type="checkbox"
                    checked={logisterSort === '성도'}
                    onChange={()=>{setLogisterSort('성도')}}
                  />
                <h5>일반성도</h5>
              </div>
            </div>
          </div>

          <div className="inputbox">
            <p>이용하시고자 하시는 서비스가 무엇인가요?</p>
            <input value={logisterDetail} className={logisterDetail === '' ? "inputdefault" : "inputdefault select" } type="text" 
              onChange={(e) => {setLogisterDetail(e.target.value)}}/>
          </div>

       
          <div className="buttonbox">
            <div className="button"
              style={{backgroundColor: (logisterAccount !== '' && logisterNickName !== '' && logisterSort !== '' && logisterChurch !== '') ? '#33383f' : '#bfbfbf'}}
              onClick={()=>{
                if (logisterAccount !== '' && logisterNickName !== '' && logisterSort !== '' && logisterChurch !== '') {
                  handleLogister();
                } else {
                  alert('필수항목을 선택해주세요.')
                }
              }}
            >
              <p>회원가입</p>
            </div>
          </div>

          <div className="bottombox">
            <div className="cover">
              <p onClick={()=>{setCurrentTab(1)}}>이전</p>
            </div>
          </div>
          
        </div>
      }  

      </div>


    </div>
  );
}
