// app/admin/banner/page.tsx
"use client";

import { useState } from "react";
import { Button, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import BannerList from "./list";
import BannerForm from "./form";

export interface BannerPageProps {}

const BannerPage = ({}: BannerPageProps): React.ReactNode => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 새로고침 트리거 함수
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // 배너 추가 성공 핸들러
  const handleAddSuccess = () => {
    setIsAddModalVisible(false);
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
          Add New Banner
        </Button>
      </div>

      <BannerList 
        onAddNew={() => setIsAddModalVisible(true)}
        onRefreshNeeded={triggerRefresh}
        triggerRefresh={refreshTrigger}
      />

      {/* 배너 추가 모달 */}
      <Modal
        title="Add New Banner"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
        width={800}
      >
        <BannerForm
          onSuccess={handleAddSuccess}
          onCancel={() => setIsAddModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default BannerPage;