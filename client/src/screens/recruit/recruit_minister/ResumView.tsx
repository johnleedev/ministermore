import './Recruit.scss'

export default function ResumView() {
    return (
        <div className='resume-wrapper'>
            <div className='resume-page'>
                <div className='resume-title'>이력서</div>
                <div className='profile'>
                    <div className='container'>
                        <div className='user'>
                            <img
                                className='user-image'
                                src='data:image/jpeg;base64,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'
                                alt='증명사진'
                            />
                        </div>
                        <div className='user-info'>
                            <div className='info-general'>
                                <div className='item name'>증명사진</div>
                                <div className='item'>여</div>
                                <div className='item'>2000년</div>
                                <div className='item'>(만 25세)</div>
                            </div>
                            <div className='info-detail'>
                                <div className='item'>
                                    <div className='label'>휴대폰</div>
                                    <div className='value'>010-1234-5678</div>
                                </div>
                                <div className='item'>
                                    <div className='label'>Email</div>
                                    <div className='value'>
                                        <a href='mailto:strause1@nate.com'>strause@nate.com</a>
                                    </div>
                                </div>
                                <div className='item'>
                                    <div className='label'>주소</div>
                                    <div className='value'>대구 달서구 용산동</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='summary'>
                        <div className='item'>
                            <div className='header'>학력</div>
                            <div className='description'>xx대학교</div>
                            <div className='options'>
                                <div className='option'>대학교(4년)</div>
                                <div className='option'>졸업</div>
                            </div>
                        </div>
                        <div className='item'>
                            <div className='header'>경력</div>
                            <div className='description'>회사이름</div>
                            <div className='options'>
                                <div className='option'>퇴사</div>
                                <div className='option'>총 n년</div>
                            </div>
                        </div>
                        {/* description 내용없으면 signleline 추가 내용있으면 사용 x */}
                        <div className='item singleline'>
                            <div className='header'>인턴·대외활동 / 해외경험</div>
                            <div className='description'>-</div>
                        </div>
                        <div className='item'>
                            <div className='header'>자격증 / 어학</div>
                            <div className='description'>정보처리기사</div>
                            <div className='description etc'>외 1</div>
                        </div>
                    </div>
                    <div className='skill'>
                        <div className='container'>
                            <button className='btn-list'>React</button>
                            <button className='btn-list'>Typescript</button>
                            <button className='btn-list'>Next.js</button>
                            <button className='btn-list'>Next.js</button>
                            <button className='btn-list'>Next.js</button>
                            <button className='btn-list'>Next.js</button>
                            <button className='btn-list'>Next.js</button>
                            <button className='btn-list'>Next.js</button>
                            <button className='btn-list'>Next.js</button>
                            <button className='btn-list'>Node.js</button>
                            <button className='btn-list'>Node.js</button>
                            <button className='btn-list'>Node.js</button>
                            <button className='btn-list'>Node.js</button>
                            <button className='btn-list'>AWS EC2</button>
                        </div>
                    </div>
                </div>

                <div className='education'>
                    <h2 className='header'>학력</h2>
                    <div className='list'>
                        <div className='item'>
                            <div className='date'>
                                <div className='term'>1111. 01 ~ 1111. 01</div>
                                <div className='state'>졸업</div>
                            </div>
                            <div className='content'>
                                <div className='content-header'>
                                    <span className='label'>대한민국 학교이름(지역)</span>
                                    <span className='value'>OO학과</span>
                                </div>
                                <div className='content-body'>
                                    <div className='info'>
                                        <div className='item'>
                                            <span className='label'>학점</span>
                                            <span className='value'>0 / 4.5</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='career base'>
                    <div className='headers'>
                        <h2 className='header'>경력</h2>
                        <span className='total'>총 O년</span>
                    </div>
                    <div className='list'>
                        <div className='item'>
                            <div className='date'>
                                <div className='term'>1111. 01 ~ 1111. 01</div>
                                <div className='state'>O개월</div>
                            </div>
                            <div className='content'>
                                <div className='content-header'>
                                    <span className='label'>회사이름</span>
                                    <span className='value'>부서이름 혹은 직급</span>
                                </div>
                                <div className='content-body'>
                                    <div className='description'>회사 부연 설명</div>
                                    <div className='info'>
                                        <div className='item'>
                                            <span className='label'>연봉</span>
                                            <span className='value'>0,000만원</span>
                                        </div>
                                        <div className='item'>
                                            <span className='label'>주요직무</span>
                                            <span className='value'>OOOO</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='learn'>
                    <h2 className='header'>교육</h2>
                    <div className='list'>
                        <div className='item'>
                            <div className='date'>0000. 00 ~ 0000. 00</div>
                            <div className='content'>
                                <div className='content-header'>
                                    <span className='label'>프론트엔드 개발자 과정</span>
                                    <span className='value'>교육기관</span>
                                </div>
                                <div className='content-body'>교육기관 설명</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='portfolio'>
                    <h2 className='header'>포트폴리오</h2>
                    <div className='list table'>
                        <div className='tr'>
                            <div className='th'>이력서</div>
                            <div className='td'>
                                <a href='https://www.naver.com' className='name'>
                                    www.naver.com
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='hopework'>
                    <h2 className='header'>희망근무조건</h2>
                    <div className='list table'>
                        <div className='tr'>
                            <div className='th'>고용형태</div>
                            <div className='td'>정규직</div>
                        </div>
                        <div className='tr'>
                            <div className='th'>희망근무지</div>
                            <div className='td'>대구전지역, 서울전지역</div>
                        </div>
                        <div className='tr'>
                            <div className='th'>희망연봉</div>
                            <div className='td'>면접 후 결정</div>
                        </div>
                        <div className='tr'>
                            <div className='th'>지원분야</div>
                            <div className='td'>
                                <div className='content'>
                                    <div className='item'>
                                        <span className='label'>직무</span>
                                        <span className='value'>
                                            <ul className='hopework-list'>
                                                <li>
                                                    <span className='item'>희망직무1</span>
                                                </li>
                                                <li>
                                                    <div className='item'>희망직무2</div>
                                                </li>
                                                <li>
                                                    <div className='item'>희망직무3</div>
                                                </li>
                                            </ul>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='sign'>
                    <div className='msg'>위의 모든 기재사항은 사실과 다름없음을 확인합니다.</div>
                    <div className='writer'>작성자 : OOO</div>
                    <div className='description'>
                        이 이력서는 2025년 00월 00일 (월)에 최종 수정된 이력서 입니다.
                        <br />
                        위조된 문서를 등록하여 취업활동에 이용 시 법적 책임을 지게 될 수 있습니다.{' '}
                        <br />
                        잡코리아(유)는 구직자가 등록 한 문서에 대해 보증하거나 별도의 책임을 지지
                        않으며 <br />
                        첨부된 문서를 신뢰하여 발생한 법적 분쟁에 책임을 지지 않습니다. <br />
                        또한 구인/구직 목적 외 다른 목적으로 이용 시 이력서 삭제 혹은 비공개 조치가
                        될 수 있습니다.
                    </div>
                </div>
            </div>
        </div>
    )
}
