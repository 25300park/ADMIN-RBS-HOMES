// components/admin/banners/BannerList.tsx
import { Table, Button, message } from "antd";
import { useState, useEffect } from "react";
import { getBannerColumns, Banner } from "./columns";
import BannerPreview from "./banner-preview";
import { getBanners, deleteBanner } from "@/actions/banners-action";

interface BannerListProps {
  onAddNew: () => void;
  onRefreshNeeded: () => void;
  triggerRefresh: number;
}

const BannerList: React.FC<BannerListProps> = ({
  onAddNew,
  onRefreshNeeded,
  triggerRefresh,
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // 배너 데이터 로드 함수
  const loadBanners = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const result = await getBanners({
        page: page,
        limit: pageSize,
        sort: "priority",
        order: "asc",
      });

      setBanners(result.banners);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: result.total,
      });
      setError(null);
    } catch (err) {
      console.error("Failed to load banners:", err);
      setError("Failed to load banners. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 핸들러
  const handleTableChange = (pagination: any) => {
    loadBanners(pagination.current, pagination.pageSize);
  };

  // 초기 데이터 로드 및 새로고침 트리거 감지
  useEffect(() => {
    loadBanners();
  }, [triggerRefresh]);

  // 이미지 미리보기 열기
  const showPreview = (images: string[]) => {
    setPreviewImages(images);
    setPreviewVisible(true);
  };

  // 배너 삭제 핸들러
  const handleDelete = async (id: number) => {
    try {
      const result = await deleteBanner(id);
      if (result.success) {
        message.success("Banner deleted successfully");
        loadBanners(pagination.current, pagination.pageSize);
        onRefreshNeeded();
      } else {
        message.error("Failed to delete banner");
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
      message.error("An error occurred while deleting the banner");
    }
  };

  // 배너 목록 컬럼 설정
  const columns = getBannerColumns({
    onPreview: showPreview,
    onEdit: (record) => {
      // 편집 기능 구현
      console.log("Edit banner:", record);
    },
    onDelete: handleDelete,
  });

  return (
    <>
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      <Table
        columns={columns}
        dataSource={banners.map((banner) => ({ ...banner, key: banner.id }))}
        pagination={pagination}
        onChange={handleTableChange}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1000 }}
      />

      <BannerPreview
        visible={previewVisible}
        images={previewImages}
        onClose={() => setPreviewVisible(false)}
      />
    </>
  );
};

export default BannerList;
