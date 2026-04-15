import React, { useCallback, useEffect, useState } from 'react';
import '../Admin.scss';
import MainURL from '../../MainURL';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend);

type VisitStatByIp = {
  date: string;
  uniqueVisitors: number;
  totalVisits: number;
};
type VisitStatByAll = {
  date: string;
  totalVisits: number;
};

export default function AdminManage ( props: any) {

  const [refresh, setRefresh] = useState<boolean>(false); 
  const [listSort, setListSort] = useState('크롤링');
    const [listAllLength, setListAllLength] = useState<number>(0);

  const [visitStatsByIp, setVisitStatsByIp] = useState<VisitStatByIp[]>([]);
  const [mainConnectStats, setMainConnectStats] = useState<VisitStatByAll[]>([]);
  const [recruitViewStats, setRecruitViewStats] = useState<VisitStatByAll[]>([]);
  const [newsViewStats, setNewsViewStats] = useState<VisitStatByAll[]>([]);
  const [praiseViewStats, setPraiseViewStats] = useState<VisitStatByAll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 게시글 가져오기 (최신 등록글)
  const fetchPosts = async () => {
    const url = `${MainURL}/recruitminister/work/getrecruitmanage`;
    const res = await axios.get(url)
    if (res.data.resultData) {
      const copy = res.data.resultData;
      
    } else {
      
    }
  };

  // 방문자 통계 가져오기 (ip별, 전체)
  const fetchVisitStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. IP별 방문자 통계
      const ipRes = await axios.get(`${MainURL}/admin/homeusercount/statistics`);
      setVisitStatsByIp(ipRes.data || []);
      // 2. 전체 메인화면 접속수
      const mainRes = await axios.get(`${MainURL}/admin/countall?type=mainconnect`);
      setMainConnectStats(mainRes.data || []);
      // 3. recruit 상세페이지 접속수
      const recruitRes = await axios.get(`${MainURL}/admin/countall?type=recruitview`);
      setRecruitViewStats(recruitRes.data || []);
      // 4. 뉴스 클릭수
      const newsRes = await axios.get(`${MainURL}/admin/countall?type=newsview`);
      setNewsViewStats(newsRes.data || []);
      // 5. 찬양 클릭수
      const praiseRes = await axios.get(`${MainURL}/admin/countall?type=praisewordclick`);
      setPraiseViewStats(praiseRes.data || []);
    } catch (err: any) {
      setError('방문자 통계 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchVisitStats();
  }, [refresh, listSort]); 

  // 날짜별 통계 합치기
  const mergedStats: Array<{
    date: string;
    uniqueVisitors: number;
    totalVisits: number;
    mainConnect: number;
    recruitView: number;
    newsView: number;
    praiseView: number;
  }> = [];

  // 날짜 집합 만들기
  const allDates = Array.from(new Set([
    ...visitStatsByIp.map(s => s.date),
    ...mainConnectStats.map(s => s.date),
    ...recruitViewStats.map(s => s.date),
    ...newsViewStats.map(s => s.date),
    ...praiseViewStats.map(s => s.date),
  ])).sort((a, b) => b.localeCompare(a)); // 내림차순

  allDates.forEach(date => {
    const ipStat = visitStatsByIp.find(s => s.date === date);
    const mainStat = mainConnectStats.find(s => s.date === date);
    const recruitStat = recruitViewStats.find(s => s.date === date);
    const newsStat = newsViewStats.find(s => s.date === date);
    const praiseStat = praiseViewStats.find(s => s.date === date);
    mergedStats.push({
      date,
      uniqueVisitors: ipStat?.uniqueVisitors ?? 0,
      totalVisits: ipStat?.totalVisits ?? 0,
      mainConnect: mainStat?.totalVisits ?? 0,
      recruitView: recruitStat?.totalVisits ?? 0,
      newsView: newsStat?.totalVisits ?? 0,
      praiseView: praiseStat?.totalVisits ?? 0,
    });
  });

  return (
    <div className="admin-register">
      <div className="inner">
        <h2 style={{marginBottom: 20}}>방문자 통계 (최근 30일)</h2>
        {loading ? (
          <div>로딩중...</div>
        ) : error ? (
          <div style={{color: 'red'}}>{error}</div>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{borderCollapse: 'collapse', width: '100%', minWidth: 1100, marginBottom: 40}}>
              <thead>
                <tr style={{background: '#f5f5f5'}}>
                  <th style={{padding: '8px 12px', border: '1px solid #ddd'}}>날짜</th>
                  <th style={{padding: '8px 12px', border: '1px solid #ddd'}}>순방문자수</th>
                  <th style={{padding: '8px 12px', border: '1px solid #ddd'}}>총 방문수</th>
                  <th style={{padding: '8px 12px', border: '1px solid #ddd'}}>메인 접속수</th>
                  <th style={{padding: '8px 12px', border: '1px solid #ddd'}}>recruit 상세 접속수</th>
                  <th style={{padding: '8px 12px', border: '1px solid #ddd'}}>뉴스 클릭수</th>
                  <th style={{padding: '8px 12px', border: '1px solid #ddd'}}>찬양 클릭수</th>
                </tr>
              </thead>
              <tbody>
                {mergedStats.map(stat => (
                  <tr key={stat.date}>
                    <td style={{padding: '8px 12px', border: '1px solid #ddd'}}>{stat.date}</td>
                    <td style={{padding: '8px 12px', border: '1px solid #ddd'}}>{stat.uniqueVisitors}</td>
                    <td style={{padding: '8px 12px', border: '1px solid #ddd'}}>{stat.totalVisits}</td>
                    <td style={{padding: '8px 12px', border: '1px solid #ddd'}}>{stat.mainConnect}</td>
                    <td style={{padding: '8px 12px', border: '1px solid #ddd'}}>{stat.recruitView}</td>
                    <td style={{padding: '8px 12px', border: '1px solid #ddd'}}>{stat.newsView}</td>
                    <td style={{padding: '8px 12px', border: '1px solid #ddd'}}>{stat.praiseView}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* 통계 그래프 */}
        <div style={{marginTop: 40}}>
          <Line
            data={{
              labels: mergedStats.map(stat => stat.date).reverse(),
              datasets: [
                {
                  label: '순방문자수',
                  data: mergedStats.map(stat => stat.uniqueVisitors).reverse(),
                  borderColor: 'rgb(255, 99, 132)',
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  tension: 0.2,
                },
                {
                  label: '총 방문수',
                  data: mergedStats.map(stat => stat.totalVisits).reverse(),
                  borderColor: 'rgb(54, 162, 235)',
                  backgroundColor: 'rgba(54, 162, 235, 0.2)',
                  tension: 0.2,
                },
                {
                  label: '메인 접속수',
                  data: mergedStats.map(stat => stat.mainConnect).reverse(),
                  borderColor: 'rgb(255, 206, 86)',
                  backgroundColor: 'rgba(255, 206, 86, 0.2)',
                  tension: 0.2,
                },
                {
                  label: 'recruit 상세 접속수',
                  data: mergedStats.map(stat => stat.recruitView).reverse(),
                  borderColor: 'rgb(75, 192, 192)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  tension: 0.2,
                },
                {
                  label: '뉴스 클릭수',
                  data: mergedStats.map(stat => stat.newsView).reverse(),
                  borderColor: 'rgb(153, 102, 255)',
                  backgroundColor: 'rgba(153, 102, 255, 0.2)',
                  tension: 0.2,
                },
                {
                  label: '찬양 클릭수',
                  data: mergedStats.map(stat => stat.praiseView).reverse(),
                  borderColor: 'rgb(255, 159, 64)',
                  backgroundColor: 'rgba(255, 159, 64, 0.2)',
                  tension: 0.2,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
                title: { display: true, text: '방문자/접속수/클릭수 통계 그래프' },
              },
              scales: {
                x: { title: { display: true, text: '날짜' } },
                y: { title: { display: true, text: '수치' }, beginAtZero: true },
              },
            }}
          />
        </div>
      </div>
      <div style={{height:'200px'}}></div>
    </div>
  );
}
