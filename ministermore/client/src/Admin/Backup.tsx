import { useEffect, useState } from 'react';
import axios from 'axios';
import MainURL from '../MainURL';
import ServiceAPIURL from '../ServiceAPIURL';
import { PiPencilSimpleLineFill } from 'react-icons/pi';

type BibleBookRow = {
	book_order: number;
	testament: string;
	book_name_kr: string;
	book_name_short: string;
	book_name_en: string;
	book_name_en_short: string;
	total_chapters: number;
};

type BibleVerseRow = {
	id: number;
	testament: string;
	book_order: number;
	book_name_kr: string;
	book_name_en: string;
	chapter_num: number;
	verse_num: number;
	verse_text: string;
};

export default function Sub4_Backup() {
	const [rows, setRows] = useState<BibleBookRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [totalCount, setTotalCount] = useState(0);
	const [tableName, setTableName] = useState<'gaehyuck' | 'shiunmal'>('gaehyuck');
	const [selectedBook, setSelectedBook] = useState<BibleBookRow | null>(null);
	const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
	const [verseRows, setVerseRows] = useState<BibleVerseRow[]>([]);
	const [verseLoading, setVerseLoading] = useState(false);
	const [verseErrorMessage, setVerseErrorMessage] = useState('');

	const fetchBibleBooks = async () => {
		setLoading(true);
		setErrorMessage('');

		try {
			const res = await axios.get(`${ServiceAPIURL}/homeinappbible/books`);
			console.log(res.data);
			if (!res.data?.success) {
				throw new Error(res.data?.message || '성경 권 목록 조회 실패');
			}

			setRows(Array.isArray(res.data.rows) ? res.data.rows : []);
			setTotalCount(Number(res.data.totalCount || 0));
		} catch (error: any) {
			const message = error?.response?.data?.message || error?.message || '조회 중 오류가 발생했습니다.';
			setErrorMessage(message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchBibleBooks();
	}, []);

	useEffect(() => {
		if (selectedBook) {
			fetchBookVerses(selectedBook);
		}
	}, [tableName]);

	const fetchBookVerses = async (book: BibleBookRow) => {
		setSelectedBook(book);
		setSelectedChapter(null);
		setVerseLoading(true);
		setVerseErrorMessage('');

		try {
			const res = await axios.get(`${ServiceAPIURL}/homeinappbible/verses`, {
				params: {
					table: tableName,
					bookOrder: book.book_order,
				},
			});

			if (!res.data?.success) {
				throw new Error(res.data?.message || '성경 장절 조회 실패');
			}

			setVerseRows(Array.isArray(res.data.rows) ? res.data.rows : []);
		} catch (error: any) {
			const message = error?.response?.data?.message || error?.message || '장절 조회 중 오류가 발생했습니다.';
			setVerseErrorMessage(message);
			setVerseRows([]);
		} finally {
			setVerseLoading(false);
		}
	};

	const chapterButtons = selectedBook
		? Array.from({ length: selectedBook.total_chapters }, (_, idx) => idx + 1)
		: [];
	const filteredVerseRows =
		selectedChapter === null ? [] : verseRows.filter((row) => row.chapter_num === selectedChapter);

	return (
		<div className="Main-cover">
			<div className="main-title" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
				<div className="addBtn" onClick={loading ? undefined : fetchBibleBooks}>
					<PiPencilSimpleLineFill />
					<p>{loading ? '불러오는 중...' : '새로고침'}</p>
				</div>
			</div>

			<div style={{ maxWidth: '1100px', margin: '20px auto', padding: '10px' }}>
				<div style={{ border: '1px solid #e8ebef', borderRadius: '12px', padding: '20px' }}>
					<div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
						<h3 style={{ fontSize: '18px', margin: 0 }}>biblebooks 전체 목록</h3>
						<select
							value={tableName}
							onChange={(e) => setTableName(e.target.value as 'gaehyuck' | 'shiunmal')}
							disabled={loading || verseLoading}
							style={{ height: '32px', padding: '0 8px' }}
						>
							<option value="gaehyuck">gaehyuck</option>
							<option value="shiunmal">shiunmal</option>
						</select>
					</div>
					<p style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>
						총 {totalCount.toLocaleString()}권
					</p>

					{errorMessage && <p style={{ color: '#d33', marginBottom: '12px' }}>오류: {errorMessage}</p>}

					<div style={{ maxHeight: '500px', overflow: 'auto', border: '1px solid #f1f3f5', borderRadius: '6px' }}>
						<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
							<thead style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
								<tr>
									<th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>book_order</th>
									<th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>testament</th>
									<th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>book_name_kr</th>
									<th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>book_name_short</th>
									<th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>book_name_en</th>
									<th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>book_name_en_short</th>
									<th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>total_chapters</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((row) => (
									<tr
										key={row.book_order}
										onClick={() => fetchBookVerses(row)}
										style={{
											cursor: 'pointer',
											backgroundColor: selectedBook?.book_order === row.book_order ? '#eef6ff' : 'transparent',
										}}
									>
										<td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5' }}>{row.book_order}</td>
										<td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5' }}>{row.testament}</td>
										<td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5' }}>{row.book_name_kr}</td>
										<td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5' }}>{row.book_name_short}</td>
										<td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5' }}>{row.book_name_en}</td>
										<td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5' }}>{row.book_name_en_short}</td>
										<td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5' }}>{row.total_chapters}</td>
									</tr>
								))}
								{!loading && rows.length === 0 && (
									<tr>
										<td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
											표시할 데이터가 없습니다.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<div style={{ marginTop: '20px', border: '1px solid #f1f3f5', borderRadius: '6px', padding: '12px' }}>
						<p style={{ fontWeight: 600, marginBottom: '8px' }}>
							{selectedBook ? `${selectedBook.book_name_kr} 장절 목록 (${tableName})` : '성경 책을 클릭하면 장절 목록이 표시됩니다.'}
						</p>
						{verseErrorMessage && <p style={{ color: '#d33', marginBottom: '8px' }}>오류: {verseErrorMessage}</p>}
						{selectedBook && (
							<>
								<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
									{chapterButtons.map((chapter) => (
										<button
											key={chapter}
											type="button"
											onClick={() => setSelectedChapter(chapter)}
											disabled={verseLoading}
											style={{
												padding: '6px 10px',
												border: '1px solid #d7dce3',
												borderRadius: '6px',
												background: selectedChapter === chapter ? '#eef6ff' : '#fff',
												cursor: verseLoading ? 'not-allowed' : 'pointer',
											}}
										>
											{chapter}장
										</button>
									))}
								</div>
								{selectedChapter === null ? (
									<p style={{ fontSize: '13px', color: '#666' }}>장을 선택하면 해당 장의 절 목록이 표시됩니다.</p>
								) : (
									<div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #f1f3f5', borderRadius: '6px' }}>
										<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
											<thead style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
												<tr>
													<th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>chapter_num</th>
													<th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>verse_num</th>
													<th style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>verse_text</th>
												</tr>
											</thead>
											<tbody>
												{filteredVerseRows.map((row) => (
													<tr key={row.id}>
														<td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5' }}>{row.chapter_num}</td>
														<td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5' }}>{row.verse_num}</td>
														<td style={{ padding: '8px', borderBottom: '1px solid #f1f3f5', textAlign: 'left' }}>{row.verse_text}</td>
													</tr>
												))}
												{!verseLoading && filteredVerseRows.length === 0 && (
													<tr>
														<td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
															표시할 장절 데이터가 없습니다.
														</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>
			<div style={{ height: '100px' }} />
		</div>
	);
}
