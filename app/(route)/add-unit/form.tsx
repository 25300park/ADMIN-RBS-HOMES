"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Row,
  Col,
  Card,
  Input,
  Upload,
  Button,
  Select,
  Switch,
  Space,
  message,
  notification,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  SaveOutlined,
  VideoCameraOutlined,
  FileOutlined,
  DeleteOutlined,
  LoadingOutlined,
  StarFilled,
  PictureOutlined,
} from "@ant-design/icons";
import { Editor } from "@tinymce/tinymce-react";
import { useSession } from "next-auth/react";
import {
  RegularUnitPreview,
  PreSaleUnitPreview,
} from "@/components/unit-preview";
import AdminAddressSearch from "@/components/address-search";
import { registerUnit } from "@/actions/add-unit-action";

// 옵션들 import
import {
  furnitureOptions,
  interioredOptions,
  parkingOptions,
  bedOptions,
  bathOptions,
  floorOptions,
  petPolicyOptions,
  propertyTypeOptions,
  saleTypeOptions,
} from "./form-options";

const { Option } = Select;
const { TextArea } = Input;

// 타입 정의
interface FormDataTypes {
  [key: string]: any;
}

interface UnifiedAdminFormProps {
  initialData?: any;
}

interface AddressData {
  [key: string]: any;
}

// 미디어 섹션 컴포넌트
interface MediaSectionProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRemove: () => void;
  children: React.ReactNode;
}

const MediaSection: React.FC<MediaSectionProps> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onRemove,
  children
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorImageUpload = (blobInfo: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const uploadFormData = new FormData();
      uploadFormData.append("file", blobInfo.blob(), blobInfo.filename());

      fetch("/api/upload/editor", {
        method: "POST",
        body: uploadFormData,
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.url) {
            resolve(result.url);
          } else {
            reject("Upload failed");
          }
        })
        .catch(() => reject("Upload failed"));
    });
  };

  const editorConfig = {
    apiKey: process.env.NEXT_PUBLIC_TINYMCE_KEY,
    height: 300,
    menubar: "file edit view insert format tools table help",
    plugins: [
      "advlist", "autolink", "lists", "link", "image", "charmap", "anchor",
      "searchreplace", "visualblocks", "code", "insertdatetime", "media",
      "table", "paste", "code", "help", "wordcount",
    ],
    toolbar:
      "undo redo | blocks fontsize | bold italic underline | " +
      "alignleft aligncenter alignright alignjustify | " +
      "bullist numlist outdent indent | link image media table | code",
    images_upload_handler: handleEditorImageUpload,
    automatic_uploads: true,
    file_picker_types: "image media",
    content_style: `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; }
      img { max-width: 100%; height: auto; }
      video { max-width: 100%; height: auto; }
      table { border-collapse: collapse; width: 100%; }
      table td, table th { border: 1px solid #ddd; padding: 8px; }
    `,
    branding: false,
  };

  return (
    <Card 
      size="small" 
      style={{ marginBottom: "16px", border: "2px dashed #d9d9d9" }}
      extra={
        <Button 
          icon={<DeleteOutlined />} 
          size="small" 
          danger 
          type="text"
          onClick={onRemove}
        >
          Remove
        </Button>
      }
    >
      {/* 제목 입력 */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "12px",
          fontWeight: "500",
          color: "#666",
        }}>
          Section Title *
        </label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter section title"
        />
      </div>

      {/* 파일/이미지/비디오 업로드 영역 */}
      <div style={{ marginBottom: "16px" }}>
        {children}
      </div>

      {/* 에디터 */}
      <div>
        <label style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "12px",
          fontWeight: "500",
          color: "#666",
        }}>
          Description
        </label>
        <Editor
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_KEY}
          onInit={(evt: any, editor: any) => {
            editorRef.current = editor;
          }}
          value={description}
          onEditorChange={onDescriptionChange}
          init={editorConfig}
        />
      </div>
    </Card>
  );
};

