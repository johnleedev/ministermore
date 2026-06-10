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
	const [rows, setRows] = useState<MinisterListRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [saveMessage, setSaveMessage] = useState('');
	const [selectedRow, setSelectedRow] = useState<MinisterListRow | null>(null);

	const fetchRecruitMinisterAll = async () => {
		setLoading(true);
		setErrorMessage('');

		try {
			const res = await axios.get(`${MainURL}/recruitwork/getrecruitdataall`);
			const data = parseRecruitMinisterResponse(res.data);

			if (!Array.isArray(data)) {
				throw new Error('recruitMinister 데이터 형식이 올바르지 않습니다.');
			}

			const uniqueRows = dedupeByInquiryEmail(data);
			setRows(toMinisterListRows(uniqueRows));
			setSelectedRow(null);
		} catch (error: any) {
			const message = error?.response?.data?.message || error?.message || 'recruitMinister 조회 중 오류가 발생했습니다.';
			setErrorMessage(message);
			setRows([]);
		} finally {
			setLoading(false);
		}
	};

	const saveEmailsFromRecruitMinister = async () => {
		if (rows.length === 0) {
			window.alert('저장할 데이터가 없습니다.');
			return;
		}

		if (!window.confirm(`현재 리스트 ${rows.length}건을 emails 테이블에 저장하시겠습니까?`)) {
			return;
		}

		setSaving(true);
		setSaveMessage('');
		setErrorMessage('');

		try {
			const saveRes = await axios.post(`${MainURL}/recruitwork/bulkinsertemails`, {
				list: rows.map((row) => ({
					post_id: row.id,
					church: row.church,
					email: row.email,
					date: row.date,
					isSentEmail: row.isSentEmail,
				})),
			});

			if (!saveRes.data?.success) {
				throw new Error(saveRes.data?.message || 'emails 테이블 저장 실패');
			}

			const message = saveRes.data.message || '저장이 완료되었습니다.';
			setSaveMessage(message);
			window.alert(message);
		} catch (error: any) {
			const message = error?.response?.data?.message || error?.message || '저장 중 오류가 발생했습니다.';
			setErrorMessage(message);
			window.alert(message);
		} finally {
			setSaving(false);
		}
	};

	useEffect(() => {
		fetchRecruitMinisterAll();
	}, []);

	return (
		<div className="Main-cover">
			<div className="main-title" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
				<div className="addBtn" onClick={loading || saving ? undefined : fetchRecruitMinisterAll}>
					<PiPencilSimpleLineFill />
					<p>{loading ? '불러오는 중...' : '새로고침'}</p>
				</div>
				<div className="addBtn" onClick={loading || saving || rows.length === 0 ? undefined : saveEmailsFromRecruitMinister}>
					<PiPencilSimpleLineFill />
					<p>{saving ? '저장 중...' : 'emails 테이블 저장'}</p>
				</div>
			</div>

			<div style={{ maxWidth: '1400px', margin: '20px auto', padding: '10px' }}>
				<div style={{ border: '1px solid #e8ebef', borderRadius: '12px', padding: '20px' }}>
					<h3 style={{ fontSize: '18px', margin: '0 0 12px' }}>recruitMinister 목록 (email 중복 제거)</h3>
					<p style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>
						총 {rows.length.toLocaleString()}건 · email 중복 제거 · 저장 시 id → emails.post_id
					</p>

					{errorMessage && <p style={{ color: '#d33', marginBottom: '12px' }}>오류: {errorMessage}</p>}
					{saveMessage && <p style={{ color: '#2a7', marginBottom: '12px' }}>{saveMessage}</p>}

					<div style={{ maxHeight: '600px', overflow: 'auto', border: '1px solid #f1f3f5', borderRadius: '6px' }}>
						<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
							<thead style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
								<tr>
									{LIST_COLUMNS.map((column) => (
										<th key={column.key} style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
											{column.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{rows.map((row) => (
									<tr
										key={row.id}
										onClick={() => setSelectedRow(row)}
										style={{
											cursor: 'pointer',
											backgroundColor: selectedRow?.id === row.id ? '#eef6ff' : 'transparent',
										}}
									>
										{LIST_COLUMNS.map((column) => {
											const cellValue = String(row[column.key] ?? '');

											return (
												<td
													key={column.key}
													style={{
														padding: '8px',
														borderBottom: '1px solid #f1f3f5',
														maxWidth: '220px',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
													}}
													title={cellValue}
												>
													{cellValue}
												</td>
											);
										})}
									</tr>
								))}
								{!loading && rows.length === 0 && (
									<tr>
										<td colSpan={LIST_COLUMNS.length} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
											표시할 데이터가 없습니다.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<div style={{ marginTop: '20px', border: '1px solid #f1f3f5', borderRadius: '6px', padding: '12px' }}>
						<p style={{ fontWeight: 600, marginBottom: '8px' }}>
							{selectedRow ? `상세 정보 (id: ${selectedRow.id})` : '행을 클릭하면 상세 정보가 표시됩니다.'}
						</p>
						{selectedRow && (
							<div style={{ maxHeight: '400px', overflow: 'auto' }}>
								<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
									<tbody>
										{Object.entries(selectedRow).map(([key, value]) => (
											<tr key={key}>
												<td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5', width: '160px', fontWeight: 600, verticalAlign: 'top' }}>
													{key}
												</td>
												<td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5', textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
													{String(value ?? '')}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</div>
			<div style={{ height: '100px' }} />
		</div>
	);
}
