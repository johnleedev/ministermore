interface SubTitleControlProps {
  index: number;
  data: any[];
  setData: (data: any[]) => void;
  sortOptions: { value: string; label: string; }[];
  defaultValues?: any;
}

export const SubTitleControl = ({ index, data, setData, sortOptions, defaultValues }: SubTitleControlProps) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const copy = [...data];
    copy[index].sort = e.target.value;
    setData(copy);
  };

  const handleAdd = () => {
    const newItem = defaultValues || { sort: "", content: "" };
    const copy = [...data, newItem];
    setData(copy);
  };

  const handleRemove = () => {
    const copy = [...data];
    copy.splice(index, 1);
    setData(copy);
  };

  return (
    <div className={`subTitle ${index !== 0 ? 'second' : ''}`}>
      <p></p>
      <select
        className="subTitle-dropdownBox"
        value={data[index].sort}
        onChange={handleChange}
      >
        {sortOptions.map((option, idx) => (
          <option key={idx} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className='addminusBtn' onClick={handleAdd}>
        <p>+</p>
      </div>
      {index !== 0 && (
        <div className='addminusBtn' onClick={handleRemove}>
          <p>-</p>
        </div>
      )}
    </div>
  );
};



export const schoolSubSort = ["음대/음악대학원 재학 및 졸업자", "관련 전공자 우대"];
export const careerSubSort = ["관련 사역 경험자 우대", "찬양 사역 경험자"];
export const religiousbodySubSort = [
  "구세군대한본영", "기독교대한감리회", "기독교대한성결교회", "기독교대한하나님의성회", "기독교한국침례회", "대한기독교나사렛성결회",
  "대한예수교장로회고신", "대한예수교장로회통합", "대한예수교장로회합동", "대한예수교장로회합신", "예수교대한성결교회", "한국기독교장로회", "기타교단"];

export const locationSubSort = ['서울','인천','경기','대전','세종','충청','광주','전북','전남','대구','경북','울산','부산','경남','제주'];
export const sortSubSort = ['지휘','반주','솔리스트'];
export const recruitNumSubSort = ["1명", "2명", "3명", "4명", "5명", "각1명", "각2명"];
export const weekdaySubSort = ["일", "월", "화", "수", "목", "금", "토"];
export const applydocSubSort = ["이력서", "자기소개서", "가족관계증명서", "지휘영상", "반주영상", "찬양영상", "음악영상"];
export const applyhowSubSort = ["e-메일","홈페이지","우편","방문","Fax"]

export const hourSortOption = [
  { value: '04', label: '04' },
  { value: '05', label: '05' },
  { value: '06', label: '06' },
  { value: '07', label: '07' },
  { value: '08', label: '08' },
  { value: '09', label: '09' },
  { value: '10', label: '10' },
  { value: '11', label: '11' },
  { value: '12', label: '12' },
  { value: '13', label: '13' },
  { value: '14', label: '14' },
  { value: '15', label: '15' },
  { value: '16', label: '16' },
  { value: '17', label: '17' },
  { value: '18', label: '18' },
  { value: '19', label: '19' },
  { value: '20', label: '20' },
  { value: '21', label: '21' },
  { value: '22', label: '22' },
  { value: '23', label: '23' } 
]

export const minuteSortOption = [
  { value: '00', label: '00' },
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '30', label: '30' },
  { value: '40', label: '40' },
  { value: '50', label: '50' }
]

export const workDayWeekSortOption = [
  { value: '평일', label: '평일' },
  { value: '토요일', label: '토요일' },
  { value: '수요일', label: '수요일' },
  { value: '금요일', label: '금요일' },
]

export const sortSortOption = [
  { value: '지휘자', label: '지휘자' },
  { value: '솔리스트', label: '솔리스트' },
  { value: '반주자', label: '반주자' },
  { value: '찬양인도자', label: '찬양인도자' },
  { value: '지휘자or솔리스트', label: '지휘자or솔리스트' },
  { value: '지휘자or반주자', label: '지휘자or반주자' },
  { value: '솔리스트or반주자', label: '솔리스트or반주자' },
  { value: '지휘자&솔리스트', label: '지휘자&솔리스트' },
  { value: '지휘자&반주자', label: '지휘자&반주자' },
  { value: '솔리스트&반주자', label: '솔리스트&반주자' }
];

