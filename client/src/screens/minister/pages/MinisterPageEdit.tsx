import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import youtubePlay from '../../../images/Youtube_logo.png';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import MainURL from '../../../MainURL';
import './MinisterPageEdit.scss';

type FormTab = 'intro' | 'youtube';
type PersonInfo = { religiousbody: string; church: string; dutyTitle: string; sort: string; ministryFields: string[] };
type ProfileItem = { year: string; content: string[] };
type YoutubeItem = { link: string; thumbnail: string };
type Contact = { email: string; phone: string };

const FORM_TABS: { id: FormTab; label: string }[] = [
  { id: 'intro', label: '소개' },
  { id: 'youtube', label: '유튜브' },
];

const parseJson = <T,>(raw: unknown, fallback: T): T => {
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (_e) {
    return fallback;
  }
};

const imageCompressionOptions = { maxSizeMB: 1, maxWidthOrHeight: 1000 };
const imgUrl = (folder: string, fileName: string) => (fileName ? `${MainURL}/images/minister/${folder}/${fileName}` : '');

function SimpleDropzone({
  text,
  onDrop,
  disabled,
}: {
  text: string;
  onDrop: (files: File[]) => void;
  disabled?: boolean;
}) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => files.length && onDrop(files),
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled,
  });
  return (
    <div {...getRootProps()} className={`minister-edit__dropzone ${disabled ? 'is-disabled' : ''}`}>
      <input {...getInputProps()} />
      <p>{text}</p>
    </div>
  );
}

