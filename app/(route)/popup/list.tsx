// components/admin/popups/PopupList.tsx
import { Table, Button, message, Modal } from "antd";
import { useState, useEffect } from "react";
import { getPopupColumns, Popup } from "./columns";
import { getPopups, deletePopup, togglePopupStatus } from "@/actions/popup-action";

interface PopupListProps {
  onAddNew: () => void;
  onRefreshNeeded: () => void;
  triggerRefresh: number;
  onEdit: (popup: any) => void; // 수정 핸들러 추가
}

const PopupList: React.FC<PopupListProps> = ({
  onAddNew,
  onRefreshNeeded,
  triggerRefresh,
  onEdit,
}) => {
  const [popups, setPopups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPopup, setPreviewPopup] = useState<Popup | null>(null);

  // 팝업 데이터 로드 함수
  const loadPopups = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const result = await getPopups({
        page: page,
        limit: pageSize,
        sort: "priority",
        order: "asc",
      });

      if (result.success) {
        setPopups(result.popups);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: result.total,
        });
        setError(null);
      } else {
        setError(result.error || "Failed to load popups");
      }
    } catch (err) {
      console.error("Failed to load popups:", err);
      setError("Failed to load popups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 핸들러
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    loadPopups(pagination.current, pagination.pageSize);
  };

  // 초기 데이터 로드 및 새로고침 트리거 감지
  useEffect(() => {
    loadPopups();
  }, [triggerRefresh]);

  // 팝업 미리보기 열기
  const showPreview = (popup: Popup) => {
    setPreviewPopup(popup);
    setPreviewVisible(true);
  };

  // 팝업 삭제 핸들러
  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Delete Popup',
      content: 'Are you sure you want to delete this popup? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const result = await deletePopup(id);
          if (result.success) {
            message.success("Popup deleted successfully");
            loadPopups(pagination.current, pagination.pageSize);
            onRefreshNeeded();
          } else {
            message.error(result.error || "Failed to delete popup");
          }
        } catch (error) {
          console.error("Error deleting popup:", error);
          message.error("An error occurred while deleting the popup");
        }
      },
    });
  };

  // 팝업 상태 토글 핸들러
  const handleToggleStatus = async (id: number) => {
    try {
      const result = await togglePopupStatus(id);
      if (result.success) {
        message.success("Popup status updated successfully");
        loadPopups(pagination.current, pagination.pageSize);
        onRefreshNeeded();
      } else {
        message.error(result.error || "Failed to update popup status");
      }
    } catch (error) {
      console.error("Error toggling popup status:", error);
      message.error("An error occurred while updating popup status");
    }
  };

  // 팝업 편집 핸들러
  const handleEdit = (record: any) => {
    onEdit(record);
  };

  // 팝업 목록 컬럼 설정
  const columns = getPopupColumns({
    onPreview: showPreview,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
  });

  // 팝업 타입 포맷팅
  const formatPopupType = (type: number) => {
    const types = ['Modal', 'Banner', 'Notification', 'Fullscreen'];
    return types[type] || `Type ${type}`;
  };

  // 트리거 타입 포맷팅
  const formatTriggerType = (type: number) => {
    const triggers = ['Page Load', 'Time Delay', 'Scroll', 'Exit Intent'];
    return triggers[type] || `Trigger ${type}`;
  };

  // 이미지 파싱
  const parseImages = (imagesJson: string | null): string[] => {
    if (!imagesJson) return [];
    try {
      const images = JSON.parse(imagesJson);
      return Array.isArray(images) ? images.map(img => img.url || img) : [];
    } catch (e) {
      console.error("Error parsing image JSON:", e);
      return [];
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      <Table
        columns={columns}
        dataSource={popups.map((popup) => ({ ...popup, key: popup.id }))}
        pagination={pagination}
        onChange={handleTableChange}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
      />

      {/* 팝업 미리보기 모달 */}
      <Modal
        open={previewVisible}
        title="Popup Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        className="popup-preview-modal"
      >
        {previewPopup && (
          <div className="space-y-4">
            {/* 팝업 기본 정보 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">{previewPopup.title}</h3>
              {previewPopup.content && (
                <p className="text-gray-700 mb-2">{previewPopup.content}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {formatPopupType(previewPopup.popupType)}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  {formatTriggerType(previewPopup.triggerType)}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                  Priority: {previewPopup.priority}
                </span>
                {previewPopup.useOverlay && (
                  <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded text-sm">
                    With Overlay
                  </span>
                )}
              </div>
            </div>

            {/* 이미지 미리보기 */}
            {previewPopup.images && parseImages(previewPopup.images).length > 0 && (
              <div>
                <h4 className="text-md font-semibold mb-2">Images</h4>
                <div className="grid grid-cols-2 gap-4">
                  {parseImages(previewPopup.images).map((image, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`Popup image ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 버튼 미리보기 */}
            {previewPopup.buttonText && (
              <div>
                <h4 className="text-md font-semibold mb-2">Button Preview</h4>
                <Button type="primary" className="mr-2">
                  {previewPopup.buttonText}
                </Button>
                {previewPopup.buttonAction && (
                  <span className="text-sm text-gray-500">
                    Action: {previewPopup.buttonAction}
                  </span>
                )}
              </div>
            )}

            {/* 추가 설정 정보 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold mb-2">Settings</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Target:</span> {previewPopup.targetAudience || 'All'}
                </div>
                <div>
                  <span className="font-medium">Show Frequency:</span> {
                    ['Always', 'Once', 'Daily'][previewPopup.showFrequency] || 'Always'
                  }
                </div>
                {previewPopup.triggerValue && (
                  <div>
                    <span className="font-medium">Trigger Value:</span> {previewPopup.triggerValue}
                  </div>
                )}
                <div>
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-1 ${previewPopup.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {previewPopup.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PopupList;