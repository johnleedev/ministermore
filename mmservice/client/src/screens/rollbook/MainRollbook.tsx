import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RollbookList from './RollbookList';
import RollbookChurhMain from './churchs/RollbookChurhMain';
import RollbookDepartment from './depart/RollbookDepartment';
import RollbookGroup from './group/RollbookGroup';
import RollbookGroupAdmin from './group/RollbookGroupAdmin';
export default function MainRollbook() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<RollbookList />} />
        <Route path="/churhmain" element={<RollbookChurhMain />} />
        <Route path="/depart" element={<RollbookDepartment />} />
        <Route path="/group" element={<RollbookGroup />} />
        <Route path="/groupadmin" element={<RollbookGroupAdmin />} />


      </Routes>
    </div>
  );
}