export default function MinisterPageEditV2() {
  const location = useLocation();
  const navigate = useNavigate();
  const [postId, setPostId] = useState(() => {
    const fromQuery = new URLSearchParams(location.search).get('id') || '';
    const fromState = (location.state as { id?: string } | null)?.id || '';
    return fromQuery || fromState;
  });
  const [activeTab, setActiveTab] = useState<FormTab>('intro');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [sort, setSort] = useState('');
  const [name, setName] = useState('');
  const [subNameSort, setSubNameSort] = useState('');
  const [personInfo, setPersonInfo] = useState<PersonInfo>({ religiousbody: '', church: '', dutyTitle: '', sort: '', ministryFields: [] });
  const [mainImage, setMainImage] = useState('');
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [profile, setProfile] = useState<ProfileItem[]>([{ year: '', content: [''] }]);
  const [images, setImages] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<(File | null)[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [youtube, setYoutube] = useState<YoutubeItem[]>([{ link: '', thumbnail: '' }]);
  const [youtubeFiles, setYoutubeFiles] = useState<(File | null)[]>([]);
  const [youtubePreviews, setYoutubePreviews] = useState<string[]>([]);
  const [contact, setContact] = useState<Contact>({ email: '', phone: '' });

  useEffect(() => {
    const fromQuery = new URLSearchParams(location.search).get('id') || '';
    const fromState = (location.state as { id?: string } | null)?.id || '';
    const fromNav = fromQuery || fromState;
    if (fromNav) setPostId(fromNav);
  }, [location.search, location.state]);

  const fitGalleryArrays = useCallback((size: number) => {
    setGalleryFiles((prev) => [...prev.slice(0, size), ...Array(Math.max(0, size - prev.length)).fill(null)]);
    setGalleryPreviews((prev) => [...prev.slice(0, size), ...Array(Math.max(0, size - prev.length)).fill('')]);
  }, []);

  const fitYoutubeArrays = useCallback((size: number) => {
    setYoutubeFiles((prev) => [...prev.slice(0, size), ...Array(Math.max(0, size - prev.length)).fill(null)]);
    setYoutubePreviews((prev) => [...prev.slice(0, size), ...Array(Math.max(0, size - prev.length)).fill('')]);
  }, []);

  const compressFile = async (file: File) => {
    const compressed = await imageCompression(file, imageCompressionOptions);
    return new File([compressed], file.name, { type: file.type });
  };

  const ensurePostId = async (currentId: string) => {
    if (currentId) return currentId;
    const res = await axios.post(`${MainURL}/minister/createnew`, {});
    if (!res.data || typeof res.data !== 'object' || !res.data.success || !res.data.id) {
      throw new Error('CREATE');
    }
    return String((res.data as { id: unknown }).id);
  };

  const handleSaveAll = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const id = await ensurePostId(postId);

      await axios.post(`${MainURL}/ministeredit/savebasicinfo`, {
        postId: id,
        sort,
        name,
        subNameSort,
        personInfo: JSON.stringify(personInfo),
      });
      await axios.post(`${MainURL}/ministeredit/saveprofile`, {
        postId: id,
        profile: JSON.stringify(profile),
      });
      await axios.post(`${MainURL}/ministeredit/savecontact`, {
        postId: id,
        contact: JSON.stringify(contact),
      });

      if (mainImageFile) {
        const formData = new FormData();
        formData.append('postId', id);
        formData.append('img', await compressFile(mainImageFile));
        const res = await axios.post(`${MainURL}/ministeredit/savemainimage`, formData);
        if (res.data?.success && res.data.fileName) {
          setMainImage(String(res.data.fileName));
          setMainImageFile(null);
          setMainImagePreview('');
        }
      }

      let nextImages = [...images];
      for (let i = 0; i < galleryFiles.length; i += 1) {
        const file = galleryFiles[i];
        if (!file) continue;
        const formData = new FormData();
        formData.append('postId', id);
        formData.append('index', String(i));
        formData.append('img', await compressFile(file));
        const res = await axios.post(`${MainURL}/ministeredit/savegallery`, formData);
        if (res.data?.fileName) nextImages[i] = String(res.data.fileName);
      }
      const filtered = nextImages.filter(Boolean);
      await axios.post(`${MainURL}/ministeredit/savegalleryorder`, {
        postId: id,
        images: JSON.stringify(filtered),
      });
      setImages(filtered);
      fitGalleryArrays(filtered.length);

      let nextYoutube = [...youtube];
      for (let i = 0; i < youtubeFiles.length; i += 1) {
        const file = youtubeFiles[i];
        if (!file) continue;
        const formData = new FormData();
        formData.append('postId', id);
        formData.append('index', String(i));
        formData.append('img', await compressFile(file));
        const res = await axios.post(`${MainURL}/ministeredit/saveyoutubethumb`, formData);
        if (res.data?.fileName) nextYoutube[i] = { ...nextYoutube[i], thumbnail: String(res.data.fileName) };
      }
      await axios.post(
        `${MainURL}/ministeredit/saveyoutube?postId=${encodeURIComponent(id)}&youtube=${encodeURIComponent(JSON.stringify(nextYoutube))}`
      );
      setYoutube(nextYoutube);
      fitYoutubeArrays(nextYoutube.length);

      setPostId(id);
      navigate(`/minister/edit?id=${encodeURIComponent(id)}`, { replace: true });
      window.alert('저장되었습니다.');
    } catch (e) {
      if (e && typeof e === 'object' && (e as Error).message === 'CREATE') {
        window.alert('페이지를 처음 만들지 못했습니다. 잠시 후 다시 시도해 주세요.');
      } else {
        console.error(e);
        window.alert('저장 중 오류가 발생했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await axios.post(`${MainURL}/minister/getdataministerspart`, { id: postId });
      const packet = res?.data;
      if (packet === false) return;
      const row = Array.isArray(packet)
        ? packet[0]
        : packet && typeof packet === 'object' && (packet as { data?: unknown[] }).data
          ? (packet as { data: unknown[] }).data[0]
          : null;
      if (row == null || Array.isArray(row)) return;

      setSort(String(row.sort ?? ''));
      setName(String(row.name ?? ''));
      setSubNameSort(String(row.subNameSort ?? ''));
      setMainImage(String(row.mainImage ?? ''));
      setMainImageFile(null);
      setMainImagePreview('');

      const parsedPersonInfo = parseJson<PersonInfo>(row.personInfo, { religiousbody: '', church: '', dutyTitle: '', sort: '', ministryFields: [] });
      setPersonInfo({ ...parsedPersonInfo, ministryFields: Array.isArray(parsedPersonInfo.ministryFields) ? parsedPersonInfo.ministryFields : [] });

      const parsedProfile = parseJson<ProfileItem[]>(row.profile, [{ year: '', content: [''] }]);
      setProfile(Array.isArray(parsedProfile) && parsedProfile.length ? parsedProfile : [{ year: '', content: [''] }]);

      const parsedImages = parseJson<string[]>(row.images, []);
      const nextImages = Array.isArray(parsedImages) ? parsedImages.filter(Boolean) : [];
      setImages(nextImages);
      fitGalleryArrays(nextImages.length);

      const parsedYoutube = parseJson<YoutubeItem[]>(row.youtube, [{ link: '', thumbnail: '' }]);
      const nextYoutube = Array.isArray(parsedYoutube) && parsedYoutube.length ? parsedYoutube : [{ link: '', thumbnail: '' }];
      setYoutube(nextYoutube);
      fitYoutubeArrays(nextYoutube.length);

      const parsedContact = parseJson<Contact>(row.contact, { email: '', phone: '' });
      setContact({ email: String(parsedContact.email ?? ''), phone: String(parsedContact.phone ?? '') });
    } catch (error) {
      console.error(error);
      alert('사역자 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [fitGalleryArrays, fitYoutubeArrays, postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const mainPreviewSrc = mainImagePreview || (mainImage ? imgUrl('mainimage', mainImage) : '');

  const heroSubtitle = useMemo(
    () => (subNameSort === '구분' ? personInfo.sort : personInfo.dutyTitle),
    [subNameSort, personInfo.sort, personInfo.dutyTitle]
  );

  const galleryPreviewList = useMemo(
    () =>
      images.map((img, idx) => ({
        key: `g-${idx}`,
        src: galleryPreviews[idx] || (img ? imgUrl('gallery', img) : ''),
      })),
    [images, galleryPreviews]
  );

  const hasYoutubeToShow = useMemo(
    () => youtube.length > 0 && youtube.some((y, i) => Boolean((y.link || y.thumbnail || youtubePreviews[i] || '').toString().trim())),
    [youtube, youtubePreviews]
  );

  return (
    <div className="minister-edit">
      <div className="minister-edit__inner">
        <aside className="minister-edit__preview-wrap" aria-label="미리보기">
          <div className="minister-edit__phone-frame">
            <div className="minister-edit__phone-notch" />
            <div className="minister-edit__phone-screen">
              <div className="minister-edit__phone-body">
                <div className="ministerDetail ministerDetail--editPreview">
                  <div className="inner">
                    <div className="subpage__main" style={{ width: '100%' }}>
                      <div className="homapage_main">
                        <div className="homapage_main_imagebox">
                          {mainPreviewSrc ? <img src={mainPreviewSrc} alt="mainImage" /> : <div className="homapage_main_imagebox-empty" aria-hidden />}
                          <div className="homapage_main_title">
                            <div>
                              <p className="homapage_main_title-name">{name}</p>
                            </div>
                            <div>
                              <p className="homapage_main_title-sort">{heroSubtitle}</p>
                            </div>
                          </div>
                        </div>

                        <div className="after_hero">
                          <div className="personalpage_detail_bottomRow" />

                          <div className="personalpage_detail_titlebox">
                            <p className="personalpage_detail_title">INFO</p>
                          </div>
                          <div className="profile_card">
                            <div className="profile_card_left">
                              {mainPreviewSrc ? (
                                <img className="profile_avatar" src={mainPreviewSrc} alt="profile" />
                              ) : (
                                <div className="profile_avatar profile_avatar--empty" />
                              )}
                            </div>
                            <div className="profile_card_right">
                              <div className="profile_row">
                                <span className="profile_key">이름</span>
                                <span className="profile_value">
                                  {name} {personInfo.dutyTitle}
                                </span>
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
                                <span className="profile_value">
                                  {Array.isArray(personInfo.ministryFields) ? personInfo.ministryFields.join(', ') : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="personalpage_detail_bottomRow" />

                          <div className="personalpage_detail_titlebox">
                            <p className="personalpage_detail_title">PROFILE</p>
                          </div>
                          <div className="journey">
                            {profile.length > 0 &&
                              profile.map((item, index) => (
                                <div className="journey_item" key={index}>
                                  <div className="journey_year">{item.year}</div>
                                  <div className="journey_content">
                                    {item.content.map((line, subindex) => (
                                      <div className="journey_text_indented" key={subindex}>
                                        {line}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>

                          <div className="personalpage_detail_bottomRow" />

                          <div className="personalpage_detail_titlebox">
                            <p className="personalpage_detail_title">GALLERY</p>
                          </div>
                          <div className="personalpage-imagebox" style={{ flexDirection: 'column', gap: 20 }}>
                            {galleryPreviewList
                              .filter((g) => g.src)
                              .map((g) => (
                                <img key={g.key} src={g.src} alt="" />
                              ))}
                          </div>

                          <div className="personalpage_detail_bottomRow" />

                          {hasYoutubeToShow && (
                            <>
                              <div className="personalpage_detail_titlebox">
                                <p className="personalpage_detail_title">VIDEOS</p>
                              </div>
                              <div className="youtube_section">
                                {youtube.map((item, index) => {
                                  const thumb =
                                    item.thumbnail && (item.thumbnail.startsWith('http') ? item.thumbnail : imgUrl('thumbnail', item.thumbnail));
                                  const thumbFromPreview = youtubePreviews[index];
                                  const displayThumb = thumbFromPreview || thumb;
                                  if (!item.link && !displayThumb) return null;
                                  return (
                                    <div
                                      key={index}
                                      className="youtube_imagebox"
                                      onClick={() => {
                                        if (item.link) window.open(item.link, '_blank', 'noopener,noreferrer');
                                      }}
                                    >
                                      <img
                                        src={displayThumb || '/placeholder-video.jpg'}
                                        alt="youtube"
                                        className="youtube_image_thumbnail"
                                      />
                                      <div className="youtube_image_playbtn_cover">
                                        <img src={youtubePlay} alt="play" className="youtube_image_playbtn_image" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="personalpage_detail_bottomRow" />
                            </>
                          )}

                          <div className="personalpage_detail_titlebox">
                            <p className="personalpage_detail_title">CONTACT</p>
                          </div>
                          <div className="personalpage-contactbox">
                            <div className="personalpage-contact-content">
                              <p className="personalpage-contact-part">{personInfo.dutyTitle}</p>
                              <p className="personalpage-contact-nameEn">{name}</p>
                              {contact?.phone && (
                                <p className="personalpage-contact-phone">
                                  Phone: <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                                </p>
                              )}
                              {contact?.email && <p className="personalpage-contact-email">Email: {contact.email}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="minister-edit__form-wrap">
          <div className="minister-edit__form-tabs">
            {FORM_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`minister-edit__form-tab ${activeTab === tab.id ? 'on' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="minister-edit__empty">불러오는 중...</div>
          ) : (
            <div className="minister-edit__form-content">
              {activeTab === 'intro' && (
                <>
                  <div className="notice-create__form-block">
                    <h3 className="notice-create__form-block-title">메인 사진</h3>
                    <div className="notice-create__form">
                      <div className="notice-create__label">
                        <span className="notice-create__label-text">이미지</span>
                        <div className="notice-create__form-field-grow">
                          <SimpleDropzone
                            text="메인 이미지 업로드"
                            disabled={saving}
                            onDrop={async (files) => {
                              const file = files[0];
                              if (!file) return;
                              const compressed = await compressFile(file);
                              setMainImageFile(compressed);
                              setMainImagePreview(URL.createObjectURL(compressed));
                            }}
                          />
                          {mainPreviewSrc ? <img src={mainPreviewSrc} className="minister-edit__main-img" alt="대표 이미지 미리보기" /> : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="notice-create__form-block">
                    <h3 className="notice-create__form-block-title">기본 정보</h3>
                    <div className="notice-create__form">
                      <label className="notice-create__label" htmlFor="minister-edit-sort">
                        <span className="notice-create__label-text">정렬</span>
                        <input
                          id="minister-edit-sort"
                          type="text"
                          className="notice-create__input"
                          value={sort}
                          placeholder="정렬"
                          onChange={(e) => setSort(e.target.value)}
                        />
                      </label>
                      <label className="notice-create__label" htmlFor="minister-edit-name">
                        <span className="notice-create__label-text">이름</span>
                        <input
                          id="minister-edit-name"
                          type="text"
                          className="notice-create__input"
                          value={name}
                          placeholder="이름"
                          onChange={(e) => setName(e.target.value)}
                        />
                      </label>
                      <label className="notice-create__label" htmlFor="minister-edit-subname">
                        <span className="notice-create__label-text">부제</span>
                        <input
                          id="minister-edit-subname"
                          type="text"
                          className="notice-create__input"
                          value={subNameSort}
                          placeholder="부제"
                          onChange={(e) => setSubNameSort(e.target.value)}
                        />
                      </label>
                      <label className="notice-create__label" htmlFor="minister-edit-religious">
                        <span className="notice-create__label-text">교단</span>
                        <input
                          id="minister-edit-religious"
                          type="text"
                          className="notice-create__input"
                          value={personInfo.religiousbody}
                          placeholder="교단"
                          onChange={(e) => setPersonInfo((prev) => ({ ...prev, religiousbody: e.target.value }))}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="notice-create__form-block">
                    <h3 className="notice-create__form-block-title">프로필</h3>
                    {profile.map((item, idx) => (
                      <div className="notice-create__worship-row" key={idx}>
                        <div className="notice-create__form">
                          <label className="notice-create__label" htmlFor={`minister-profile-year-${idx}`}>
                            <span className="notice-create__label-text">연도</span>
                            <input
                              id={`minister-profile-year-${idx}`}
                              type="text"
                              className="notice-create__input"
                              value={item.year}
                              onChange={(e) => {
                                setProfile((prev) => prev.map((old, i) => (i === idx ? { ...old, year: e.target.value } : old)));
                              }}
                              placeholder="연도"
                            />
                          </label>
                          <label className="notice-create__label" htmlFor={`minister-profile-content-${idx}`}>
                            <span className="notice-create__label-text">내용</span>
                            <input
                              id={`minister-profile-content-${idx}`}
                              type="text"
                              className="notice-create__input"
                              value={item.content[0] ?? ''}
                              onChange={(e) => {
                                setProfile((prev) => prev.map((old, i) => (i === idx ? { ...old, content: [e.target.value] } : old)));
                              }}
                              placeholder="내용"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="notice-create__form-block">
                    <h3 className="notice-create__form-block-title">갤러리</h3>
                    <div className="notice-create__form">
                      {images.map((img, idx) => (
                        <div className="notice-create__label minister-edit__gallery-line" key={idx}>
                          <span className="notice-create__label-text">{`이미지 ${idx + 1}`}</span>
                          <div className="notice-create__form-field-grow minister-edit__gallery-line-inner">
                            <img
                              src={galleryPreviews[idx] || imgUrl('gallery', img)}
                              className="minister-edit__thumb"
                              alt={`갤러리 ${idx + 1}`}
                            />
                            <input
                              type="file"
                              accept="image/*"
                              className="minister-edit__file-narrow"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const compressed = await compressFile(file);
                                setGalleryFiles((prev) => prev.map((old, i) => (i === idx ? compressed : old)));
                                setGalleryPreviews((prev) => prev.map((old, i) => (i === idx ? URL.createObjectURL(compressed) : old)));
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="notice-create__form-block">
                    <h3 className="notice-create__form-block-title">연락처</h3>
                    <div className="notice-create__form">
                      <label className="notice-create__label" htmlFor="minister-edit-email">
                        <span className="notice-create__label-text">이메일</span>
                        <input
                          id="minister-edit-email"
                          type="text"
                          className="notice-create__input"
                          value={contact.email}
                          placeholder="이메일"
                          onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      </label>
                      <label className="notice-create__label" htmlFor="minister-edit-phone">
                        <span className="notice-create__label-text">전화번호</span>
                        <input
                          id="minister-edit-phone"
                          type="text"
                          className="notice-create__input"
                          value={contact.phone}
                          placeholder="전화번호"
                          onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value }))}
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'youtube' && (
                <div className="notice-create__form-block">
                  <h3 className="notice-create__form-block-title">유튜브</h3>
                  {youtube.map((item, idx) => (
                    <div className="notice-create__worship-row" key={idx}>
                      <div className="notice-create__form">
                        <label className="notice-create__label" htmlFor={`minister-yt-link-${idx}`}>
                          <span className="notice-create__label-text">동영상 링크</span>
                          <input
                            id={`minister-yt-link-${idx}`}
                            type="text"
                            className="notice-create__input"
                            value={item.link}
                            placeholder="https://..."
                            onChange={(e) => {
                              setYoutube((prev) => prev.map((old, i) => (i === idx ? { ...old, link: e.target.value } : old)));
                            }}
                          />
                        </label>
                        {youtubePreviews[idx] || item.thumbnail ? (
                          <div className="notice-create__label">
                            <span className="notice-create__label-text">썸네일</span>
                            <img
                              src={youtubePreviews[idx] || imgUrl('thumbnail', item.thumbnail)}
                              className="minister-edit__thumb"
                              alt={`유튜브 ${idx + 1}`}
                            />
                          </div>
                        ) : null}
                        <div className="notice-create__label">
                          <span className="notice-create__label-text">썸네일 파일</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="minister-edit__file-narrow"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const compressed = await compressFile(file);
                              setYoutubeFiles((prev) => prev.map((old, i) => (i === idx ? compressed : old)));
                              setYoutubePreviews((prev) => prev.map((old, i) => (i === idx ? URL.createObjectURL(compressed) : old)));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="notice-create__nav-btns minister-edit__save-bar">
                {!postId && (
                  <p className="minister-edit__save-hint">입력이 끝난 뒤 저장하면 페이지가 서버에 만들어집니다.</p>
                )}
                <button
                  type="button"
                  className="notice-create__next-btn minister-edit__save-btn"
                  onClick={handleSaveAll}
                  disabled={saving}
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
