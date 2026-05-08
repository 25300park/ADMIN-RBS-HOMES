// components/admin/AdminAddressSearch.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Input, Space, Card } from "antd";
import { SearchOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { loadGoogleMapsAPI } from "@/lib/google";

interface AdminAddressSearchProps {
  onChange: (addressData: {
    address1?: string;
    address2?: string;
    address3?: string;
    latitude?: number;
    longitude?: number;
    fullAddress?: string;
  }) => void;
  placeholder?: string;
  initialData?: {
    fullAddress?: string;
    address1?: string | number;
    address2?: string;
    address3?: string;
    addressSelf?: string;
    latitude?: number;
    longitude?: number;
  };
}

const AdminAddressSearch: React.FC<AdminAddressSearchProps> = ({
  onChange,
  placeholder = "Search address (Philippines only)",
  initialData,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [staticMapUrl, setStaticMapUrl] = useState("");
  const [addressData, setAddressData] = useState({
    address1: "",
    address2: "",
    address3: "",
    latitude: 0,
    longitude: 0,
    fullAddress: "",
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const inputRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  // onChange를 useCallback으로 memoize
  const memoizedOnChange = useCallback(onChange, [onChange]);

  // initialData가 있으면 초기화 (한 번만 실행)
  useEffect(() => {
    if (initialData && !isInitialized) {
      const newAddressData = {
        address1: initialData.address1?.toString() || "",
        address2: initialData.address2 || "",
        address3: initialData.address3 || "",
        latitude: initialData.latitude || 0,
        longitude: initialData.longitude || 0,
        fullAddress: initialData.fullAddress || "",
      };

      setAddressData(newAddressData);
      setSearchTerm(initialData.fullAddress || "");

      // 좌표가 있으면 Static Map 생성
      if (initialData.latitude && initialData.longitude) {
        const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${initialData.latitude},${initialData.longitude}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7Clabel:A%7C${initialData.latitude},${initialData.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_KEY}`;
        setStaticMapUrl(staticMapUrl);
      }

      // 부모 컴포넌트에 초기 데이터 전달
      memoizedOnChange(newAddressData);
      setIsInitialized(true);
    }
  }, [initialData, isInitialized, memoizedOnChange]);

  // Static Map 업데이트
  useEffect(() => {
    if (addressData.latitude && addressData.longitude) {
      const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${addressData.latitude},${addressData.longitude}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7Clabel:A%7C${addressData.latitude},${addressData.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_KEY}`;
      setStaticMapUrl(staticMapUrl);
    }
  }, [addressData.latitude, addressData.longitude]);

  // Google Autocomplete 초기화
  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        await loadGoogleMapsAPI();

        if (!inputRef.current?.input || autocompleteRef.current) return;
        
        const google = (window as any).google;
        const autocomplete = new google.maps.places.Autocomplete(
          inputRef.current.input,
          {
            componentRestrictions: { country: "PH" },
            language: "en",
          }
        );

        autocompleteRef.current = autocomplete;

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();

          if (!place.address_components || !place.geometry) {
            console.warn("No detailed address or location information available.");
            return;
          }

          // 주소 컴포넌트 추출
          const addressComponents = place.address_components.reduce(
            (acc: any, component: any) => {
              const types = component.types;

              if (types.includes("postal_code"))
                acc.postalCode = component.long_name;

              if (types.includes("locality") || types.includes("sublocality"))
                acc.city = component.long_name;

              if (types.includes("administrative_area_level_1"))
                acc.region = component.long_name;

              if (
                types.includes("route") ||
                types.includes("intersection") ||
                types.includes("premise") ||
                types.includes("street_number")
              ) {
                acc.streetAddress.push(component.long_name);
              }

              return acc;
            },
            {
              postalCode: "",
              city: "",
              region: "",
              streetAddress: [],
            }
          );

          const fullStreetAddress = addressComponents.streetAddress.join(", ");
          const formattedAddress = place.formatted_address || "";
          const latitude = place.geometry.location.lat();
          const longitude = place.geometry.location.lng();

          const newAddressData = {
            address1: addressComponents.postalCode || "",
            address2: `${addressComponents.city}, ${addressComponents.region}` || "",
            address3: fullStreetAddress || "",
            latitude,
            longitude,
            fullAddress: formattedAddress,
          };

          setAddressData(newAddressData);
          setSearchTerm(formattedAddress);
          memoizedOnChange(newAddressData);
        });
      } catch (error) {
        console.error("Failed to initialize Google Maps Autocomplete:", error);
      }
    };

    initializeAutocomplete();

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        try {
          const google = (window as any).google;
          if (google?.maps?.event) {
            google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
        } catch (error) {
          console.log("Autocomplete cleanup error:", error);
        }
        autocompleteRef.current = null;
      }
    };
  }, [memoizedOnChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const trimmedValue = e.target.value.replace(/\s+/g, " ");
    setSearchTerm(trimmedValue);
  };

  return (
    <Card title="Location Information" size="small">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <label style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "12px",
            fontWeight: "500",
            color: "#666",
          }}>
            <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
            Address Search *
          </label>
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={placeholder}
            prefix={<SearchOutlined />}
            style={{ width: '100%' }}
          />
        </div>

        {staticMapUrl && (
          <div className="rounded overflow-hidden">
            <img
              src={staticMapUrl}
              alt="Selected location"
              style={{ width: '100%', height: 200, objectFit: 'cover' }}
            />
          </div>
        )}

        {addressData.address2 && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">City and Region</div>
                <div className="font-medium">{addressData.address2}</div>
              </div>
              
              {addressData.address3 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Street Address</div>
                  <div className="font-medium">{addressData.address3}</div>
                </div>
              )}

              {addressData.address1 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Postal Code</div>
                  <div className="font-medium">{addressData.address1}</div>
                </div>
              )}
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default AdminAddressSearch;