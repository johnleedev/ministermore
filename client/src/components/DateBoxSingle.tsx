import DatePicker from "react-datepicker";
import  "react-datepicker/dist/react-datepicker.css" ;
import {ko} from "date-fns/locale";
import { FaRegCalendarAlt } from "react-icons/fa";
import { useState } from "react";


interface DateBoxDoubleProps {
  date : any;
  setSelectDate : any;
  marginLeft? : number
}

export const DateBoxSingle : React.FC<DateBoxDoubleProps> = ({date, setSelectDate, marginLeft }) => {

  const [startDate, setStartDate] = useState(date);

  const handleSelectDateChange = ( event : any) => {

    setStartDate(event);
    if (event){
      const startcopy = event.toLocaleDateString('ko-KR');
      const startsplitCopy = startcopy.slice(0, -1).split('. ');
      const startsplitCopy2Copy = startsplitCopy[1] < 10 ? `0${startsplitCopy[1]}` : startsplitCopy[1];
      const startsplitCopy3Copy = startsplitCopy[2] < 10 ? `0${startsplitCopy[2]}` : startsplitCopy[2];
      const reformmedStartText = `${startsplitCopy[0]}-${startsplitCopy2Copy}-${startsplitCopy3Copy}`;
      setSelectDate(reformmedStartText);
    }

  }

  return (
    <div className='calendarbox' style={{marginLeft: marginLeft ? `${marginLeft}px` : '5px'}}>
      <div className="datebox dateboxSingle">
         <DatePicker
          locale={ko}
          shouldCloseOnSelect // 날짜 선택시 달력 닫힘
          minDate={new Date('2023-01-01')} // 선택 가능한 최소 날짜
          dateFormat="yyyy-MM-dd"
          selected={startDate}
          isClearable // 선택한 날짜를 초기화할 수 있는 버튼(클리어 버튼)을 활성화합니다.
          onChange={handleSelectDateChange}
          formatWeekDay={(nameOfDay) => nameOfDay.substring(0, 1)}
          showYearDropdown // 연도 선택 드롭다운을 활성화합니다
        />
      </div>
      <FaRegCalendarAlt className='calender-icon' style={{right: '10px'}}/>
    </div>  
  )
}
  
  
