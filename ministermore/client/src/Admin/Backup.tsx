import { useEffect, useState } from 'react';
import axios from 'axios';
import MainURL from '../MainURL';
import { PiPencilSimpleLineFill } from 'react-icons/pi';

type RecruitMinisterRow = {
	id: number;
	church?: string;
	date?: string;
	isSentEmail?: string;
	inquiry?: string;
};

type MinisterListRow = {
	id: number;
	church: string;
	email: string;
	date: string;
	isSentEmail: string;
};

const parseInquiryEmail = (inquiry?: string): string => {
	if (!inquiry) return '';

	try {
		const parsed = JSON.parse(inquiry);
		return typeof parsed?.email === 'string' ? parsed.email.trim() : '';
	} catch {
		return '';
	}
};

const dedupeByInquiryEmail = (rows: RecruitMinisterRow[]): RecruitMinisterRow[] => {
	const seenEmails = new Set<string>();

	return rows.filter((row) => {
		const email = parseInquiryEmail(row.inquiry);
		if (!email) return false;
		if (seenEmails.has(email)) return false;
		seenEmails.add(email);
		return true;
	});
};

const toMinisterListRows = (rows: RecruitMinisterRow[]): MinisterListRow[] =>
	rows.map((row) => ({
		id: row.id,
		church: row.church || '',
		email: parseInquiryEmail(row.inquiry),
		date: row.date || '',
		isSentEmail: row.isSentEmail || '',
	}));

const parseRecruitMinisterResponse = (data: any): RecruitMinisterRow[] => {
	if (Array.isArray(data?.resultData)) return data.resultData;
	if (Array.isArray(data)) return data;
	if (data === false) return [];
	return [];
};

const LIST_COLUMNS: { key: keyof MinisterListRow; label: string }[] = [
	{ key: 'id', label: 'id (recruitMinister)' },
	{ key: 'church', label: 'church' },
	{ key: 'email', label: 'email' },
	{ key: 'date', label: 'date' },
	{ key: 'isSentEmail', label: 'isSentEmail' },
];

export default function Sub4_Backup() {

	
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [accountData, setAccountData] = useState<any>(null);



	return (
		<div className="Main-cover">

				<div style={{marginBottom:'50px'}}>

					<input type="text" placeholder='이름' value={name} onChange={(e)=>{setName(e.target.value)}} />
					<input type="text" placeholder='전화번호' value={phone} onChange={(e)=>{setPhone(e.target.value)}} />

					<button 
						
						onClick={()=>{
							axios.post(`${MainURL}/apikakaonotifi/request`, {
								name: name,
								phone: phone
							}).then((res)=>{
								if (res.data) {
									alert('카카오톡 전송 성공');
								} else {
									alert('카카오톡 전송 실패');
								}
							});
					}}>
						카카오톡 전송
					</button>
				</div>

			<div style={{ height: '100px' }} />
		</div>
	);
}
