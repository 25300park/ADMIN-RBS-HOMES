// components/admin/popups/PopupForm.tsx
import { Form, Input, Select, InputNumber, Switch, Upload, Button, message, DatePicker, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { createPopup, updatePopup } from '@/actions/popup-action';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface PopupFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editData?: any; // 수정할 데이터
  isEdit?: boolean; // 수정 모드 여부
}

const PopupForm: React.FC<PopupFormProps> = ({ onSuccess, onCancel, editData, isEdit = false }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // 수정 모드일 때 초기 데이터 설정
  useEffect(() => {
    if (isEdit && editData) {
      // 기존 이미지 처리
      if (editData.images) {
        const existingImages = parseImages(editData.images);
        const imageFileList = existingImages.map((url, index) => ({
          uid: `existing-${index}`,
          name: `image-${index}`,
          status: 'done' as const,
          url: url,
        }));
        setFileList(imageFileList);
      }

      // 날짜 범위 처리
      let dateRange = null;
      if (editData.startDate || editData.endDate) {
        dateRange = [
          editData.startDate ? dayjs(editData.startDate) : null,
          editData.endDate ? dayjs(editData.endDate) : null,
        ];
      }

      // 폼 초기값 설정
      form.setFieldsValue({
        title: editData.title,
        content: editData.content,
        priority: editData.priority,
        popupType: editData.popupType,
        triggerType: editData.triggerType,
        triggerValue: editData.triggerValue,
        targetAudience: editData.targetAudience,
        showFrequency: editData.showFrequency,
        buttonText: editData.buttonText,
        buttonAction: editData.buttonAction,
        useOverlay: editData.useOverlay,
        isActive: editData.isActive,
        dateRange: dateRange,
      });
    }
  }, [isEdit, editData, form]);

  // 이미지 파싱 함수
  const parseImages = (imagesJson: string): string[] => {
    try {
      const images = JSON.parse(imagesJson);
      return Array.isArray(images) ? images.map(img => img.url || img) : [];
    } catch (e) {
      return [];
    }
  };

  // 업로드 속성 설정
  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      // 이미지 타입 검증
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error(`${file.name} is not an image file`);
        return Upload.LIST_IGNORE;
      }
      
      // 파일 크기 제한 (5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return Upload.LIST_IGNORE;
      }
      
      setFileList([...fileList, file]);
      return false; // 자동 업로드 방지
    },
    fileList,
    listType: "picture-card",
  };

  // 팝업 타입별 트리거 옵션
  const getTriggerOptions = (popupType: number) => {
    const allTriggers = [
      { value: 0, label: 'Page Load', desc: 'Show immediately when page loads' },
      // { value: 1, label: 'Time Delay', desc: 'Show after specified seconds' },
      // { value: 2, label: 'Scroll', desc: 'Show when user scrolls to %' },
      // { value: 3, label: 'Exit Intent', desc: 'Show when user tries to leave' },
    ];

    // 팝업 타입에 따라 적절한 트리거만 반환
    switch (popupType) {
      case 1: // Banner
        return allTriggers.filter(t => [0, 1, 2].includes(t.value));
      case 2: // Notification
        return allTriggers.filter(t => [0, 1, 3].includes(t.value));
      default:
        return allTriggers;
    }
  };

  // 트리거 값 입력 플레이스홀더
  const getTriggerPlaceholder = (triggerType: number) => {
    switch (triggerType) {
      case 1: return 'Enter delay in seconds (e.g., 5)';
      case 2: return 'Enter scroll percentage (e.g., 50)';
      default: return 'Enter trigger value (optional)';
    }
  };

  // 팝업 생성/수정 제출 처리
  const handleSubmit = async (values: any) => {
    if (fileList.length === 0 && !isEdit) {
      const confirm = await new Promise((resolve) => {
        message.warning({
          content: 'No images uploaded. Continue without images?',
          duration: 0,
          onClose: () => resolve(false),
        });
        setTimeout(() => resolve(true), 3000);
      });
      if (!confirm) return;
    }
    
    console.log("제출 데이터:", values);
    
    setUploading(true);
    
    try {
      let imagesData = null;
      
      // 새로운 이미지가 있으면 업로드
      const newFiles = fileList.filter(file => !file.url); // url이 없는 것은 새 파일
      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach((file) => {
          formData.append('files', file as any);
        });
        
        const uploadResponse = await fetch('/api/popup/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload images');
        }
        
        const uploadResult = await uploadResponse.json();
        
        // 기존 이미지와 새 이미지 합치기
        const existingImages = fileList.filter(file => file.url).map(file => ({ url: file.url }));
        const newImages = uploadResult.uploadedUrls.map((url: string) => ({ url }));
        imagesData = [...existingImages, ...newImages];
      } else if (fileList.length > 0) {
        // 기존 이미지만 있는 경우
        imagesData = fileList.map(file => ({ url: file.url }));
      }
      
      // 날짜 범위 처리
      const dateRange = values.dateRange;
      const startDate = dateRange && dateRange[0] ? dateRange[0].toDate() : null;
      const endDate = dateRange && dateRange[1] ? dateRange[1].toDate() : null;
      
      // 팝업 생성/수정 액션 호출
      const result = isEdit 
        ? await updatePopup(editData.id, {
            title: values.title,
            content: values.content || null,
            startDate,
            endDate,
            useOverlay: values.useOverlay,
            isActive: values.isActive,
            priority: values.priority,
            targetAudience: values.targetAudience,
            buttonText: values.buttonText || null,
            buttonAction: values.buttonAction || null,
            images: JSON.stringify(imagesData),
            popupType: values.popupType,
            triggerType: values.triggerType,
            triggerValue: values.triggerValue || null,
            showFrequency: values.showFrequency,
          })
        : await createPopup({
            title: values.title,
            content: values.content || null,
            startDate,
            endDate,
            createdByUserId: 1, // TODO: 실제 로그인된 사용자 ID 사용
            useOverlay: values.useOverlay,
            isActive: values.isActive,
            priority: values.priority,
            targetAudience: values.targetAudience,
            buttonText: values.buttonText || null,
            buttonAction: values.buttonAction || null,
            images:JSON.stringify(imagesData),
            popupType: values.popupType,
            triggerType: values.triggerType,
            triggerValue: values.triggerValue || null,
            showFrequency: values.showFrequency,
          });
      
      if (result.success) {
        message.success(`Popup ${isEdit ? 'updated' : 'created'} successfully`);
        onSuccess();
      } else {
        message.error(`Failed to ${isEdit ? 'update' : 'create'} popup`);
      }
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} popup:`, error);
      message.error(`An error occurred while ${isEdit ? 'updating' : 'creating'} the popup`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        popupType: 0,
        triggerType: 0,
        priority: 10,
        isActive: true,
        useOverlay: true,
        targetAudience: 'all',
        showFrequency: 0,
      }}
    >
      {/* 기본 정보 */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="title"
            label="Popup Title"
            rules={[{ required: true, message: 'Please enter popup title' }]}
          >
            <Input placeholder="Enter popup title" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="priority"
            label="Priority (lower number = higher priority)"
            rules={[{ required: true, message: 'Please enter priority' }]}
          >
            <InputNumber min={1} max={100} className="w-full" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="content" label="Popup Content">
        <TextArea rows={4} placeholder="Enter popup content (optional)" />
      </Form.Item>

      {/* 팝업 타입 및 트리거 설정 */}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="popupType"
            label="Popup Type"
            rules={[{ required: true, message: 'Please select popup type' }]}
          >
            <Select>
              <Option value={0}>Modal</Option>
              {/* <Option value={1}>Banner</Option>
              <Option value={2}>Notification</Option>
              <Option value={3}>Fullscreen</Option> */}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="triggerType"
            label="Trigger Type"
            rules={[{ required: true, message: 'Please select trigger type' }]}
          >
            <Select>
              {getTriggerOptions(form.getFieldValue('popupType') || 0).map(trigger => (
                <Option key={trigger.value} value={trigger.value}>
                  {trigger.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="triggerValue" label="Trigger Value">
            <Input placeholder={getTriggerPlaceholder(form.getFieldValue('triggerType') || 0)} />
          </Form.Item>
        </Col>
      </Row>

      {/* 타겟 및 표시 설정 */}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="targetAudience" label="Target Audience">
            <Select>
              <Option value="all">All Users</Option>
              {/* <Option value="new_users">New Users</Option>
              <Option value="returning_users">Returning Users</Option>
              <Option value="mobile_users">Mobile Users</Option>
              <Option value="desktop_users">Desktop Users</Option> */}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="showFrequency" label="Show Frequency">
            <Select>
              <Option value={0}>Always</Option>
              {/* <Option value={1}>Once per user</Option>
              <Option value={2}>Once per day</Option> */}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="dateRange" label="Active Period">
            <RangePicker 
              showTime 
              className="w-full"
              placeholder={['Start Date', 'End Date']}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* 버튼 설정 */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="buttonText" label="Button Text">
            <Input placeholder="Enter button text (optional)" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="buttonAction" label="Button Action">
            <Input placeholder="Enter URL or action (optional)" />
          </Form.Item>
        </Col>
      </Row>

      {/* 스위치 옵션들 */}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="useOverlay" label="Use Overlay" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="isActive" label="Active Status" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      {/* 이미지 업로드 */}
      <Form.Item label="Popup Images">
        <Upload {...uploadProps}>
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
          </div>
        </Upload>
        <div className="mt-2 text-gray-500 text-sm">
          Upload popup images (max 5MB each, optional)
        </div>
      </Form.Item>

      {/* 폼 제출 버튼 */}
      <Form.Item className="text-right">
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Cancel
        </Button>
        <Button 
          type="primary" 
          htmlType="submit"
          loading={uploading}
        >
          {uploading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Popup' : 'Create Popup')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default PopupForm;