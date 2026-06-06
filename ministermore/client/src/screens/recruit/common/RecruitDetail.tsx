import './Recruit.scss'
import './RecruitList.scss'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MdArrowForwardIos, MdArrowBack } from 'react-icons/md'
import MainURL from '../../../MainURL'
import axios from 'axios'
import type { RecruitBoardConfig } from './RecruitTypes'
import { safeJsonParse } from './recruitUtils'

const DEFAULT_SORT_ITEM = [{ sort: '전임', content: '' }]
const DEFAULT_WORK_TIME_SUN = [{ sort: '전임', startHour: '09', startMinute: '00', endHour: '16', endMinute: '00' }]
const DEFAULT_WORK_TIME_WEEK = [{ sort: '전임', startHour: '09', startMinute: '00', endHour: '17', endMinute: '00', day: '평일' }]
const DEFAULT_PAY = [{ sort: '전임', paySort: 'select', selectCost: '', inputCost: '' }]
const DEFAULT_APPLYTIME = { startDay: '', endDay: '', daySort: '' }
const DEFAULT_INQUIRY = { inquiryName: '', email: '', phone: '' }

const listButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#333',
  color: '#fff',
  border: 'none',
  padding: '12px 20px',
  borderRadius: '10px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  width: 'fit-content',
}

