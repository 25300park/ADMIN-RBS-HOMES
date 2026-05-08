import { Form, Input, Select, InputNumber, Switch, Upload, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import AdminAddressSearch from '@/components/address-search';
import { createBanner } from '@/actions/banners-action';

const { Option } = Select;

interface BannerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BannerForm: React.FC<BannerFormProps> = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [addressData, setAddressData] = useState({
    address1: "",
    address2: "",
    address3: "",
    latitude: 0,
    longitude: 0,
    fullAddress: ""
  });

  // 주소 또는 matchType이 변경될 때 matchValue 자동 업데이트
  useEffect(() => {
    updateMatchValue();
  }, [addressData, form.getFieldValue('matchType')]);

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

  // 주소에 따라 matchValue 자동으로 업데이트
  const updateMatchValue = () => {
    const matchType = form.getFieldValue('matchType');
    let matchValue = "";
    
    if (matchType === "city" && addressData.address2) {
      // 도시 이름 추출 (예: "Taguig, Metro Manila"에서 "Taguig" 추출)
      matchValue = addressData.address2.split(',')[0]?.trim() || "";
    } else if (matchType === "exact_address" && addressData.address3) {
      // 전체 주소 사용
      matchValue = addressData.address3;
    }
    
    // 값이 있을 때만 폼 필드 업데이트
    if (matchValue) {
      form.setFieldsValue({ matchValue });
      console.log("주소 업데이트:", { 
        matchType, 
        matchValue, 
        address2: addressData.address2,
        address3: addressData.address3
      });
    }
  };

  // 주소 변경 핸들러
  const handleAddressChange = (data: any) => {
    setAddressData(data);
    // updateMatchValue는 useEffect에서 자동으로 호출됨
  };

  // matchType 변경 시 자동으로 matchValue 업데이트
  const handleMatchTypeChange = (value: string) => {
    form.setFieldsValue({ matchType: value });
    // updateMatchValue는 useEffect에서 자동으로 호출됨
  };

  // 배너 생성 제출 처리
  const handleSubmit = async (values: any) => {
    // 이미지가 없으면 경고
    if (fileList.length === 0) {
      message.warning('Please upload at least one image');
      return;
    }
    
    // 로그로 제출 데이터 확인
    console.log("제출 데이터:", { 
      formValues: values,
      addressData
    });
    
    setUploading(true);
    
    try {
      // 1. 이미지 업로드
      const formData = new FormData();
      fileList.forEach((file) => {
        formData.append('files', file as any);
      });
      
      const uploadResponse = await fetch('/api/banner/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload images');
      }
      
      const uploadResult = await uploadResponse.json();
      
      // 2. 이미지 URL로 배너 데이터 생성
      const imagesData = uploadResult.uploadedUrls.map((url: string, index: number) => ({
        url,
        order: index + 1
      }));
      
      // 3. 배너 생성 액션 호출
      const result = await createBanner({
        matchType: values.matchType,
        matchValue: values.matchValue,
        priority: values.priority,
        title: values.title || null,
        description: values.description || null,
        images: JSON.stringify(imagesData),
        isActive: values.isActive,
        // 추가 주소 정보도 함께 저장
        latitude: addressData.latitude || 0,
        longitude: addressData.longitude || 0,
        fullAddress: addressData.fullAddress || ''
      });
      
      if (result.success) {
        message.success('Banner created successfully');
        
        // 성공 콜백 호출
        onSuccess();
      } else {
        message.error('Failed to create banner');
      }
    } catch (error) {
      console.error('Error creating banner:', error);
      message.error('An error occurred while creating the banner');
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
        matchType: 'city',
        priority: 10,
        isActive: true
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          name="matchType"
          label="Banner Type"
          rules={[{ required: true, message: 'Please select banner type' }]}
        >
          <Select onChange={handleMatchTypeChange}>
            <Option value="city">City Banner</Option>
            <Option value="exact_address">Specific Location Banner</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="priority"
          label="Priority (lower number = higher priority)"
          rules={[{ required: true, message: 'Please enter priority' }]}
        >
          <InputNumber min={1} className="w-full" />
        </Form.Item>
      </div>
      
      {/* 주소 검색 */}
      <Form.Item label="Location Selection" required>
        <AdminAddressSearch
          onChange={handleAddressChange}
          placeholder="Search address (Philippines only)"
        />
        
        <Form.Item
          name="matchValue"
          label="Selected Location Value"
          className="mt-4"
          rules={[{ required: true, message: 'Please set a location value' }]}
        >
          <Input 
            placeholder={form.getFieldValue('matchType') === 'city' ? 'City name' : 'Specific address'}
          />
        </Form.Item>
      </Form.Item>
      
      {/* 배너 정보 */}
      <div className="grid grid-cols-2 gap-4">
        <Form.Item name="title" label="Banner Title">
          <Input placeholder="Enter banner title (optional)" />
        </Form.Item>
        
        <Form.Item name="isActive" label="Active Status" valuePropName="checked">
          <Switch />
        </Form.Item>
      </div>
      
      <Form.Item name="description" label="Description">
        <Input.TextArea rows={4} placeholder="Enter banner description (optional)" />
      </Form.Item>
      
      {/* 이미지 업로드 */}
      <Form.Item label="Banner Images" required>
        <Upload {...uploadProps}>
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
          </div>
        </Upload>
        <div className="mt-2 text-gray-500 text-sm">
          Please upload banner images (max 5MB each)
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
          disabled={fileList.length === 0}
        >
          {uploading ? 'Creating...' : 'Create Banner'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default BannerForm;