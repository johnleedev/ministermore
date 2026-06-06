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



export const schoolSubSort = ["교단 인준 신학교 재학 및 졸업자"];
export const careerSubSort = ["관련 사역 경험자 우대"];
export const religiousbodySubSort = [
  "구세군대한본영", "기독교대한감리회", "기독교대한성결교회", "기독교대한하나님의성회", "기독교한국침례회", "대한기독교나사렛성결회",
  "대한예수교장로회고신", "대한예수교장로회통합", "대한예수교장로회합동", "대한예수교장로회합신", "예수교대한성결교회", "한국기독교장로회", "기타교단"];

export const locationSubSort = ['서울','인천','경기','대전','세종','충청','광주','전북','전남','대구','경북','울산','부산','경남','제주'];
export const sortSubSort = ['전임','준전임','파트', '전임or준전임','전임or파트','준전임or파트', '전임&준전임','전임&파트','준전임&파트','담임'];
export const partSubSort = ["담임", "교구", "행정", "주일학교", "교육부서", "양육사역", "심방사역", "찬양사역", "특수사역"];
export const partDetailSubSort = ["영아부", "유아부", "영유아부", "유치부", "초등부", "중등부", "고등부", "대학부", "청년부", "특수부"];
export const recruitNumSubSort = ["1명", "2명", "3명", "4명", "5명", "각1명", "각2명"];
export const weekdaySubSort = ["일", "월", "화", "수", "목", "금", "토"];
export const workdaySubMenu = ["주6일(화~일)", "주4일(수금토일)", "주3일(수토일)", "주3일(금토일)", "주말(토일)"];
export const dawnPraySubMenu = ["주1회", "주2회", "주3회", "주4회", "주5회", "주6회", "매일"];
export const paySubSort = ["교회내규에따라", "협의후결정"];
export const insuranceSubSort = ["건강보험","고용보험","국민연금","산재보험"];
export const severanceSubSort = ["사례의10%","교회내규에따라", "협의후결정"]
export const welfareSubSort = ["사택제공","공과금","통신비","월차제도","유연근무제","칼퇴권장","건강검진","상여금","휴가비","출산휴가"];
export const applydocSubSort = ["이력서", "자기소개서", "추천서", "졸업증명서", "설교영상", "가족관계증명서"];
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
  { value: '전임', label: '전임' },
  { value: '준전임', label: '준전임' },
  { value: '파트', label: '파트' },
  { value: '전임or준전임', label: '전임or준전임' },
  { value: '전임or파트', label: '전임or파트' },
  { value: '준전임or파트', label: '준전임or파트' },
  { value: '전임&준전임', label: '전임&준전임' },
  { value: '전임&파트', label: '전임&파트' },
  { value: '준전임&파트', label: '준전임&파트' },
  { value: '담임', label: '담임' }
];



