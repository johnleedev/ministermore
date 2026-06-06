import React, { useEffect, useState } from 'react';
import '../Admin.scss'
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../MainURL';
import { themesList } from '../../DefaultData';
import { formatDate } from 'date-fns';


export default function WorshipManageAdmin (props:any) {


  let navigate = useNavigate();
  const location = useLocation(); 
  const revieseData = location.state;
  const pptItemsCopy = revieseData?.pptlist ? JSON.parse(revieseData.pptlist) : [];
  const youtubeItemsCopy = revieseData?.youtubelist ? JSON.parse(revieseData.youtubelist) : [];
  

  interface ListProps {
    id : number,
    bookletId: string;
    title : string;
    keySort : string;
    theme : string[];
    image: string;
    source : string;
  }
  
  const currentdate = new Date();
  const today = formatDate(currentdate, 'yyyy-MM-dd');
  const [pptItems, setPptItems] = useState<PptItem[]>(pptItemsCopy);
  const [youtubeItems, setYoutubeItems] = useState<YoutubeItem[]>(youtubeItemsCopy);

  const openInNewTab = (url?: string) => {
    if (!url) return; 
    window.open(url, '_blank');
  };

  const savePptOnly = async () => {
    try {
      const payload = JSON.stringify(pptItems || []);
      await axios.post(`${MainURL}/worshipsongs/revisesongppt`, { id: postId, pptlist: payload });
      alert('PPT 리스트가 저장되었습니다.');
    } catch {
      alert('PPT 저장 실패');
    }
  };

  const saveYoutubeOnly = async () => {
    try {
      const payload = JSON.stringify(youtubeItems || []);
      await axios.post(`${MainURL}/worshipsongs/revisesongyoutube`, { id: postId, youtubelist: payload });
      alert('YouTube 리스트가 저장되었습니다.');
    } catch {
      alert('YouTube 저장 실패');
    }
  };


  

  const keyList = [
    "C", "Db", "D", "Eb", "E", "F", "G", "Ab", "A", "Bb", "B",
  ];

  const [refresh, setRefresh] = useState<boolean>(false); 
  const [postId, setPostId] = useState(revieseData?.id || 0);
  const [title, setTitle] = useState(revieseData?.title || '');
  const [keySort, setKeySort] = useState(revieseData?.keySort || '');
  const [theme, setTheme] = useState<string[]>(revieseData?.theme || []);
  const [image, setImage] = useState(revieseData?.image || '');
  const [source, setSource] = useState(revieseData?.source || '');
  const [lyrics, setLyrics] = useState<string>(revieseData?.lyrics || '');
  const [pptlist, setPptlist] = useState<string>(revieseData?.pptlist || '');
  const [youtubelist, setYoutubelist] = useState<string>(revieseData?.youtubelist || '');

  type PptItem = {
    link?: string;
    img_src?: string;
    page_name?: string;
    source_img?: string;
    site_name?: string;
  };
  type YoutubeItem = {
    link?: string;
    img_src?: string;
    title_name?: string;
    source_img?: string;
    channel_name?: string;
  };
 
 
  const reviseData = async () => {
    axios 
      .post(`${MainURL}/worshipsongswork/revisesong`, {
          id: postId,
          title: title,
          theme : theme.join(','),
          keySort: keySort, 
          image : image,
          source : source,
          lyrics: lyrics,
          pptlist: JSON.stringify(pptItems || []),
          youtubelist: JSON.stringify(youtubeItems || []),
      })
      .then((res) => {
        if (res.data) {
          alert('수정되었습니다.');
          // fetchPosts();
        }
      })
      .catch(() => {
        console.log('실패함')
      })
  };

  const reviseTheme = async () => {

    axios 
      .post(`${MainURL}/worshipsongswork/revisesongtheme`, {
          id: postId,
          theme : theme.join(',')
      })
      .then((res) => {
        if (res.data) {
          alert('수정되었습니다.');
          // fetchPosts();
        }
      })
      .catch(() => {
        console.log('실패함')
      })
  };

  
 
  const reviseImage = async () => {
    axios 
      .post(`${MainURL}/worshipsongswork/revisesongimage`, {
          id: postId,
          image : image,
          source : source
      })
      .then((res) => {
        if (res.data) {
          alert('수정되었습니다.');
          // fetchPosts();
        }
      })
      .catch(() => {
        console.log('실패함')
      })
  };

 
  return (
    <div className="admin-register">

      <div className="inner">

    
        <div className="top-cover">
          <div className="left-box">
            <div className="inputbox">
              <div className='name'>
                <p>곡명</p>
              </div>
              <input type='text'  style={{minHeight:'40px'}}
                onChange={(e)=>{setTitle(e.target.value)}} value={title} />
            </div>
            <div className="inputbox">
              <div className='name'>
                <p>키</p>
              </div>
              <input type='text'  style={{minHeight:'40px'}}
                onChange={(e)=>{setKeySort(e.target.value)}} value={keySort} />
            </div>
            <div className="inputbox">
              <div className='name'>
                <p>주제</p>
              </div>
              <input type='text'  style={{minHeight:'40px'}}
                value={theme.join(', ')} 
                readOnly
                placeholder="아래에서 주제를 선택하세요"
              />
            </div>
            <div className="inputbox">
              <div className='name'>
                <p>이미지</p>
              </div>
              <textarea  style={{minHeight:'100px'}}
                onChange={(e)=>{setImage(e.target.value)}} value={image} />
            </div>
            <div className="inputbox">
              <div className='name'>
                <p>출처</p>
              </div>
              <input type='text'  style={{minHeight:'40px'}}
                onChange={(e)=>{
                  setSource(e.target.value);
                }} value={source} />
            </div>

            <div className="buttonbox" style={{marginBottom:'10px'}}>
              <div className="button"  style={{backgroundColor:'#ccc'}}
                onClick={()=>{
                  reviseImage();
                }}>
                <p>이미지수정</p>
              </div>
            </div>

            <div className="inputbox">
              <div className='name'>
                <p>가사</p>
              </div>
              <textarea style={{minHeight:'180px'}}
                onChange={(e)=>{setLyrics(e.target.value)}} value={lyrics} />
            </div>

            

            <div className='checkInputCover'>
              {
                keyList.map((item:any, index:any)=>{
                  return (
                    <div className={`checkInputbox ${keySort === item ? 'selected': ""}`} key={index}
                      onClick={()=>{
                        setKeySort((prevTheme:any) => 
                          prevTheme === item
                            ? ""
                            : item
                        );
                      }}
                    >
                      <p>{item}</p>
                    </div>
                  )
                })
              }
            </div>

            <div className="buttonbox" style={{marginBottom:'10px'}}>
              <div className="button"  style={{backgroundColor:'#ccc'}}
                onClick={()=>{
                  reviseTheme();
                }}>
                <p>주제수정</p>
              </div>
              <div className="button" style={{backgroundColor:'#ccc'}}
            onClick={()=>{
              setTheme([]);
            }}>
            <p>주제삭제</p>
          </div>
            </div>
            <div className="inputbox">
              <div className='name'>
                <p>주제</p>
              </div>
              <input type='text'  style={{minHeight:'40px'}}
                value={theme.join(', ')} 
                readOnly
                placeholder="아래에서 주제를 선택하세요"
              />
            </div>

            <div className='checkInputCover'>
              {
                themesList.map((item:any, index:any)=>{
                  return (
                    <div className={`checkInputbox ${theme.includes(item) ? 'selected': ""}`} key={index}
                      onClick={()=>{
                        setTheme(prevTheme => 
                          prevTheme.includes(item)
                            ? prevTheme.filter(e => e !== item) // 이미 존재하면 제거
                            : [...prevTheme, item] // 존재하지 않으면 추가
                        );
                      }}
                    >
                      <p>{item}</p>
                    </div>
                  )
                })
              }
            </div>

          </div>

         

          <div className="right-box">
            <div className="admin-imagebox">
              {
                image !== '' &&
                <img src={image} alt='profileImage'/>
              }
            </div>
          </div>
        </div>

        <div className="buttonbox" style={{marginBottom:'30px'}}>
          <div className="button"  style={{backgroundColor:'#ccc'}}
                onClick={()=>{
                  reviseTheme();
                }}>
                <p>주제수정</p>
              </div>
           <div className="button" style={{backgroundColor:'#ccc'}}
            onClick={()=>{
              setTheme([]);
            }}>
            <p>주제삭제</p>
          </div>
          <div className="button"  style={{backgroundColor:'#ccc'}}
            onClick={()=>{
              setImage('');
            }}>
            <p>이미지삭제</p>
          </div>
          <div className="button"  style={{backgroundColor:'#ccc'}}
            onClick={()=>{
              reviseImage();
            }}>
            <p>이미지수정</p>
          </div>
        </div>

        <div className="buttonbox" style={{marginBottom:'100px'}}>
          <div className="button" onClick={()=>{navigate(-1)}} style={{backgroundColor:'#ccc'}}>
            <p>뒤로가기</p>
          </div>
          <div className="button" onClick={reviseData} style={{backgroundColor:'#ccc'}}>
            <p>전체 수정하기</p>
          </div>
        </div>

        <div className="inputbox" style={{width:'100%'}}>
          <div className='name'>
            <p>PPT 상세 편집</p>
          </div>
          <div className='buttonbox' style={{marginBottom:'8px'}}>
            <div className='button' style={{backgroundColor:'#8B8B8B'}} onClick={()=>{
              setPptItems([...(pptItems || []), { link:'', img_src:'', page_name:'', source_img:'', site_name:'' }]);
            }}>
              <p>항목 추가</p>
            </div>
            <div className='button' style={{backgroundColor:'#8B8B8B'}} onClick={savePptOnly}>
              <p>PPT 저장</p>
            </div>
          </div>
          <div style={{width:'100%'}}>
            {pptItems && pptItems.length > 0 ? (
              pptItems.map((it, idx)=> (
                <div key={idx} style={{width:'100%', border:'1px solid #e5e5e5', padding:'12px', marginBottom:'12px', borderRadius:'8px', display:'grid', gridTemplateColumns:'200px 1fr', gap:'16px', alignItems:'start'}}>
                  <div>
                    {it.img_src ? (
                      <img src={it.img_src} alt='ppt' style={{width:'200px', height:'120px', objectFit:'cover', borderRadius:'6px'}} onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />
                    ) : (
                      <div style={{width:'200px', height:'120px', background:'#f1f1f1', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'#999'}}>No Image</div>
                    )}
                    <div className='buttonbox' style={{marginTop:'6px'}}>
                      <div className='button' style={{width:'50%', border:'1px solid #ccc', backgroundColor:'#fff'}} onClick={()=>openInNewTab(it.link)}>
                        <p>열기</p>
                      </div>
                      <div className='button' style={{width:'50%', border:'1px solid #ccc', backgroundColor:'#fff'}} onClick={()=>{
                        const copy = pptItems.filter((_, i)=> i !== idx); setPptItems(copy);
                      }}>
                        <p>삭제</p>
                      </div>
                    </div>
                  </div>
                  <div style={{width:'100%'}}>
                    <div className='inputbox' style={{width:'100%'}}>
                      <div className='name'><p>page_name</p></div>
                      <input type='text' style={{border:'1px solid #ccc', borderRadius:'6px', minHeight:'40px', marginBottom:'6px', width:'100%'}} value={it.page_name || ''} onChange={(e)=>{
                        const copy = [...pptItems]; copy[idx] = { ...copy[idx], page_name: e.target.value }; setPptItems(copy);
                      }} />
                    </div>
                    <div className='inputbox' style={{width:'100%'}}>
                      <div className='name'><p>site_name</p></div>
                      <input type='text' style={{border:'1px solid #ccc', borderRadius:'6px', minHeight:'40px', marginBottom:'6px', width:'100%'}} value={it.site_name || ''} onChange={(e)=>{
                        const copy = [...pptItems]; copy[idx] = { ...copy[idx], site_name: e.target.value }; setPptItems(copy);
                      }} />
                    </div>
                    <div className='inputbox' style={{width:'100%'}}>
                      <div className='name'><p>link</p></div>
                      <input type='text' style={{border:'1px solid #ccc', borderRadius:'6px', minHeight:'40px', marginBottom:'6px', width:'100%'}} value={it.link || ''} onChange={(e)=>{
                        const copy = [...pptItems]; copy[idx] = { ...copy[idx], link: e.target.value }; setPptItems(copy);
                      }} />
                    </div>
                    <div className='inputbox' style={{width:'100%'}}>
                      <div className='name'><p>img_src</p></div>
                      <input type='text' style={{border:'1px solid #ccc', borderRadius:'6px', minHeight:'40px', marginBottom:'6px', width:'100%'}} value={it.img_src || ''} onChange={(e)=>{
                        const copy = [...pptItems]; copy[idx] = { ...copy[idx], img_src: e.target.value }; setPptItems(copy);
                      }} />
                    </div>
                    <div className='inputbox' style={{width:'100%'}}>
                      <div className='name'><p>source_img</p></div>
                      <input type='text' style={{border:'1px solid #ccc', borderRadius:'6px', minHeight:'40px', marginBottom:'6px', width:'100%'}} value={it.source_img || ''} onChange={(e)=>{
                        const copy = [...pptItems]; copy[idx] = { ...copy[idx], source_img: e.target.value }; setPptItems(copy);
                      }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{color:'#777'}}>항목이 없습니다.</div>
            )}
          </div>
        </div>

        <div className="inputbox" style={{width:'100%'}}>
          <div className='name'>
            <p>YouTube 상세 편집</p>
          </div>
          <div className='buttonbox' style={{marginBottom:'8px'}}>
            <div className='button' style={{backgroundColor:'#8B8B8B'}} onClick={()=>{
              setYoutubeItems([...(youtubeItems || []), { link:'', img_src:'', title_name:'', source_img:'', channel_name:'' }]);
            }}>
              <p>항목 추가</p>
            </div>
            <div className='button' style={{backgroundColor:'#8B8B8B'}} onClick={saveYoutubeOnly}>
              <p>YouTube 저장</p>
            </div>
          </div>
          <div style={{width:'100%'}}>
            {youtubeItems && youtubeItems.length > 0 ? (
              youtubeItems.map((it, idx)=> (
                <div key={idx} style={{width:'100%', border:'1px solid #e5e5e5', padding:'12px', marginBottom:'12px', borderRadius:'8px', display:'grid', gridTemplateColumns:'200px 1fr', gap:'16px', alignItems:'start'}}>
                  <div>
                    {it.img_src ? (
                      <img src={it.img_src} alt='youtube' style={{width:'200px', height:'120px', objectFit:'cover', borderRadius:'6px'}} onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />
                    ) : (
                      <div style={{width:'200px', height:'120px', background:'#f1f1f1', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'#999'}}>No Image</div>
                    )}
                    <div className='buttonbox' style={{marginTop:'6px'}}>
                      <div className='button' style={{width:'50%', border:'1px solid #ccc', backgroundColor:'#fff'}} onClick={()=>openInNewTab(it.link)}>
                        <p>열기</p>
                      </div>
                      <div className='button' style={{width:'50%', border:'1px solid #ccc', backgroundColor:'#fff'}} onClick={()=>{
                        const copy = youtubeItems.filter((_, i)=> i !== idx); setYoutubeItems(copy);
                      }}>
                        <p>삭제</p>
                      </div>
                    </div>
                  </div>
                  <div style={{width:'100%'}}>
                    <div className='inputbox' style={{width:'100%'}}>
                      <div className='name'><p>title_name</p></div>
                      <input type='text' style={{border:'1px solid #ccc', borderRadius:'6px', minHeight:'40px', marginBottom:'6px', width:'100%'}} value={it.title_name || ''} onChange={(e)=>{
                        const copy = [...youtubeItems]; copy[idx] = { ...copy[idx], title_name: e.target.value }; setYoutubeItems(copy);
                      }} />
                    </div>
                    <div className='inputbox' style={{width:'100%'}}>
                      <div className='name'><p>channel_name</p></div>
                      <input type='text' style={{border:'1px solid #ccc', borderRadius:'6px', minHeight:'40px', marginBottom:'6px', width:'100%'}} value={it.channel_name || ''} onChange={(e)=>{
                        const copy = [...youtubeItems]; copy[idx] = { ...copy[idx], channel_name: e.target.value }; setYoutubeItems(copy);
                      }} />
                    </div>
                    <div className='inputbox' style={{width:'100%'}}>
                      <div className='name'><p>link</p></div>
                      <input type='text' style={{border:'1px solid #ccc', borderRadius:'6px', minHeight:'40px', marginBottom:'6px', width:'100%'}} value={it.link || ''} onChange={(e)=>{
                        const copy = [...youtubeItems]; copy[idx] = { ...copy[idx], link: e.target.value }; setYoutubeItems(copy);
                      }} />
                    </div>
                    <div className='inputbox' style={{width:'100%'}}>
                      <div className='name'><p>img_src</p></div>
                      <input type='text' style={{border:'1px solid #ccc', borderRadius:'6px', minHeight:'40px', marginBottom:'6px', width:'100%'}} value={it.img_src || ''} onChange={(e)=>{
                        const copy = [...youtubeItems]; copy[idx] = { ...copy[idx], img_src: e.target.value }; setYoutubeItems(copy);
                      }} />
                    </div>
                    <div className='inputbox' style={{width:'100%'}}>
                      <div className='name'><p>source_img</p></div>
                      <input type='text' style={{border:'1px solid #ccc', borderRadius:'6px', minHeight:'40px', marginBottom:'6px', width:'100%'}} value={it.source_img || ''} onChange={(e)=>{
                        const copy = [...youtubeItems]; copy[idx] = { ...copy[idx], source_img: e.target.value }; setYoutubeItems(copy);
                      }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{color:'#777'}}>항목이 없습니다.</div>
            )}
          </div>
        </div>

        
      

        

      </div>

      <div style={{height:'200px'}}></div>

    </div>
  )
}