export default function RecruitDetail({ config }: { config: RecruitBoardConfig }) {
  const url = new URL(window.location.href)
  const ID = url.searchParams.get('id')
  const navigate = useNavigate()
  const locationHook = useLocation()
  const recruitState = (locationHook && (locationHook as any).state)?.recruitState

  const [part, setPart] = useState<any>(DEFAULT_SORT_ITEM)
  const [partDetail, setPartDetail] = useState<any>(DEFAULT_SORT_ITEM)
  const [school, setSchool] = useState<any>(DEFAULT_SORT_ITEM)
  const [career, setCareer] = useState<any>(DEFAULT_SORT_ITEM)
  const [workday, setWorkday] = useState<any>(DEFAULT_SORT_ITEM)
  const [workTimeSunDay, setWorkTimeSunDay] = useState<any>(DEFAULT_WORK_TIME_SUN)
  const [workTimeWeek, setWorkTimeWeek] = useState<any>(DEFAULT_WORK_TIME_WEEK)
  const [dawnPray, setDawnPray] = useState<any>(DEFAULT_SORT_ITEM)
  const [pay, setPay] = useState<any>(DEFAULT_PAY)
  const [insurance, setInsurance] = useState<any>(DEFAULT_SORT_ITEM)
  const [severance, setSeverance] = useState<any>(DEFAULT_SORT_ITEM)
  const [welfare, setWelfare] = useState<any>(DEFAULT_SORT_ITEM)
  const [applytime, setApplytime] = useState<any>(DEFAULT_APPLYTIME)
  const [applydoc, setApplydoc] = useState<any>(DEFAULT_SORT_ITEM)
  const [inquiry, setInquiry] = useState<any>(DEFAULT_INQUIRY)
  const [customInput, setCustomInput] = useState('')

  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [source, setSource] = useState('')
  const [sort, setSort] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [locationDetail, setLocationDetail] = useState('')
  const [applyhow, setApplyhow] = useState('')
  const [etcNotice, setEtcNotice] = useState('')
  const [church, setChurch] = useState('')
  const [churchLogo, setChurchLogo] = useState('')
  const [religiousbody, setReligiousbody] = useState('')
  const [address, setAddress] = useState('')
  const [mainPastor, setMainPastor] = useState('')
  const [homepage, setHomepage] = useState('')

  const [mapLoaded, setMapLoaded] = useState(true)

  const mapElement = useRef<HTMLDivElement | null>(null)
  const { naver } = window

  const goToList = () => {
    window.scrollTo(0, 0)
    navigate(config.listPath, { state: { recruitState } })
  }

  const handleListButtonHover = (e: React.MouseEvent<HTMLDivElement>, enter: boolean) => {
    e.currentTarget.style.backgroundColor = enter ? '#555' : '#333'
    e.currentTarget.style.transform = enter ? 'translateY(-2px)' : 'translateY(0)'
  }

  const addressAPI = async (addressQuery: string) => {
    try {
      const response = await axios.post(`${MainURL}/${config.apiBase}/geocode`, {
        address: addressQuery,
      })

      if (response.data.success && response.data.coordinates) {
        const { latitude, longitude } = response.data.coordinates

        if (!mapElement.current || !naver) {
          setMapLoaded(false)
          return
        }

        const mapLocation = new naver.maps.LatLng(latitude, longitude)
        const mapOptions = {
          center: mapLocation,
          zoom: 12,
          zoomControl: true,
        }
        const map = new naver.maps.Map(mapElement.current, mapOptions)
        new naver.maps.Marker({
          position: mapLocation,
          map,
        })
        setMapLoaded(true)
      } else {
        setMapLoaded(false)
      }
    } catch (error) {
      console.error('지오코딩 API 오류:', error)
      setMapLoaded(false)
    }
  }

  const fetchPosts = async () => {
    const res = await axios.post(`${MainURL}/${config.apiBase}/getrecruitdatapart`, {
      id: ID,
    })
    if (res.data) {
      const copy = { ...res.data[0] }

      setSchool(safeJsonParse(copy.school, DEFAULT_SORT_ITEM))
      setCareer(safeJsonParse(copy.career, DEFAULT_SORT_ITEM))
      setApplytime(safeJsonParse(copy.applytime, DEFAULT_APPLYTIME))
      setApplydoc(safeJsonParse(copy.applydoc, DEFAULT_SORT_ITEM))
      setInquiry(safeJsonParse(copy.inquiry, DEFAULT_INQUIRY))

      if (config.showMinistryDetail) {
        setPart(safeJsonParse(copy.part, DEFAULT_SORT_ITEM))
        setPartDetail(safeJsonParse(copy.partDetail, DEFAULT_SORT_ITEM))
        setWorkday(safeJsonParse(copy.workday, DEFAULT_SORT_ITEM))
        setWorkTimeSunDay(safeJsonParse(copy.workTimeSunDay, DEFAULT_WORK_TIME_SUN))
        setWorkTimeWeek(safeJsonParse(copy.workTimeWeek, DEFAULT_WORK_TIME_WEEK))
        setDawnPray(safeJsonParse(copy.dawnPray, DEFAULT_SORT_ITEM))
        setPay(safeJsonParse(copy.pay, DEFAULT_PAY))
        setInsurance(safeJsonParse(copy.insurance, DEFAULT_SORT_ITEM))
        setSeverance(safeJsonParse(copy.severance, DEFAULT_SORT_ITEM))
        setWelfare(safeJsonParse(copy.welfare, DEFAULT_SORT_ITEM))
      }

      setCustomInput(copy.customInput || '')
      setTitle(copy.title || '')
      setLink(copy.link || '')
      setSource(copy.source || '')
      setSort(copy.sort || '')
      setDate(copy.date || '')
      setLocation(copy.location || '')
      setLocationDetail(copy.locationDetail || '')
      setApplyhow(copy.applyhow || '')
      setEtcNotice(copy.etcNotice || '')
      setChurch(copy.church || '')
      setChurchLogo(copy.churchLogo || '')
      setReligiousbody(copy.religiousbody || '')
      setAddress(copy.address || '')
      setMainPastor(copy.mainPastor || '')
      setHomepage(copy.homepage || '')
      addressAPI(copy.address)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [ID, config.apiBase])

  return (
    <div className="recruit">
      <div className="inner">
        <div className="subpage__main">
          <section style={{ marginBottom: '50px' }}>
            <div className="main_title_row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="main_title">{title}</h3>
              <div
                style={listButtonStyle}
                onClick={goToList}
                onMouseEnter={(e) => handleListButtonHover(e, true)}
                onMouseLeave={(e) => handleListButtonHover(e, false)}
              >
                <MdArrowBack style={{ fontSize: '16px' }} />
                <span>목록</span>
              </div>
            </div>
            {source !== '사역자모아' && (
              <div className="copBtn">
                <a href={link} target="_blank" className="girBtn btn">
                  <p>원본보기</p>
                  <MdArrowForwardIos />
                  <div className="recruit__religiousbody_box">
                    <img src={`${MainURL}/siteimages/schoolround/${source}.jpg`} alt="" />
                    <p className="recruit__religiousbody">{source}</p>
                  </div>
                </a>
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#999', padding: '5px 10px' }}>
              게시글ID: {ID}
            </div>
          </section>

          <section>
            <h1 className="section_title">채용정보</h1>
            <div className="summaryBx">
              <div className="tbCol">
                <h4>사역요약</h4>
                <div className="tbList">
                  {config.showMinistryDetail && (
                    <>
                      <div className="tbLabel">구분</div>
                      <div className="tbValue">{sort}</div>
                      <div className="tbLabel">파트</div>
                      <div className="tbValue">
                        {part.length > 0 && part[0] && part[0].content && (
                          <p>
                            {part[0].sort && `${part[0].sort} : `}
                            {part[0].content}
                          </p>
                        )}
                        {part.length > 1 && part[1] && part[1].content && (
                          <p>
                            {part[1].sort && `${part[1].sort} : `}
                            {part[1].content}
                          </p>
                        )}
                      </div>
                      <div className="tbLabel">파트상세</div>
                      <div className="tbValue">
                        {partDetail.length > 0 && partDetail[0] && partDetail[0].content && (
                          <p>
                            {partDetail[0].sort && `${partDetail[0].sort} : `}
                            {partDetail[0].content}
                          </p>
                        )}
                        {partDetail.length > 1 && partDetail[1] && partDetail[1].content && (
                          <p>
                            {partDetail[1].sort && `${partDetail[1].sort} : `}
                            {partDetail[1].content}
                          </p>
                        )}
                      </div>
                      <div className="tbLabel">사례</div>
                      <div className="tbValue">
                        {pay.length > 1 ? (
                          <p>{pay[0].sort} : {pay[0].paySort} {pay[0].selectCost}</p>
                        ) : pay[0].inputCost !== '' ? (
                          <p>{pay[0].inputCost}</p>
                        ) : (
                          <p>{pay[0].paySort} {pay[0].selectCost}</p>
                        )}
                        {pay.length > 1 && (
                          <p>{pay[1].sort} : {pay[1].paySort} {pay[1].selectCost}</p>
                        )}
                      </div>
                    </>
                  )}
                  <div className="tbLabel">지역</div>
                  <div className="tbValue">{location} {locationDetail}</div>
                </div>
              </div>
              <div className="tbCol">
                <h4>지원자격</h4>
                <div className="tbList">
                  <div className="tbLabel">학력</div>
                  <div className="tbValue">
                    {school.length > 1 ? (
                      <p>{school[0].sort} : {school[0].content}</p>
                    ) : (
                      <p>{school[0].content}</p>
                    )}
                    {school.length > 1 && (
                      <p>{school[1].sort} : {school[1].content}</p>
                    )}
                  </div>
                  <div className="tbLabel">경력</div>
                  <div className="tbValue">
                    {career.length > 1 ? (
                      <p>{career[0].sort} : {career[0].content}</p>
                    ) : (
                      <p>{career[0].content}</p>
                    )}
                    {career.length > 1 && (
                      <p>{career[1].sort} : {career[1].content}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {config.showMinistryDetail && (
            <section>
              <h1 className="section_title">사역상세</h1>
              <div className="summaryBx">
                <div className="tbCol">
                  <h4>사역내용</h4>
                  <div className="tbList">
                    <div className="tbLabel">구분</div>
                    <div className="tbValue">{sort}</div>
                    <div className="tbLabel">파트</div>
                    <div className="tbValue">
                      {part.length > 0 && part[0] && part[0].content && (
                        <p>
                          {part[0].sort && `${part[0].sort} : `}
                          {part[0].content}
                        </p>
                      )}
                      {part.length > 1 && part[1] && part[1].content && (
                        <p>
                          {part[1].sort && `${part[1].sort} : `}
                          {part[1].content}
                        </p>
                      )}
                    </div>
                    <div className="tbLabel">파트상세</div>
                    <div className="tbValue">
                      {partDetail.length > 0 && partDetail[0] && partDetail[0].content && (
                        <p>
                          {partDetail[0].sort && `${partDetail[0].sort} : `}
                          {partDetail[0].content}
                        </p>
                      )}
                      {partDetail.length > 1 && partDetail[1] && partDetail[1].content && (
                        <p>
                          {partDetail[1].sort && `${partDetail[1].sort} : `}
                          {partDetail[1].content}
                        </p>
                      )}
                    </div>
                    <div className="tbLabel">사역요일</div>
                    <div className="tbValue">
                      {workday.length > 0 && workday[0] && workday[0].content && (
                        <p>
                          {workday[0].sort && `${workday[0].sort} : `}
                          {workday[0].content}
                        </p>
                      )}
                      {workday.length > 1 && workday[1] && workday[1].content && (
                        <p>
                          {workday[1].sort && `${workday[1].sort} : `}
                          {workday[1].content}
                        </p>
                      )}
                    </div>
                    <div className="tbLabel">사역시간(주일)</div>
                    <div className="tbValue">
                      {workTimeSunDay.length > 0 && workTimeSunDay[0] &&
                        workTimeSunDay[0].startHour && workTimeSunDay[0].startMinute &&
                        workTimeSunDay[0].endHour && workTimeSunDay[0].endMinute && (
                          <p>
                            {workTimeSunDay[0].sort && `${workTimeSunDay[0].sort} : `}
                            {workTimeSunDay[0].startHour}:{workTimeSunDay[0].startMinute} - {workTimeSunDay[0].endHour}:{workTimeSunDay[0].endMinute}
                          </p>
                        )}
                      {workTimeSunDay.length > 1 && workTimeSunDay[1] && workTimeSunDay[1].content && (
                        <p>{workTimeSunDay[1].sort} : {workTimeSunDay[1].content}</p>
                      )}
                    </div>
                    <div className="tbLabel">사역시간(평일)</div>
                    <div className="tbValue">
                      {workTimeWeek.length > 0 && workTimeWeek[0] &&
                        workTimeWeek[0].startHour && workTimeWeek[0].startMinute &&
                        workTimeWeek[0].endHour && workTimeWeek[0].endMinute && (
                          <p>
                            {workTimeWeek[0].sort && `${workTimeWeek[0].sort} : `}
                            {workTimeWeek[0].startHour}:{workTimeWeek[0].startMinute} - {workTimeWeek[0].endHour}:{workTimeWeek[0].endMinute}
                            {workTimeWeek[0].day && ` (${workTimeWeek[0].day})`}
                          </p>
                        )}
                    </div>
                    <div className="tbLabel">새벽기도참석</div>
                    <div className="tbValue">
                      {dawnPray.length > 0 && dawnPray[0] && dawnPray[0].content && (
                        <p>
                          {dawnPray[0].sort && `${dawnPray[0].sort} : `}
                          {dawnPray[0].content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="tbCol">
                  <h4>사례/복지</h4>
                  <div className="tbList">
                    <div className="tbLabel">사례</div>
                    <div className="tbValue">
                      {pay.length > 1 ? (
                        <p>{pay[0].sort} : {pay[0].paySort} {pay[0].selectCost}</p>
                      ) : pay[0].inputCost !== '' ? (
                        <p>{pay[0].inputCost}</p>
                      ) : (
                        <p>{pay[0].paySort} {pay[0].selectCost}</p>
                      )}
                      {pay.length > 1 && (
                        <p>{pay[1].sort} : {pay[1].paySort} {pay[1].selectCost}</p>
                      )}
                    </div>
                    <div className="tbLabel">보험</div>
                    <div className="tbValue">
                      {insurance.length > 1 ? (
                        <p>{insurance[0].sort} : {insurance[0].content}</p>
                      ) : (
                        <p>{insurance[0].content}</p>
                      )}
                      {insurance.length > 1 && (
                        <p>{insurance[1].sort} : {insurance[1].content}</p>
                      )}
                    </div>
                    <div className="tbLabel">퇴직금</div>
                    <div className="tbValue">
                      {severance.length > 1 ? (
                        <p>{severance[0].sort} : {severance[0].content}</p>
                      ) : (
                        <p>{severance[0].content}</p>
                      )}
                      {severance.length > 1 && (
                        <p>{severance[1].sort} : {severance[1].content}</p>
                      )}
                    </div>
                    <div className="tbLabel">복리후생</div>
                    <div className="tbValue">
                      {welfare.length > 1 ? (
                        <p>{welfare[0].sort} : {welfare[0].content}</p>
                      ) : (
                        <p>{welfare[0].content}</p>
                      )}
                      {welfare.length > 1 && (
                        <p>{welfare[1].sort} : {welfare[1].content}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section>
            <h1 className="section_title">지원방법</h1>
            <div className="copInfoBx">
              <div className="copInfoBx-cover">
                <div className="copInfo">
                  <div className="label">등록일</div>
                  <div className="value">
                    <p>{date}</p>
                  </div>
                  <div className="label">기간</div>
                  <div className="value">
                    {applytime.startDay !== '' && applytime.endDay !== '' ? (
                      <p>{applytime.startDay} ~ {applytime.endDay} ({applytime.daySort})</p>
                    ) : (
                      <p>{applytime.daySort}</p>
                    )}
                  </div>
                  <div className="label">서류</div>
                  <div className="value">
                    {applydoc.length > 1 ? (
                      <p>{applydoc[0].sort} : {applydoc[0].content}</p>
                    ) : (
                      <p>{applydoc[0].content}</p>
                    )}
                    {applydoc.length > 1 && (
                      <p>{applydoc[1].sort} : {applydoc[1].content}</p>
                    )}
                  </div>
                  <div className="label">지원방법</div>
                  <div className="value">{applyhow}</div>
                  <div className="label">담당자</div>
                  <div className="value">
                    <p>이름 : {inquiry.inquiryName}</p>
                    <p>이메일 : {inquiry.email}</p>
                    <p>전화번호 : {inquiry.phone}</p>
                  </div>
                  <div className="label">기타사항</div>
                  <div className="value" style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>{etcNotice}</div>
                </div>
              </div>
            </div>
          </section>

          <section id="tab03" style={{ marginBottom: '100px' }}>
            <h1 className="section_title">상세내용</h1>
            <div className="copInfoBx">
              <div
                className="custom-html-content"
                dangerouslySetInnerHTML={{ __html: customInput }}
              />
            </div>
          </section>

          <section id="tab03">
            <h1 className="section_title">교회 정보</h1>
            <div className="copInfoBx">
              <div className="header">
                <h4 className="church">{church}</h4>
              </div>
              <div className="copInfoBx-cover">
                <div className="copLogo">
                  {!churchLogo ? (
                    <div className="emptyLogo">
                      <p>사역자모아</p>
                    </div>
                  ) : (
                    <img
                      className="churchLogo"
                      src={`${MainURL}/${config.churchLogoImagePath}/${churchLogo}`}
                      alt="로고"
                      onError={() => { setChurchLogo('') }}
                    />
                  )}
                </div>
                <div className="copInfo">
                  <div className="label">교단</div>
                  <div className="value">
                    <div className="recruit__religiousbody_box">
                      <img src={`${MainURL}/${config.religiousbodyDetailImagePath}/${religiousbody}.jpg`} alt="" />
                      <p className="recruit__religiousbody">{religiousbody}</p>
                    </div>
                  </div>
                  <div className="label">지역</div>
                  <div className="value">{location} {locationDetail}</div>
                  <div className="label">주소</div>
                  <div className="value">{address}</div>
                  <div className="label">담임목사</div>
                  <div className="value">{mainPastor}</div>
                  <div className="label">홈페이지</div>
                  {homepage && homepage !== '' && (
                    <div className="value" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <p>{homepage}</p>
                      <a
                        href={homepage.includes('http') ? homepage : `http://${homepage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', border: '1px solid #000', borderRadius: '5px', marginLeft: '10px', padding: '2px 7px' }}
                      >
                        <p style={{ fontSize: '14px' }}>바로가기</p>
                        <MdArrowForwardIos style={{ fontSize: '14px', marginLeft: '5px' }} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="maparea">
            {mapLoaded ? (
              <div id="map" ref={mapElement} style={{ minHeight: '600px' }} />
            ) : (
              <div style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#aaa', background: '#f5f5f5' }}>
                주소가 정확하지 않아 지도를 표시할 수 없습니다.
              </div>
            )}
          </div>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <div
                style={{ ...listButtonStyle, marginTop: '40px' }}
                onClick={goToList}
                onMouseEnter={(e) => handleListButtonHover(e, true)}
                onMouseLeave={(e) => handleListButtonHover(e, false)}
              >
                <MdArrowBack style={{ fontSize: '16px' }} />
                <span>목록</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
