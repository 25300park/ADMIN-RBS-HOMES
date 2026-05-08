"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUnitDetail, updateUnit } from "@/actions/unit-action";
import {
  Card,
  Descriptions,
  Image,
  Skeleton,
  Space,
  Tag,
  Button,
  Modal,
  Select,
  Input,
  InputNumber,
  message,
  Alert,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import {
  UNIT_TYPE_OPTIONS,
  SELL_TYPE_OPTIONS,
  AMENITY_OPTIONS,
} from "@/utils/constants/unit";

// 간단하게 상수 정의
const UNIT_STATUS = {
  ACTIVE: 0,       // 정상 (활성)
  COMPLETED: 1,    // 거래 완료
  HIDDEN: 2,       // 숨김
  NEGOTIATION: 3,  // 거래 중 (협상 중)
  DELETED: 5,      // 삭제됨
};

// 상태별 표시 정보
const STATUS_DISPLAY = {
  0: { text: "Active", color: "success" },
  1: { text: "Completed", color: "blue" },
  2: { text: "Contracted", color: "default" },
  3: { text: "Under Negotiation", color: "processing" },
  4: { text: "suspended", color: "green" },
  5: { text: "Deleted", color: "error" },
};

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = Number(params.id);
  const queryClient = useQueryClient();

  // 모달 상태 추가
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    status: 0,
    title: "",
    type: "",
    sellType: "",
    price: 0,
    ownerName: "",
    area: 0,
    floor: 0,
    bed: 0,
    bath: 0,
    parking: 0,
    amenity: [] as string[],
  });

  const { data: unit, isLoading } = useQuery({
    queryKey: ["unit", unitId],
    queryFn: () => getUnitDetail(unitId),
  });

  // 부모 창으로 페이지 이동하는 함수
  const navigateParentWindow = (url: string) => {
    if (window.opener) {
      // 모달(팝업)인 경우 - 부모 창으로 이동
      window.opener.location.href = url;
      window.close(); // 현재 모달 창 닫기
    } else {
      // 일반 페이지인 경우 - 현재 창에서 이동
      router.push(url);
    }
  };
   
  // Edit 버튼 클릭 핸들러
  const handleEditClick = () => {
    if (unit?.sellType === 'presale') {
      // 프리세일인 경우 부모 창에서 편집 페이지로 이동
      navigateParentWindow(`/add-unit?id=${unit.id}`);
      return;
    }
    
    // 일반 매물인 경우 기존 모달 로직 실행
    if (unit) {
      setEditForm({
        status: unit.status,
        title: unit.title,
        type: unit.type,
        sellType: unit.sellType,
        price: unit.price || 0,
        ownerName: unit.ownerName || "",
        area: unit.area || 0,
        floor: unit.floor || 0,
        bed: unit.bed || 0,
        bath: unit.bath || 0,
        parking: unit.parking || 0,
        amenity: unit.amenity ? JSON.parse(unit.amenity) : [],
      });
      setIsEditModalOpen(true);
    }
  };

  // 삭제 확인 모달 표시
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  // 삭제 실행
  const handleConfirmDelete = () => {
    if (unit) {
      // Delete 액션은 status만 변경
      updateMutation.mutate({
        id: unitId,
        status: UNIT_STATUS.DELETED,
      });
    }
    setIsDeleteModalOpen(false);
  };

  // 수정 mutation
  const updateMutation = useMutation({
    mutationFn: updateUnit,
    onSuccess: () => {
      message.success("Unit updated successfully");
      setIsEditModalOpen(false);
      
      // 데이터 새로고침
      queryClient.invalidateQueries({ queryKey: ["unit", unitId] });
      
      // 삭제 상태로 변경했을 경우만 처리
      if (editForm.status === UNIT_STATUS.DELETED || 
          (unit && unit.status === UNIT_STATUS.ACTIVE && editForm.status === UNIT_STATUS.DELETED)) {
        message.info("Unit has been deleted");
        
        // 부모 창이 있으면 부모 창의 데이터를 새로고침하고 모달 닫기
        if (window.opener) {
          // 부모 창의 쿼리 캐시 무효화 (부모 창에 React Query가 있다고 가정)
          try {
            window.opener.postMessage({ type: 'UNIT_DELETED', unitId }, '*');
          } catch (error) {
            console.log('Could not notify parent window:', error);
          }
          window.close();
        } else {
          router.push('/units');
        }
      }
    },
    onError: (error: Error) => {
      message.error(`Failed to update unit: ${error.message}`);
    },
  });

  // 유닛 상태 표시 헬퍼 함수 (간소화된 버전)
  const getStatusDisplay = (status: number) => {
    const statusInfo = STATUS_DISPLAY[status as keyof typeof STATUS_DISPLAY] || 
                      { text: "Unknown", color: "default" };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };
  
  // 삭제된 매물인지 확인
  const isDeleted = unit?.status === UNIT_STATUS.DELETED;

  if (isLoading) {
    return (
      <div className="w-full h-full m-0 p-0">
        <Card
          bordered={false}
          className="w-full h-full m-0 rounded-none shadow-none"
        >
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  if (!unit) {
    return <div>Unit not found</div>;
  }

  return (
    <div className="w-full h-full m-0 p-0">
      <Card
        title={
          <div className="flex items-center">
            {unit.title}
            {isDeleted && <Tag color="error" className="ml-2">DELETED</Tag>}
          </div>
        }
        bordered={false}
        className="w-full h-full m-0 rounded-none shadow-none"
        bodyStyle={{
          height: "calc(100vh - 55px)",
          overflow: "auto",
          padding: "16px",
          margin: 0,
        }}
        headStyle={{
          borderBottom: "1px solid #f0f0f0",
          padding: "0 16px",
          margin: 0,
        }}
        extra={
          <Space>
            <Button 
              type="primary" 
              onClick={handleEditClick}
              disabled={isDeleted}
            >
              Edit Unit
            </Button>
            {!isDeleted && (
              <Button 
                danger
                onClick={handleDeleteClick}
              >
                Delete
              </Button>
            )}
          </Space>
        }
      >
        {isDeleted && (
          <Alert 
            message="This unit has been deleted" 
            description="This unit is no longer available and cannot be edited."
            type="warning" 
            showIcon 
            className="mb-4"
          />
        )}
        
        <div className="space-y-4">
          {unit.images && (
            <div className="flex flex-wrap gap-2">
              <Image.PreviewGroup>
                {JSON.parse(unit.images as string).map(
                  (image: string, index: number) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`Unit image ${index + 1}`}
                      width={200}
                      style={{
                        objectFit: "cover",
                        borderRadius: 0,
                        opacity: isDeleted ? 0.6 : 1,
                      }}
                    />
                  )
                )}
              </Image.PreviewGroup>
            </div>
          )}

          <Descriptions
            bordered
            column={1}
            size="small"
            className="m-0"
            contentStyle={{ padding: "8px 12px" }}
            labelStyle={{ padding: "8px 12px", width: "120px" }}
          >
            <Descriptions.Item label="Status">
              {getStatusDisplay(unit.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Agent">
              <Space direction="vertical">
                <div>Name: {unit.admin.name}</div>
                <div>Phone: {unit.admin.phone}</div>
                <div>Email: {unit.admin.email}</div>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Type">{unit.type}</Descriptions.Item>
            <Descriptions.Item label="Sale Type">
              {unit.sellType}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              {unit.fullAdress}
            </Descriptions.Item>
            <Descriptions.Item label="Owner">
              {unit.ownerName}
            </Descriptions.Item>
            <Descriptions.Item label="Details">
              <Space direction="vertical">
                <div>Area: {unit.area}m²</div>
                <div>Floor: {unit.floor || "-"}</div>
                <div>
                  Bed/Bath: {unit.bed || 0}/{unit.bath || 0}
                </div>
                <div>Parking: {unit.parking || 0} spaces</div>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Amenities">
              <div className="flex flex-wrap gap-2">
                {typeof unit.amenity === 'string' && 
                  unit.amenity
                    .split(",")
                    .map((amenity: string, index: number) => (
                      <Tag key={index}>{amenity.trim()}</Tag>
                    ))}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Price">
              {unit.price?.toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </Descriptions.Item>
            {unit.note && (
              <Descriptions.Item label="Notes">{unit.note}</Descriptions.Item>
            )}
          </Descriptions>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit Unit"
        open={isEditModalOpen}
        onOk={() => {
          updateMutation.mutate({
            id: unitId,
            ...editForm,
            amenity: JSON.stringify(editForm.amenity),
          });
        }}
        onCancel={() => setIsEditModalOpen(false)}
        confirmLoading={updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <div className="mb-2">Status</div>
            <Select
              value={editForm.status}
              onChange={(value) =>
                setEditForm((prev) => ({ ...prev, status: value }))
              }
              style={{ width: "100%" }}
              options={[
                { label: "Active", value: UNIT_STATUS.ACTIVE },
                { label: "Under Negotiation", value: UNIT_STATUS.NEGOTIATION },
                { label: "Completed", value: UNIT_STATUS.COMPLETED },
                { label: "Hidden", value: UNIT_STATUS.HIDDEN },
              ]}
            />
          </div>
          <div>
            <div className="mb-2">Title</div>
            <Input
              value={editForm.title}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter title..."
            />
          </div>
          <div>
            <div className="mb-2">Type</div>
            <Select
              value={editForm.type}
              onChange={(value) =>
                setEditForm((prev) => ({ ...prev, type: value }))
              }
              style={{ width: "100%" }}
              options={[...UNIT_TYPE_OPTIONS]}
            />
          </div>
          <div>
            <div className="mb-2">Sale Type</div>
            <Select
              value={editForm.sellType}
              onChange={(value) =>
                setEditForm((prev) => ({ ...prev, sellType: value }))
              }
              style={{ width: "100%" }}
              options={[...SELL_TYPE_OPTIONS]}
            />
          </div>
          <div>
            <div className="mb-2">Owner Name</div>
            <Input
              value={editForm.ownerName}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, ownerName: e.target.value }))
              }
              placeholder="Enter owner name..."
            />
          </div>
          <div>
            <div className="mb-2">Area (m²)</div>
            <InputNumber
              value={editForm.area}
              onChange={(value) =>
                setEditForm((prev) => ({ ...prev, area: value || 0 }))
              }
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <div className="mb-2">Floor</div>
            <InputNumber
              value={editForm.floor}
              onChange={(value) =>
                setEditForm((prev) => ({ ...prev, floor: value || 0 }))
              }
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <div className="mb-2">Bedrooms</div>
            <InputNumber
              value={editForm.bed}
              onChange={(value) =>
                setEditForm((prev) => ({ ...prev, bed: value || 0 }))
              }
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <div className="mb-2">Bathrooms</div>
            <InputNumber
              value={editForm.bath}
              onChange={(value) =>
                setEditForm((prev) => ({ ...prev, bath: value || 0 }))
              }
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <div className="mb-2">Parking</div>
            <InputNumber
              value={editForm.parking}
              onChange={(value) =>
                setEditForm((prev) => ({ ...prev, parking: value || 0 }))
              }
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <div className="mb-2">Amenities</div>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Select amenities"
              value={editForm.amenity}
              onChange={(values: string[]) =>
                setEditForm((prev) => ({
                  ...prev,
                  amenity: values,
                }))
              }
              options={AMENITY_OPTIONS}
              allowClear
            />
          </div>
          <div>
            <div className="mb-2">Price</div>
            <InputNumber
              value={editForm.price}
              onChange={(value) =>
                setEditForm((prev) => ({ ...prev, price: value || 0 }))
              }
              style={{ width: "100%" }}
              formatter={(value) =>
                `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => Number(value!.replace(/₱\s?|(,*)/g, ""))}
            />
          </div>
        </div>
      </Modal>
      
      {/* 삭제 확인 모달 */}
      <Modal
        title="Delete Unit"
        open={isDeleteModalOpen}
        onOk={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this unit? This action cannot be undone.</p>
        <p>Title: {unit.title}</p>
        <p>ID: {unit.id}</p>
      </Modal>
    </div>
  );
}