// 메인 컴포넌트
export default function UnifiedAdminForm({
  initialData = null,
}: UnifiedAdminFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  
  // 메인 에디터 ref
  const mainEditorRef = useRef<any>(null);

  // 폼 데이터 상태 - 수정 모드 지원
  const [unitFormData, setUnitFormData] = useState<FormDataTypes>({
    id: initialData?.id || undefined,
    saleType: initialData?.sellType || "rent", // sellType에서 saleType으로 매핑
    
    // 기본 정보
    title: initialData?.title || "",
    projectTitle: initialData?.projectTitle || initialData?.title || "", // 프리세일의 경우 title을 projectTitle로도 사용
    unitType: initialData?.type || "condo",
    fullAddress: initialData?.fullAdress || "",
    address1: initialData?.address1?.toString() || "",
    address2: initialData?.address2 || "",
    address3: initialData?.address3 || "",
    addressSelf: initialData?.addressSelf || "",

    // 일반 매물 전용
    ownerName: initialData?.ownerName || "",
    area: initialData?.area?.toString() || "",
    floor: initialData?.floor?.toString() || "",
    bed: initialData?.bed?.toString() || "0",
    bath: initialData?.bath?.toString() || "1",
    parking: initialData?.parking?.toString() || "0",
    furniture: initialData?.furniture || "unfurnished",
    interiored: initialData?.interiored || "Interiored",
    petPolicy: initialData?.petPolicy || "Not allowed",
    amenity: (() => {
      if (!initialData?.amenity) return [];
      if (typeof initialData.amenity === "string") {
        try {
          return JSON.parse(initialData.amenity);
        } catch {
          // JSON 파싱 실패시 쉼표로 분리된 문자열로 처리
          return initialData.amenity.split(',').map((item: string) => item.trim());
        }
      }
      return Array.isArray(initialData.amenity) ? initialData.amenity : [];
    })(),
    yearCompletion: initialData?.yearCompletion || "",
    outstandingPayment: initialData?.outstandingPayment?.toString() || "0",
    price: initialData?.price?.toString() || "0",
    note: initialData?.note || "",

    // 위치
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,

    // 메인 이미지 처리
    mainImage: (() => {
      if (!initialData?.images) return "";
      
      try {
        const images = typeof initialData.images === "string" 
          ? JSON.parse(initialData.images) 
          : initialData.images;
        
        if (Array.isArray(images) && images.length > 0) {
          return typeof images[0] === "string" ? images[0] : images[0]?.url || "";
        }
      } catch (error) {
        console.error("Error parsing images:", error);
      }
      
      return "";
    })(),

    // 메인 에디터 컨텐츠
    editorContent: initialData?.editorContent || "<h2>Project Description</h2><p>Enter your project description here...</p>",

    // 동적 미디어 섹션들 - 수정 모드용 파싱
    carouselItems: (() => {
      if (!initialData?.carouselImagesContent) return [];
      try {
        return typeof initialData.carouselImagesContent === "string"
          ? JSON.parse(initialData.carouselImagesContent)
          : initialData.carouselImagesContent;
      } catch (error) {
        console.error("Error parsing carouselImagesContent:", error);
        return [];
      }
    })(),
    
    videoItems: (() => {
      if (!initialData?.videos) return [];
      try {
        let parsed;
        if (typeof initialData.videos === "string") {
          parsed = JSON.parse(initialData.videos);
        } else {
          parsed = initialData.videos;
        }
        // 배열인지 확인하고, 아니면 빈 배열 반환
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error("Error parsing videos:", error);
        return [];
      }
    })(),
    
    fileItems: (() => {
      if (!initialData?.attachments) return [];
      try {
        let parsed;
        if (typeof initialData.attachments === "string") {
          parsed = JSON.parse(initialData.attachments);
        } else {
          parsed = initialData.attachments;
        }
        // 배열인지 확인하고, 아니면 빈 배열 반환
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error("Error parsing attachments:", error);
        return [];
      }
    })(),

    // 설정
    isPublished: initialData?.status === 1 || false,
  });

  // 공통 변수들
  const userLevel = session?.user?.level as number;
  const hasPreSalePermission = [0, 20, 30, 40].includes(userLevel);
  const isEditMode = Boolean(unitFormData.id);
  const isPreSale = unitFormData.saleType === "presale";

  // 핸들러 함수들
  const handleChange = (field: string, value: any) => {
    setUnitFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (addressData: AddressData) => {
    setUnitFormData((prev: any) => ({
      ...prev,
      ...addressData,
    }));
  };

  const handlePriceChange = (field: string, value: string) => {
    const rawValue = value.replace(/[^0-9]/g, "");
    if (!isNaN(Number(rawValue))) {
      const formattedValue = Number(rawValue).toLocaleString();
      handleChange(field, formattedValue);
    }
  };

  const handleAmenityChange = (value: string) => {
    if (value && !unitFormData.amenity.includes(value)) {
      handleChange("amenity", [...unitFormData.amenity, value]);
    }
  };

  const removeAmenity = (index: number) => {
    const newAmenities = unitFormData.amenity.filter((_: any, i: number) => i !== index);
    handleChange("amenity", newAmenities);
  };

  // 메인 이미지 업로드
  const handleMainImageBeforeUpload = async (file: File) => {
    try {
      message.loading('Uploading main image...', 0);
      
      const uploadFormData = new FormData();
      uploadFormData.append("files", file);

      console.log('Uploading main image...');

      const response = await fetch("/api/upload/unit", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);

      if (result.uploadedUrls && result.uploadedUrls.length > 0) {
        handleChange("mainImage", result.uploadedUrls[0]);
        message.destroy();
        message.success("Main image uploaded successfully!");
      } else {
        throw new Error("Upload failed: No URL returned");
      }
    } catch (error) {
      console.error("Upload error:", error);
      message.destroy();
      message.error("Main image upload failed");
    }
    
    return false;
  };

  // 캐러셀 이미지 업로드
  const handleCarouselImageUpload = async (info: any, carouselId: string) => {
    const { fileList } = info;

    try {
      const imageUrls = await Promise.all(
        fileList.map(async (file: any) => {
          if (file.originFileObj && !file.url) {
            const uploadFormData = new FormData();
            uploadFormData.append("files", file.originFileObj);

            const response = await fetch("/api/upload/unit", {
              method: "POST",
              body: uploadFormData,
            });

            const result = await response.json();

            if (result.uploadedUrls && result.uploadedUrls.length > 0) {
              return result.uploadedUrls[0];
            }
          }
          return file.url;
        })
      );

      setUnitFormData((prev: any) => ({
        ...prev,
        carouselItems: prev.carouselItems.map((item: any) =>
          item.id === carouselId
            ? { ...item, images: imageUrls.filter(Boolean) }
            : item
        )
      }));
    } catch (error) {
      message.error("Carousel image upload failed");
    }
  };

  // 비디오 업로드
  const handleVideoUpload = async (file: File, videoId: string) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload/video", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.url) {
        setUnitFormData((prev: any) => ({
          ...prev,
          videoItems: prev.videoItems.map((item: any) =>
            item.id === videoId
              ? { ...item, videoUrl: result.url }
              : item
          )
        }));
        message.success("Video uploaded successfully!");
      }
    } catch (error: any) {
      message.error(`Video upload failed: ${error.message}`);
    }
  };

  // 파일 업로드
  const handleFileUpload = async (file: File, fileId: string) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload/file", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.url) {
        setUnitFormData((prev: any) => ({
          ...prev,
          fileItems: prev.fileItems.map((item: any) =>
            item.id === fileId
              ? { 
                  ...item, 
                  fileUrl: result.url,
                  fileName: file.name,
                  mimeType: file.type,
                  size: file.size
                }
              : item
          )
        }));
        message.success("File uploaded successfully!");
      }
    } catch (error: any) {
      message.error(`File upload failed: ${error.message}`);
    }
  };

  // 새 아이템 추가 함수들
  const addNewCarousel = () => {
    const newCarousel = {
      id: `carousel_${Date.now()}`,
      title: "",
      description: "<p>Enter carousel description...</p>",
      images: []
    };
    handleChange("carouselItems", [...unitFormData.carouselItems, newCarousel]);
  };

  const addNewVideo = () => {
    const newVideo = {
      id: `video_${Date.now()}`,
      title: "",
      description: "<p>Enter video description...</p>",
      videoUrl: ""
    };
    handleChange("videoItems", [newVideo]);
  };

  const addNewFile = () => {
    const newFile = {
      id: `file_${Date.now()}`,
      title: "",
      description: "<p>Enter file description...</p>",
      fileUrl: "",
      fileName: "",
      mimeType: "",
      size: 0
    };
    handleChange("fileItems", [newFile]);
  };

  // 아이템 제거 함수들
  const removeCarousel = (carouselId: string) => {
    handleChange("carouselItems", unitFormData.carouselItems.filter((item: any) => item.id !== carouselId));
  };

  const removeVideo = (videoId: string) => {
    handleChange("videoItems", unitFormData.videoItems.filter((item: any) => item.id !== videoId));
  };

  const removeFile = (fileId: string) => {
    handleChange("fileItems", unitFormData.fileItems.filter((item: any) => item.id !== fileId));
  };

  // 아이템 업데이트 함수들
  const updateCarousel = (carouselId: string, field: string, value: any) => {
    setUnitFormData((prev: any) => ({
      ...prev,
      carouselItems: prev.carouselItems.map((item: any) =>
        item.id === carouselId ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateVideo = (videoId: string, field: string, value: any) => {
    setUnitFormData((prev: any) => ({
      ...prev,
      videoItems: prev.videoItems.map((item: any) =>
        item.id === videoId ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateFile = (fileId: string, field: string, value: any) => {
    setUnitFormData((prev: any) => ({
      ...prev,
      fileItems: prev.fileItems.map((item: any) =>
        item.id === fileId ? { ...item, [field]: value } : item
      )
    }));
  };

  // 유효성 검사
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!unitFormData.title?.trim()) {
      errors.push(isPreSale ? "Project title is required" : "Title is required");
    }

    if (!unitFormData.fullAddress?.trim()) {
      errors.push("Address is required");
    }

    if (!isPreSale) {
      if (!unitFormData.area || parseInt(unitFormData.area) <= 0) {
        errors.push("Area must be greater than 0");
      }
      if (!unitFormData.price || parseFloat(unitFormData.price.replace(/,/g, "")) <= 0) {
        errors.push("Price must be greater than 0");
      }
    } else {
      if (!unitFormData.price || parseFloat(unitFormData.price.replace(/,/g, "")) <= 0) {
        errors.push("Price must be greater than 0");
      }
    }

    if (!unitFormData.mainImage) {
      errors.push("At least one main image is required");
    }

    if (errors.length > 0) {
      notification.error({
        message: "Validation Error",
        description: (
          <div>
            {errors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        ),
        duration: 5,
      });
      return false;
    }

    return true;
  };

  // 저장 함수 - 수정 모드 지원
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const saveData: any = {
        ...unitFormData,
        // 수정 모드인 경우 ID 포함
        ...(isEditMode && { id: unitFormData.id }),
        
        editorContent: mainEditorRef.current
          ? mainEditorRef.current.getContent()
          : unitFormData.editorContent,
        
        images: unitFormData.mainImage ? [unitFormData.mainImage] : [],
        carouselImagesContent: JSON.stringify(unitFormData.carouselItems || []),
        videos: JSON.stringify(unitFormData.videoItems || []),
        attachments: JSON.stringify(unitFormData.fileItems || []),
        
        // sellType을 saleType에서 가져옴
        sellType: unitFormData.saleType,
        type: unitFormData.unitType,
      };

      const result = await registerUnit(saveData);

      if (result.success) {
        notification.success({
          message: "Success",
          description: isEditMode ? "Unit updated successfully" : result.message,
          duration: 3,
        });

        if (isEditMode) {
          // 수정 모드인 경우 - 부모 창이 있으면 부모 창으로 이동
          if (window.opener) {
            try {
              // 부모 창에 업데이트 알림
              window.opener.postMessage({ 
                type: 'UNIT_UPDATED', 
                unitId: unitFormData.id 
              }, '*');
              window.close();
            } catch (error) {
              console.log('Could not notify parent window:', error);
              router.push('/units');
            }
          } else {
            router.push('/units');
          }
        } else {
          // 신규 생성인 경우
          if (result.unitId) {
            router.push(`/units`);
          }
        }
      } else {
        if (result.permissionDenied) {
          notification.error({
            message: "Permission Denied",
            description: result.message,
            duration: 5,
          });
        } else {
          notification.error({
            message: isEditMode ? "Update Failed" : "Save Failed",
            description: result.message,
            duration: 5,
          });
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      notification.error({
        message: "Error",
        description: "An unexpected error occurred. Please try again.",
        duration: 5,
      });
    } finally {
      setSaving(false);
    }
  };

  // TinyMCE 설정
  const mainEditorConfig = {
    apiKey: process.env.NEXT_PUBLIC_TINYMCE_KEY,
    height: 400,
    menubar: "file edit view insert format tools table help",
    plugins: [
      "advlist", "autolink", "lists", "link", "image", "charmap", "anchor",
      "searchreplace", "visualblocks", "code", "insertdatetime", "media",
      "table", "paste", "code", "help", "wordcount",
    ],
    toolbar:
      "undo redo | blocks fontsize | bold italic underline | " +
      "alignleft aligncenter alignright alignjustify | " +
      "bullist numlist outdent indent | link image media table | code",
    images_upload_handler: (blobInfo: any): Promise<string> => {
      return new Promise((resolve, reject) => {
        const uploadFormData = new FormData();
        uploadFormData.append("file", blobInfo.blob(), blobInfo.filename());

        fetch("/api/upload/editor", {
          method: "POST",
          body: uploadFormData,
        })
          .then((response) => response.json())
          .then((result) => {
            if (result.url) {
              resolve(result.url);
            } else {
              reject("Upload failed");
            }
          })
          .catch(() => reject("Upload failed"));
      });
    },
    automatic_uploads: true,
    file_picker_types: "image media",
    content_style: `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; }
      img { max-width: 100%; height: auto; }
      video { max-width: 100%; height: auto; }
      table { border-collapse: collapse; width: 100%; }
      table td, table th { border: 1px solid #ddd; padding: 8px; }
    `,
    branding: false,
  };

  // 렌더링
  return (
    <div>
      <Row gutter={24}>
        {/* Left - Input Form */}
        <Col span={14}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            
            {/* Sale Type Selection - 수정 모드에서는 비활성화 */}
            <Card title="Sale Type" size="small">
              <Space size="middle">
                {saleTypeOptions.map((option) => {
                  const isDisabled = option.value === "presale" && !hasPreSalePermission;
                  const isEditModeDisabled = isEditMode; // 수정 모드에서는 모든 옵션 비활성화
                  
                  return (
                    <Button
                      key={option.value}
                      type={unitFormData.saleType === option.value ? "primary" : "default"}
                      disabled={isDisabled || isEditModeDisabled}
                      onClick={() => handleChange("saleType", option.value)}
                      style={{ borderRadius: "6px", minWidth: "80px" }}
                      title={
                        isEditModeDisabled 
                          ? "Sale type cannot be changed in edit mode"
                          : isDisabled 
                          ? "You don't have permission to register pre-sale properties" 
                          : ""
                      }
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </Space>
              {isEditMode && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                  Sale type cannot be changed after creation.
                </div>
              )}
              {!hasPreSalePermission && !isEditMode && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                  Pre-sale registration requires special permissions.
                </div>
              )}
            </Card>

            {/* Basic Information */}
            <Card title="Basic Information" size="small">
              <Row gutter={16}>
                <Col span={isPreSale ? 24 : 12}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#666",
                  }}>
                    {isPreSale ? "Project Title *" : "Title *"}
                  </label>
                  <Input
                    value={unitFormData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder={isPreSale ? "e.g. The Observatory - Mandaluyong" : "Unit title"}
                  />
                </Col>
                {!isPreSale && (
                  <Col span={12}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Property Type
                    </label>
                    <Select
                      value={unitFormData.unitType}
                      onChange={(value) => handleChange("unitType", value)}
                      style={{ width: "100%" }}
                    >
                      {propertyTypeOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                )}
              </Row>

              <Row gutter={16} style={{ marginTop: "16px" }}>
                {!isPreSale && (
                  <Col span={8}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Owner Name
                    </label>
                    <Input
                      value={unitFormData.ownerName}
                      onChange={(e) => handleChange("ownerName", e.target.value)}
                      placeholder="Owner name"
                    />
                  </Col>
                )}
                
                <Col span={isPreSale ? 12 : 8}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#666",
                  }}>
                    Price *
                  </label>
                  <Input
                    value={unitFormData.price}
                    onChange={(e) => handlePriceChange("price", e.target.value)}
                    placeholder="Price"
                    style={{ textAlign: "right" }}
                  />
                </Col>
                
                <Col span={isPreSale ? 12 : 8}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#666",
                  }}>
                    {isPreSale ? "Area Range (m²)" : "Commission"}
                  </label>
                  <Input
                    value={isPreSale ? unitFormData.area : unitFormData.outstandingPayment}
                    onChange={(e) =>
                      isPreSale 
                        ? handleChange("area", e.target.value)
                        : handlePriceChange("outstandingPayment", e.target.value)
                    }
                    placeholder={isPreSale ? "e.g. 50-120" : "Commission"}
                    style={{ textAlign: isPreSale ? "left" : "right" }}
                  />
                </Col>
              </Row>

              {/* 프리세일 전용 - 방/욕실 정보 */}
              {isPreSale && (
                <Row gutter={16} style={{ marginTop: "16px" }}>
                  <Col span={12}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Bedroom Options
                    </label>
                    <Select
                      value={unitFormData.bed}
                      onChange={(value) => handleChange("bed", value)}
                      style={{ width: "100%" }}
                      placeholder="Select bedroom options"
                    >
                      {bedOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={12}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Bathroom Options
                    </label>
                    <Select
                      value={unitFormData.bath}
                      onChange={(value) => handleChange("bath", value)}
                      style={{ width: "100%" }}
                      placeholder="Select bathroom options"
                    >
                      {bathOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                </Row>
              )}
            </Card>

            {/* Location Information - 수정 모드에서 초기값 전달 */}
            <AdminAddressSearch 
              onChange={handleAddressChange} 
              initialData={isEditMode ? {
                fullAddress: initialData?.fullAdress,
                address1: initialData?.address1,
                address2: initialData?.address2,
                address3: initialData?.address3,
                addressSelf: initialData?.addressSelf,
                latitude: initialData?.latitude,
                longitude: initialData?.longitude,
              } : undefined}
            />

            {/* Property Details - 일반 매물만 */}
            {!isPreSale && (
              <Card title="Property Details" size="small">
                <Row gutter={16}>
                  <Col span={8}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Area (m²) *
                    </label>
                    <Input
                      value={unitFormData.area}
                      onChange={(e) => handleChange("area", e.target.value)}
                      placeholder="Area in square meters"
                      type="number"
                    />
                  </Col>
                  <Col span={8}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Floor
                    </label>
                    <Select
                      value={unitFormData.floor}
                      onChange={(value) => handleChange("floor", value)}
                      style={{ width: "100%" }}
                    >
                      {floorOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={8}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Year Completion
                    </label>
                    <Input
                      value={unitFormData.yearCompletion}
                      onChange={(e) => handleChange("yearCompletion", e.target.value)}
                      placeholder="Year of completion"
                    />
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: "16px" }}>
                  <Col span={6}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Bedrooms
                    </label>
                    <Select
                      value={unitFormData.bed}
                      onChange={(value) => handleChange("bed", value)}
                      style={{ width: "100%" }}
                    >
                      {bedOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Bathrooms
                    </label>
                    <Select
                      value={unitFormData.bath}
                      onChange={(value) => handleChange("bath", value)}
                      style={{ width: "100%" }}
                    >
                      {bathOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Parking
                    </label>
                    <Select
                      value={unitFormData.parking}
                      onChange={(value) => handleChange("parking", value)}
                      style={{ width: "100%" }}
                    >
                      {parkingOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Pet Policy
                    </label>
                    <Select
                      value={unitFormData.petPolicy}
                      onChange={(value) => handleChange("petPolicy", value)}
                      style={{ width: "100%" }}
                    >
                      {petPolicyOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: "16px" }}>
                  <Col span={12}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Furniture Status
                    </label>
                    <Select
                      value={unitFormData.furniture}
                      onChange={(value) => handleChange("furniture", value)}
                      style={{ width: "100%" }}
                    >
                      {furnitureOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={12}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                    }}>
                      Interior Condition
                    </label>
                    <Select
                      value={unitFormData.interiored}
                      onChange={(value) => handleChange("interiored", value)}
                      style={{ width: "100%" }}
                    >
                      {interioredOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Amenities - 일반 매물만 */}
            {!isPreSale && (
              <Card title="Amenities" size="small">
                <Row gutter={16}>
                  <Col span={18}>
                    <Input
                      placeholder="Type amenity and press Enter"
                      onPressEnter={(e) => {
                        const target = e.target as HTMLInputElement;
                        handleAmenityChange(target.value);
                        target.value = "";
                      }}
                    />
                  </Col>
                </Row>
                {unitFormData.amenity?.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    {unitFormData.amenity.map((amenity: any, index: number) => (
                      <span
                        key={index}
                        style={{
                          display: "inline-block",
                          background: "#f0f0f0",
                          padding: "4px 8px",
                          margin: "4px 4px 4px 0",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {amenity}
                        <button
                          onClick={() => removeAmenity(index)}
                          style={{
                            marginLeft: "8px",
                            background: "none",
                            border: "none",
                            color: "#ff4d4f",
                            cursor: "pointer",
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Main Image Section */}
            <Card title={isPreSale ? "Project Main Image" : "Main Image"} size="small">
              <Upload
                listType="picture-card"
                fileList={unitFormData.mainImage ? [{
                  uid: 'main-image',
                  name: 'main-image',
                  status: 'done' as const,
                  url: unitFormData.mainImage,
                  thumbUrl: unitFormData.mainImage,
                }] : []}
                beforeUpload={handleMainImageBeforeUpload}
                onRemove={() => {
                  handleChange("mainImage", "");
                  message.info("Main image removed");
                }}
                accept="image/*"
                maxCount={1}
                showUploadList={{
                  showPreviewIcon: true,
                  showRemoveIcon: true,
                }}
              >
                {!unitFormData.mainImage && (
                  <div>
                    <StarFilled style={{ color: '#faad14' }} />
                    <div style={{ marginTop: 8 }}>Main Image</div>
                  </div>
                )}
              </Upload>
              <div style={{ marginTop: 8, fontSize: "12px", color: "#666" }}>
                This will be used as the main thumbnail image.
              </div>
            </Card>

            {/* Additional Notes - 일반 매물만 */}
            {!isPreSale && (
              <Card title="Additional Notes" size="small">
                <TextArea
                  value={unitFormData.note}
                  onChange={(e) => handleChange("note", e.target.value)}
                  placeholder="Any additional notes about the property"
                  rows={3}
                />
              </Card>
            )}

            {/* Main Project Content - 프리세일만 */}
            {isPreSale && (
              <Card title="Main Project Content" size="small">
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_KEY}
                  onInit={(evt: any, editor: any) => {
                    mainEditorRef.current = editor;
                  }}
                  value={unitFormData.editorContent}
                  onEditorChange={(content: any) => handleChange("editorContent", content)}
                  init={mainEditorConfig}
                />
              </Card>
            )}

            {/* Dynamic Media Sections - 프리세일만 */}
            {isPreSale && (
              <>
                <Divider />
                
                {/* Image Carousels */}
                {Array.isArray(unitFormData.carouselItems) && unitFormData.carouselItems.length > 0 && unitFormData.carouselItems.map((carousel: any) => (
                  <MediaSection
                    key={carousel.id}
                    title={carousel.title}
                    description={carousel.description}
                    onTitleChange={(value) => updateCarousel(carousel.id, 'title', value)}
                    onDescriptionChange={(value) => updateCarousel(carousel.id, 'description', value)}
                    onRemove={() => removeCarousel(carousel.id)}
                  >
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#666",
                      }}>
                        Carousel Images
                      </label>
                      <Upload
                        listType="picture-card"
                        fileList={carousel.images?.map((url: string, index: number) => ({
                          uid: `${carousel.id}-${index}`,
                          name: `image-${index}`,
                          status: 'done' as const,
                          url: url,
                          thumbUrl: url,
                        })) || []}
                        onChange={(info) => handleCarouselImageUpload(info, carousel.id)}
                        multiple
                        beforeUpload={() => false}
                        accept="image/*"
                      >
                        {(carousel.images?.length || 0) >= 10 ? null : (
                          <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload</div>
                          </div>
                        )}
                      </Upload>
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                        {carousel.images?.length || 0} images uploaded
                      </div>
                    </div>
                  </MediaSection>
                ))}

                {/* Videos */}
                {Array.isArray(unitFormData.videoItems) && unitFormData.videoItems.length > 0 && unitFormData.videoItems.map((video: any) => (
                  <MediaSection
                    key={video.id}
                    title={video.title}
                    description={video.description}
                    onTitleChange={(value) => updateVideo(video.id, 'title', value)}
                    onDescriptionChange={(value) => updateVideo(video.id, 'description', value)}
                    onRemove={() => removeVideo(video.id)}
                  >
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#666",
                      }}>
                        Video File
                      </label>
                      {video.videoUrl ? (
                        <div style={{
                          padding: "12px",
                          border: "1px solid #d9d9d9",
                          borderRadius: "6px",
                          marginBottom: "8px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <VideoCameraOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
                              <div>
                                <div style={{ fontSize: "14px", fontWeight: "500" }}>
                                  Video Uploaded
                                </div>
                                <div style={{ fontSize: "12px", color: "#666" }}>
                                  {video.videoUrl}
                                </div>
                              </div>
                            </div>
                            <Space>
                              <Button size="small" href={video.videoUrl} target="_blank">
                                Preview
                              </Button>
                              <Button
                                size="small"
                                danger
                                onClick={() => updateVideo(video.id, 'videoUrl', '')}
                              >
                                Remove
                              </Button>
                            </Space>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="video/*"
                            style={{ display: "none" }}
                            id={`video-upload-${video.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleVideoUpload(file, video.id);
                              }
                            }}
                          />
                          <Button
                            icon={<VideoCameraOutlined />}
                            onClick={() => document.getElementById(`video-upload-${video.id}`)?.click()}
                            style={{ marginBottom: "8px" }}
                          >
                            Upload Video
                          </Button>
                        </div>
                      )}
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        Supported formats: MP4, MOV, AVI, WebM (Max: 100MB)
                      </div>
                    </div>
                  </MediaSection>
                ))}

                {/* Files */}
                {Array.isArray(unitFormData.fileItems) && unitFormData.fileItems.length > 0 && unitFormData.fileItems.map((file: any) => (
                  <MediaSection
                    key={file.id}
                    title={file.title}
                    description={file.description}
                    onTitleChange={(value) => updateFile(file.id, 'title', value)}
                    onDescriptionChange={(value) => updateFile(file.id, 'description', value)}
                    onRemove={() => removeFile(file.id)}
                  >
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#666",
                      }}>
                        File Upload
                      </label>
                      {file.fileUrl ? (
                        <div style={{
                          padding: "12px",
                          border: "1px solid #d9d9d9",
                          borderRadius: "6px",
                          marginBottom: "8px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <FileOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
                              <div>
                                <div style={{ fontSize: "14px", fontWeight: "500" }}>
                                  {file.fileName}
                                </div>
                                <div style={{ fontSize: "12px", color: "#666" }}>
                                  {file.mimeType} {file.size && `• ${(file.size / 1024 / 1024).toFixed(2)}MB`}
                                </div>
                              </div>
                            </div>
                            <Space>
                              <Button size="small" href={file.fileUrl} target="_blank">
                                Download
                              </Button>
                              <Button
                                size="small"
                                danger
                                onClick={() => updateFile(file.id, 'fileUrl', '')}
                              >
                                Remove
                              </Button>
                            </Space>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                            style={{ display: "none" }}
                            id={`file-upload-${file.id}`}
                            onChange={(e) => {
                              const uploadFile = e.target.files?.[0];
                              if (uploadFile) {
                                handleFileUpload(uploadFile, file.id);
                              }
                            }}
                          />
                          <Button
                            icon={<FileOutlined />}
                            onClick={() => document.getElementById(`file-upload-${file.id}`)?.click()}
                            style={{ marginBottom: "8px" }}
                          >
                            Upload File
                          </Button>
                        </div>
                      )}
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT (Max: 10MB)
                      </div>
                    </div>
                  </MediaSection>
                ))}

                {/* Add New Buttons */}
                <Card title="Add New Content" size="small">
                  <Space wrap>
                    <Button
                      type="dashed"
                      icon={<PictureOutlined />}
                      onClick={addNewCarousel}
                    >
                      Add Image Carousel
                    </Button>
                    <Button
                      type="dashed"
                      icon={<VideoCameraOutlined />}
                      onClick={addNewVideo}
                      disabled={unitFormData.videoItems?.length >= 1}
                    >
                      Add Video Section
                    </Button>
                    <Button
                      type="dashed"
                      icon={<FileOutlined />}
                      onClick={addNewFile}
                      disabled={unitFormData.fileItems?.length >= 1}
                    >
                      Add File Section
                    </Button>
                  </Space>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                    • Image carousels: Unlimited<br />
                    • Video section: 1 maximum<br />
                    • File section: 1 maximum
                  </div>
                </Card>
              </>
            )}

            {/* Settings */}
            <Card title="Settings" size="small">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Switch
                  checked={unitFormData.isPublished}
                  onChange={(checked) => handleChange("isPublished", checked)}
                />
                <span>{unitFormData.isPublished ? "Published" : "Draft"}</span>
              </div>
            </Card>

          </Space>
        </Col>

        {/* Right - Preview */}
        <Col span={10}>
          <Card
            title={isEditMode ? `Edit ${isPreSale ? 'Project' : 'Property'}` : "Preview"}
            size="small"
            extra={
              <Space>
                <Button icon={<EyeOutlined />} size="small">
                  View Live Page
                </Button>
                <Button
                  type="primary"
                  icon={saving ? <LoadingOutlined /> : <SaveOutlined />}
                  loading={saving}
                  onClick={handleSave}
                  disabled={!session}
                >
                  {isEditMode ? "Update" : "Save"}
                </Button>
              </Space>
            }
            style={{ position: "sticky", top: 24 }}
          >
            <div
              style={{
                height: "80vh",
                overflow: "auto",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                background: "#fff",
              }}
            >
              {/* 조건부 미리보기 렌더링 */}
              {isPreSale ? (
                <PreSaleUnitPreview formData={unitFormData} />
              ) : (
                <RegularUnitPreview formData={unitFormData} />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}