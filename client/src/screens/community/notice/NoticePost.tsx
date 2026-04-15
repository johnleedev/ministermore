import { useCallback, useState } from 'react';
import '../Community.scss';
import MainURL from '../../../MainURL';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPen } from "react-icons/fa";
import { useDropzone } from 'react-dropzone'
import imageCompression from "browser-image-compression";
import Loading from '../../../components/Loading';
import { CiCircleMinus } from "react-icons/ci";
import { format } from "date-fns";
import { useRecoilState } from 'recoil';
import { recoilUserData } from '../../../RecoilStore';

export default function NoticePost () {

  let navigate = useNavigate();
  const location = useLocation();
  const propsSort = location.state.sort;
  const [userData, setUserData] = useRecoilState(recoilUserData);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);


  // 이미지 첨부 함수 ----------------------------------------------
  const currentDate = new Date();
  const date = format(currentDate, 'yyyy-MM-dd');
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1000
      };
      const resizedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          setImageLoading(true);
          const resizingBlob = await imageCompression(file, options);
          return resizingBlob;
        })
      );
      const regexCopy = /[^a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|;:'",.<>]/g;
      const userIdCopy = userData?.userAccount.slice(0,5);
      const fileCopies = resizedFiles.map((resizedFile, index) => {
        const regex = resizedFile.name.replace(regexCopy, '');
        const regexSlice = regex.slice(-15);
        return new File([resizedFile], `${date}${userIdCopy}_${regexSlice}`, {
          type: acceptedFiles[index].type,
        });
      });
      setImageFiles(fileCopies);
      const imageNames = acceptedFiles.map((file, index) => {
        const regex = file.name.replace(regexCopy, '');
        const regexSlice = regex.slice(-15);
        return `${date}${userIdCopy}_${regexSlice}`;
      });
      setInputImages(imageNames);
      setImageLoading(false);
    } catch (error) {
      console.error('이미지 리사이징 중 오류 발생:', error);
    }
  }, [setImageFiles]);
  const { getRootProps, getInputProps } = useDropzone({ onDrop }); 
 

  // 첨부 이미지 삭제 ----------------------------------------------
  const deleteInputImage = async (Idx:number) => {
    const copy =  [...imageFiles]
    const newItems = copy.filter((item, i) => i !== Idx);
    setImageFiles(newItems);
  };

  // 자동 등업 하기
  const handleUserUpgrade = async () => {
    alert('등업 함수 실행')
    axios.post(`${MainURL}/appadmin/postupgrade`, {
      userAccount : userData.userAccount
    })
    .then((res)=>{
      if (res.data) {
        alert('등업되었습니다.')
      }
    }).catch((error)=>{
      console.error(error);
    })
  };

  // 글쓰기 등록 함수 ----------------------------------------------
  const datecopy = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss");
  const registerPost = async () => {
    const formData = new FormData();
    imageFiles.forEach((file, index) => {
      formData.append('img', file);
    });

    const getParams = {
      title : title,
      content: content,
      date : datecopy,
      sort : propsSort,
      userAccount : userData.userAccount,
      userNickName : userData.userNickName,
      postImage : JSON.stringify(inputImages)
    }
    axios 
      .post(`${MainURL}/board/posts`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: getParams,
      })
      .then((res) => {
        if (res.data) {
          if (propsSort === 'programsare' || propsSort === 'placereview') {
            setUserData({
              ...userData,
              grade : '정회원'
            })
          };
          if (propsSort === 'graderequest') {
            setUserData({
              ...userData,
              grade : '정회원'
            });
            alert('등업되었습니다.');
          } else {
            alert('등록되었습니다.');
          }
          navigate(-1);
        }
      })
      .catch(() => {
        console.log('실패함')
      })
  };


  return (
    <div className='community'>

      <div className="inner">

        <div className="subpage__main">
          <div className="subpage__main__title">
            {propsSort === 'nickname' && <h3>익명게시판</h3>}
            <div className='postBtnbox'
              style={{marginRight:'10px'}}
              onClick={()=>{navigate(-1);}}
            >
              <p>목록</p>
            </div>
          </div>
          
          <div className="subpage__main__content">

            <div className="warningBox">
              <p>장난스러운 글이나, 불건전하거나, 불법적인 내용 작성시, 경고 없이 곧바로 글은 삭제됩니다. 또한 사용자 계정은 서비스 사용에 제한이 있을 수 있습니다.</p>
            </div>

            <div className="userBox">
              <FaPen color='#334968' />
              <p>{propsSort === 'nickname' ? '익명' : userData.userNickName}</p>
            </div>
            <div className="addPostBox">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'end', marginTop:'20px'}}>
                <p>제목</p>
                <h5 style={{fontSize:'12px'}}>* 최대 200자</h5>
              </div>
              <input value={title} className="inputdefault" type="text" 
                maxLength={200}
                onChange={(e) => {setTitle(e.target.value)}}/>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'end', marginTop:'10px'}}>
                <p>본문</p>
                <h5 style={{fontSize:'12px'}}>* 최대 2000자</h5>
              </div>
              <textarea 
                className="textarea textareapost"
                value={content}
                maxLength={2000}
                onChange={(e)=>{setContent(e.target.value)}}
              />
              {
                propsSort !== 'graderequest' &&
                <p style={{marginTop:'20px'}}>사진 첨부</p>
              }
            </div>
            {
              <div className="imageInputBox">
              {
                imageLoading ?
                <div style={{width:'100%', height:'100%', position:'absolute'}}>
                  <Loading/>
                </div>
                :
                <div className='imageDropzoneCover'>
                  <div {...getRootProps()} className="imageDropzoneStyle" >
                    <input {...getInputProps()} />
                    {
                      imageFiles.length > 0 
                      ? <div className='imageplus'>+ 다시첨부하기</div>
                      : <div className='imageplus'>+ 사진첨부하기</div>
                    }
                  </div>
                </div>
              }
              {
                imageFiles.length > 0 &&
                imageFiles.map((item:any, index:any)=>{
                  return (
                    <div key={index} className='imagebox'>
                      <img 
                        src={URL.createObjectURL(item)}
                      />
                      <p>{item.name}</p>
                      <div onClick={()=>{deleteInputImage(index);}}>
                        <CiCircleMinus color='#FF0000' size={20}/>
                      </div>
                    </div>
                  )
                })
              }
              </div>
            }

            <div style={{width:'100%', height:'2px', backgroundColor:'#EAEAEA', margin:'10px 0'}}></div>

            <div className="buttonbox">
              <div className="button"
                onClick={()=>{
                  if (title === '') {
                    alert('제목을 작성해주세요.')
                  } else {
                    registerPost();
                  }
                  
                }}
              >
                <p>작성 완료</p>
              </div>
            </div>

           </div>

           

          
        </div>
      </div>

    </div>
  )
}



