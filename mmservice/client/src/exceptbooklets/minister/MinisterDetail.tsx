import React, { useEffect, useState } from 'react';
import './MinisterDetail.scss';
import { useNavigate } from 'react-router-dom';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import { motion } from 'framer-motion';
import axios from 'axios';
import MainURL from '../../MainURL';
import youtubePlay from '../../images/Youtube_logo.png';
import { useRecoilValue } from 'recoil';
import { recoilLoginState, recoilUserData } from '../../RecoilStore';


type MinisterItem = {
  id: string;
  isView: string;
  userAccount: string;
  sort: string;
  name: string;
  subNameSort: string;
  mainImage: string;
  personInfo: {
    religiousbody: string;
    church: string;
    dutyTitle: string;
    sort: string;
    ministryFields: string[];
  }
  profile: string;
  images: string;
  youtube: {
    thumbnail: string;
    link: string;
  }[];
  contact: {
    email: string;
    phone: string;
  }
  date: string;
};

export default function MinisterDetail () {
  const navigate = useNavigate();
  
  const url = new URL(window.location.href);
  const ID = url.searchParams.get("id");
  const isLogin = useRecoilValue(recoilLoginState);
	const userData = useRecoilValue(recoilUserData);


  const [ministerData, setMinisterData] = useState<MinisterItem | null>(null);
  const [personInfo, setPersonInfo] = useState<any>({});
  const [profile, setProfile] = useState<any>({});
  const [images, setImages] = useState<string[]>([]);
  const [youtube, setYoutube] = useState<any>([]);
  const [contact, setContact] = useState<any>({email: "", phone: ""});

  // const [imageFiles, setImageFiles] = useState<File[]>([]);


  // 게시글 가져오기
  const fetchPosts = async () => {
    const resMinister = await axios.post(`${MainURL}/minister/getdataministerspart`, {
      id : ID
    })
    const data = resMinister?.data;
    if (Array.isArray(data) && data.length > 0) {
      const row = data[0];
      const mapped: MinisterItem = {
        id: String(row?.id ?? row?._id ?? ''),
        isView: String(row?.isView ?? row?.title ?? ''),
        userAccount: String(row?.userAccount ?? ''),
        sort: String(row?.sort ?? ''),
        name: String(row?.name ?? ''),
        subNameSort: String(row?.subNameSort ?? ''),
        mainImage: String(row?.mainImage ?? ''),
        personInfo: JSON.parse(row?.personInfo ?? '{}'),
        profile: String(row?.profile ?? row?.profileImage ?? ''),
        images: String(row?.images ?? row?.imageUrl ?? ''),
        youtube: JSON.parse(row?.youtube ?? '[]'),
        contact: JSON.parse(row?.contact ?? '{"email": "", "phone": ""}'),
        date: String(row?.date ?? row?.createdAt ?? ''),
      };
      setMinisterData(mapped);
      const profile = JSON.parse(mapped.profile);
      const imageUrls = JSON.parse(mapped.images);
      setImages(imageUrls);
      setPersonInfo(mapped.personInfo);
      setProfile(profile);
      setYoutube(mapped.youtube);
      setContact(mapped.contact);
    }
  };


  useEffect(() => {
    fetchPosts();
  }, []);  


  
  return (
    <div className="ministerDetail">
      
      <div className="inner">
        <div className="subpage__main" style={{ width: '100%' }}>
          {/* HEADER / HERO */}
          <div className="homapage_main">
            <div className="homapage_main_imagebox">
              <img src={`${MainURL}/images/minister/mainimage/${ministerData?.mainImage}`} alt="mainImage" />
              <div className="homapage_main_title">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0 }}>
                  <p className="homapage_main_title-name">{ministerData?.name}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }}>
                  <p className="homapage_main_title-sort">{ministerData?.subNameSort === '구분' ? ministerData?.personInfo.sort : ministerData?.personInfo.dutyTitle}</p>
                </motion.div>
              </div>
              {
                (isLogin && ministerData?.userAccount === userData.userAccount) && (
                  <div className="edit_button_container">
                    <button 
                      className="edit_button"
                      onClick={() => navigate(`/minister/edit?id=${ID}`)}
                    >
                      수정하기
                    </button>
                  </div>
                )
              }
               {/* <div className="edit_button_container">
                  <button 
                    className="edit_button"
                    onClick={() => navigate(`/minister/edit?id=${ID}`)}
                  >
                    수정하기
                  </button>
                </div> */}
            </div>


            <div className="after_hero">
              <div className="personalpage_detail_bottomRow"></div>

            {/* CORE INFO CARD */}
            <div className="personalpage_detail_titlebox">
              <p className="personalpage_detail_title">INFO</p>
            </div>
            <div className="profile_card">
              <div className="profile_card_left">
                <img className="profile_avatar" src={`${MainURL}/images/minister/mainimage/${ministerData?.mainImage}`} alt="profile" />
              </div>
              <div className="profile_card_right">
                <div className="profile_row">
                  <span className="profile_key">이름</span>
                  <span className="profile_value">{ministerData?.name} {personInfo.dutyTitle}</span>
                </div>
                <div className="profile_row">
                  <span className="profile_key">구분</span>
                  <span className="profile_value">{personInfo.sort}</span>
                </div>
                <div className="profile_row">
                  <span className="profile_key">교단</span>
                  <span className="profile_value">{personInfo.religiousbody}</span>
                </div>
                <div className="profile_row">
                  <span className="profile_key">교회</span>
                  <span className="profile_value">{personInfo.church}</span>
                </div>
                <div className="profile_row">
                  <span className="profile_key">담당 사역</span>
                  <span className="profile_value">{Array.isArray(personInfo.ministryFields) ? personInfo.ministryFields.join(', ') : ''}</span>
                </div>
              </div>
            </div>

            <div className="personalpage_detail_bottomRow"></div>

            {/* JOURNEY TIMELINE */}
            <div className="personalpage_detail_titlebox">
              <p className="personalpage_detail_title">PROFILE</p>
            </div>
            <div className="journey">
              { profile.length > 0 &&
               profile.map((item:any, index:any) => {

                 return (
                   <div className="journey_item" key={index}>
                     <div className="journey_year">{item.year}</div>
                     <div className="journey_content">
                      {
                        item.content.map((content:any, subindex:any) => (
                          <div className="journey_text_indented" key={subindex}>{content}</div>
                        ))
                      }
                     </div>
                   </div>
                 );
               })}
            </div>


            <div className="personalpage_detail_bottomRow"></div>

            {/* IMAGE SECTION */}
            <div className="personalpage_detail_titlebox">
              <p className="personalpage_detail_title">GALLERY</p>
            </div>
            <div className="personalpage-imagebox" style={{ flexDirection: 'column', gap: 20 }}>
              {images.map((src, idx) => (
                <img key={idx} src={`${MainURL}/images/minister/gallery/${src}`} alt={`personal-${idx}`} />
              ))}
            </div>


            <div className="personalpage_detail_bottomRow"></div>

            {/* YOUTUBE VIDEOS SECTION */}
            {
              youtube.length > 0 && (
                <>
                <div className="personalpage_detail_titlebox">
                  <p className="personalpage_detail_title">VIDEOS</p>
                </div>
                <div className="youtube_section">
                  {youtube.map((item:any, index:any) => (
                    <div key={index} 
                    className="youtube_imagebox"  
                    onClick={() => window.open(item.link || `https://www.youtube.com/watch?v=${item.id}`, '_blank')}>  
                      <img src={item.thumbnail ? (item.thumbnail.startsWith('http') ? item.thumbnail : `${MainURL}/images/minister/thumbnail/${item.thumbnail}`) : '/placeholder-video.jpg'} alt="youtube" className="youtube_image_thumbnail"/>
                      <div  className="youtube_image_playbtn_cover">
                        <img src={youtubePlay} alt="play" className="youtube_image_playbtn_image" />
                      </div>
                    </div>
                  ))}
                </div>


                <div className="personalpage_detail_bottomRow"></div>
                </>
              )
            }
        
            

            {/* CONTACT SECTION */}
            <div className="personalpage_detail_titlebox">
              <p className="personalpage_detail_title">CONTACT</p>
            </div>
            <div className="personalpage-contactbox">
              <div className="personalpage-contact-content">
                <p className="personalpage-contact-part">{personInfo.dutyTitle}</p>
                <p className="personalpage-contact-nameEn">{ministerData?.name}</p>
                
                {
                  contact?.phone && (
                    <p className="personalpage-contact-phone">
                      Phone: <a href={`tel:${contact?.phone}`}>{contact?.phone}</a>
                    </p>
                  )
                }
                {
                  contact?.email && (
                    <p className="personalpage-contact-email">
                      Email: {contact?.email}
                    </p>
                  )
                }
              </div>
            </div>
           
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}