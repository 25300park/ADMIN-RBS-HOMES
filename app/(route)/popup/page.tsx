// app/admin/popup/page.tsx
"use client";

import { useState } from "react";
import { Button, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PopupList from "./list";
import PopupForm from "./form";

export interface PopupPageProps {}

const PopupPage = ({}: PopupPageProps): React.ReactNode => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingPopup, setEditingPopup] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 새로고침 트리거 함수
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // 팝업 추가 성공 핸들러
  const handleAddSuccess = () => {
    setIsAddModalVisible(false);
    triggerRefresh();
  };

  // 팝업 수정 핸들러
  const handleEdit = (popup: any) => {
    setEditingPopup(popup);
    setIsEditModalVisible(true);
  };

  // 팝업 수정 성공 핸들러
  const handleEditSuccess = () => {
    setIsEditModalVisible(false);
    setEditingPopup(null);
    triggerRefresh();
  };

  return (
    <div className="w-full px-2">
      <div className="flex justify-end items-center mb-6">

        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setIsAddModalVisible(true)}
        >
          Add New Popup
        </Button>
      </div>

      {/* 통계 카드들 (선택사항)
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">12</div>
          <div className="text-sm text-gray-600">Total Popups</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">8</div>
          <div className="text-sm text-gray-600">Active Popups</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-orange-600">4</div>
          <div className="text-sm text-gray-600">Scheduled</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">85%</div>
          <div className="text-sm text-gray-600">Avg. Engagement</div>
        </div>
      </div> */}

      {/* 팝업 목록 */}
      <div className="bg-white rounded-lg">
        {/* <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Popup List</h2>
          <p className="text-sm text-gray-600">
            Manage all your website popups from this dashboard
          </p>
        </div> */}
        <div className="">
          <PopupList 
            onAddNew={() => setIsAddModalVisible(true)}
            onRefreshNeeded={triggerRefresh}
            triggerRefresh={refreshTrigger}
            onEdit={handleEdit}
          />
        </div>
      </div>

      {/* 팝업 추가 모달 */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <PlusOutlined />
            <span>Add New Popup</span>
          </div>
        }
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose={true}
      >
        <PopupForm
          onSuccess={handleAddSuccess}
          onCancel={() => setIsAddModalVisible(false)}
        />
      </Modal>
      {/* 팝업 수정 모달 */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <span>Edit Popup</span>
          </div>
        }
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingPopup(null);
        }}
        footer={null}
        width={900}
        destroyOnClose={true}
      >
        <PopupForm
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setIsEditModalVisible(false);
            setEditingPopup(null);
          }}
          editData={editingPopup}
          isEdit={true}
        />
      </Modal>
    </div>
  );
};

export default PopupPage;