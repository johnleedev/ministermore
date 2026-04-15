import { useEffect, useState } from 'react';
import './Mypage.scss';
import Footer from '../../components/Footer';
import MypageMenu from './MypageMenu';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import { useRecoilState } from 'recoil';
import { recoilLoginState, recoilUserData } from '../../RecoilStore';


export default function Profile() {

  let navigate = useNavigate();
  const [isLogin, setIsLogin] = useRecoilState(recoilLoginState);
  const [userData, setUserData] = useRecoilState(recoilUserData);

  const [currentTab, setCurrentTab] = useState(1);
  const [refresh, setRefresh] = useState<boolean>(false);

  interface ProfileProps {
    grade : string;
    userAccount: string;
    userNickName: string;
    userSort: string;
    userDetail: string;
    userURL: string;
  }
  
  const [userProfile, setUserProfile] = useState<ProfileProps>();
  const [grade, setGrade] = useState('');
  const [userAccount, setUserAccount] = useState('');
  const [userNickName, setUserNickName] = useState('');
  const [userSort, setUserSort] = useState('');
  const [userDetail, setUserDetail] = useState('');
  const [userURL, setUserURL] = useState('');
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordChange, setPasswordChange] = useState('');

  const [isViewPasswdChange, setIsViewPasswdChange] = useState<boolean>(false);
  const [isViewDeleteAccount, setIsViewDeleteAccount] = useState<boolean>(false);
  const [agreeDeleteAccount, setAgreeDeleteAccount] = useState<boolean>(false);

  const fetchPosts = async () => {
    const res = await axios.get(`${MainURL}/mypage/getprofile/${userData.userAccount}`)
    if (res.data) {
      setUserProfile(res.data[0]);
      setGrade(res.data[0].grade);
      setUserAccount(res.data[0].userAccount);
      setUserNickName(res.data[0].userNickName);
      setUserSort(res.data[0].userSort);
      setUserDetail(res.data[0].userDetail);
      setUserURL(res.data[0].userURL);
    }
  };

  useEffect(() => {
		fetchPosts();
	}, [refresh]);  

  // 수정 함수
  const handleRevise = async () => {
    await axios
     .post(`${MainURL}/mypage/changeprofile`, {
        userAccount : userAccount,
        userNickName : userNickName,
        userSort : userSort,
        userDetail : userDetail,
     })
     .then((res)=>{
       if (res.data) {
          setUserData((prev:any) => ({
            ...prev,
            userNickName: userNickName,
            userSort: userSort,
            userDetail: userDetail
          }));
          setRefresh(!refresh);
          alert('수정되었습니다.');
          setCurrentTab(1);
       }
     })
     .catch((err)=>{
       alert('다시 시도해주세요.')
     })
   };  

  // 비번 변경 함수
  const handlePasswdChange = async () => {
    await axios
     .post(`${MainURL}/mypage/profilechangepassword`, {
        userAccount : userAccount,
        userNickName : userNickName,
        passwordCurrent : passwordCurrent,
        passwordChange : passwordChange
     })
     .then((res)=>{
       if (res.data === true) {
        setRefresh(!refresh);
        alert('변경되었습니다.');
        setIsViewPasswdChange(false);
       } else {
        alert(res.data);
       }
     })
     .catch((err)=>{
       alert('다시 시도해주세요.')
     })
   };  

   // 계정 삭제 함수
   const handleDeleteAccount = async () => {
    await axios
     .post(`${MainURL}/mypage/deleteaccount`, {
        userAccount : userAccount
     })
     .then((res)=>{
       if (res.data === true) {
        setRefresh(!refresh);
        alert('탈퇴되었습니다.');
        setIsLogin(false);
        setUserData({
          userAccount : '',
          userNickName : '',
          userSort: '',
          userDetail : '',
          grade: ''
        })
        sessionStorage.clear();
        navigate('/');
        window.location.reload();
       } else {
        alert(res.data);
       }
     })
     .catch((err)=>{
       alert('다시 시도해주세요.')
     })
   };  
  
  return (
    <div className='mypage'>

      <div className="inner">
        <MypageMenu />
        <div className="subpage__main">
          <div className="subpage__main__title">프로필</div>
          {
            currentTab === 1 &&
            <div className="reviseBtn"
              onClick={()=>{setCurrentTab(2);}}
            >
              <p>프로필 수정하기</p>
            </div>
          }          
          {
            currentTab === 1
            ?
            <div className="subpage__main__content">
              
              <div className="main__content">
                <div className="textarea">
                  <div className="textrow">
                    <h3>계정</h3>
                    <p>{userProfile?.userAccount}</p>
                  </div>
                  <div className="textrow">
                    <h3>닉네임</h3>
                    <p>{userProfile?.userNickName}</p>
                  </div>
                  <div className="textrow">
                    <h3>직분</h3>
                    <p>{userProfile?.userSort}</p>
                  </div>
                  <div className="textrow">
                    <h3>상세</h3>
                    <p>{userProfile?.userDetail}</p>
                  </div>
                  <div className="textrow">
                    <h3>가입경로</h3>
                    <p>{userProfile?.userURL}</p>
                  </div>
                </div>
              </div>

              <div className='divider'></div>

              <div className="reviseBtn"
                onClick={()=>{setCurrentTab(2);}}
              >
                <p>프로필 수정하기</p>
              </div>
            </div>
            :
            // 프로필수정 -------------------------------------------------------------------------------------------------------------------------
            <div className="subpage__main__content">
              
              <div className="main__content">
                <div className="textarea">
                  <div className="textrow">
                    <h3>닉네임</h3>
                    <input value={userNickName} className="profileinputdefault" type="text" 
                      onChange={(e) => {setUserNickName(e.target.value)}}/>
                  </div>
                  <div className="textrow">
                    <h3>직분</h3>
                    <input value={userSort} className="profileinputdefault" type="text" 
                      onChange={(e) => {setUserSort(e.target.value)}}/>
                  </div>
                  <div className="textrow">
                    <h3>상세</h3>
                    <input value={userDetail} className="profileinputdefault" type="text" 
                      onChange={(e) => {setUserDetail(e.target.value)}}/>
                  </div>
                </div>
              </div>

              <div className='divider'></div>

              {
                userURL === 'email' &&
                <div className="reviseBtn" 
                  onClick={()=>{
                    setIsViewPasswdChange(true);
                  }}
                >
                  <p>비밀번호 변경</p>
                </div>
              }
              {
                isViewPasswdChange &&
                <>
                <div className="main__content">
                  <div className="textarea">
                    <div className="textrow">
                      <h3>현재 비번</h3>
                      <input value={passwordCurrent} className="profileinputdefault" type="password" 
                        onChange={(e) => {setPasswordCurrent(e.target.value)}}/>
                    </div>
                    <div className="textrow">
                      <h3>변경할 비번</h3>
                      <input value={passwordChange} className="profileinputdefault" type="password" 
                        onChange={(e) => {setPasswordChange(e.target.value)}}/>
                    </div>
                  </div>
                </div>
                <div className="reviseBtn" style={{borderColor:'#333'}}
                  onClick={handlePasswdChange}
                >
                  <p>변경완료</p>
                </div>
                </>
              }
              
              <div className="reviseBtn" 
                onClick={()=>{
                  setCurrentTab(1);
                }}
              >
                <p>이전</p>
              </div>
              <div className="reviseBtn" 
                onClick={handleRevise}
              >
                <p>수정완료</p>
              </div>
              
              {
                !isViewDeleteAccount &&
                <div className='accountDeleteBtn'>
                  <div className='deleteBtnBox'
                    onClick={()=>{setIsViewDeleteAccount(true)}}
                  >
                    <p className='deleteBtn'>회원탈퇴</p>
                  </div>
                </div>
              }
              {
                isViewDeleteAccount &&
                <>
                <div className="deleteAccountBox">
                  <div className="deleteAccountCover">
                    <h1>탈퇴시 모든 정보가 사라지며, 복구할 수 없습니다.</h1>
                    <h2>* 유의 사항 안내</h2>
                    <div>
                      <p>1. 회원 탈퇴 시, 즉시 탈퇴 처리되며, 서비스 이용이 불가합니다.</p>
                    </div>
                    <div>
                      <p>2. 기존에 작성한 게시물 및 댓글은 자동으로 삭제되지 않습니다.</p>
                      <p>또한 탈퇴 이후에는 작성자 본인을 확인할 수 없으므로,</p>
                      <p>모든 게시물의 권한은 전적으로 운영진에게 위임됩니다.</p>
                    </div>
                    <div>
                      <p>3. 회원 정보는 탈퇴 즉시 삭제되지만, 부정 이용 거래 방지 및 전자상거래법 등 관련 법령에 따라, </p>
                      <p>보관이 필요할 경우 해당 기간 동안 회원 정보가 보관 될 수 있습니다.</p>
                    </div>
                  </div>
                </div>
                <div className="deletecheckInputCover">
                  <div className='deletecheckInput'>
                    <input className="deleteinput" type="checkbox"
                        checked={agreeDeleteAccount}
                        onChange={()=>{setAgreeDeleteAccount(!agreeDeleteAccount)}}
                      />
                      <h5>유의사항을 확인했습니다.</h5>
                  </div>
                </div>

                <div className="reviseBtn" 
                  onClick={()=>{
                    setIsViewDeleteAccount(false);
                  }}
                >
                  <p>취소</p>
                </div>
                <div className="reviseBtn" style={{borderColor:agreeDeleteAccount? '#333' : '#EAEAEA'}}
                  onClick={()=>{
                    agreeDeleteAccount ? handleDeleteAccount() : alert('유의사항을 확인에 체크해주세요!')
                  }}
                >
                  <p>탈퇴하기</p>
                </div>
                </>
              }
              
              
            </div>
          }
        </div> 
      </div>


      <Footer />
    </div>
  )
}
