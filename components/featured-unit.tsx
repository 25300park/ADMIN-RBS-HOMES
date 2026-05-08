"use client";

import {
  getAllUnits,
  setFeatured,
  removeFeatured,
} from "@/actions/featured-action";
import DataTable from "@/components/data-table";
import { useTableParams } from "@/hooks/use-table-params";
import Image from "next/image";
import { Button, Modal, Input, Checkbox, message } from "antd";
import { useEffect, useState } from "react";

const initialParams = {
  page: 1,
  limit: 10,
  sort: "id",
  order: "desc" as const,
  search: "",
};

export const FeaturedUnitList = ({
  initialData,
}: {
  initialData: { units: any[]; total: number };
}) => {
  const { params, updateParams } = useTableParams(initialParams);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [labelText, setLabelText] = useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getAllUnits(
        params.page,
        params.search,
        params.limit,
        showFeaturedOnly
      );
      setData(result);
      setLoading(false);
    };
    fetchData();
  }, [params.page, params.search, params.limit, showFeaturedOnly]);

  const handleFeaturedClick = (unit: any) => {
    if (unit.featuredUnit) {
      handleFeaturedToggle(unit);
    } else {
      setSelectedUnit(unit);
      setLabelText("");
      setIsModalVisible(true);
    }
  };

  const handleFeaturedToggle = async (unit: any) => {
    try {
      if (unit.featuredUnit) {
        await removeFeatured(unit.id);
        setData((prev) => ({
          ...prev,
          units: prev.units.map((u) =>
            u.id === unit.id ? { ...u, featuredUnit: null } : u
          ),
        }));
        message.success("Featured status has been removed");
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to remove featured status");
    }
  };

  const handleModalOk = async () => {
    if (!selectedUnit || !labelText.trim()) {
      message.error("Please enter a label");
      return;
    }
    try {
      await setFeatured(selectedUnit.id, labelText.trim());
      setData((prev) => ({
        ...prev,
        units: prev.units.map((u) =>
          u.id === selectedUnit.id
            ? { ...u, featuredUnit: { label: labelText.trim() } }
            : u
        ),
      }));
      setIsModalVisible(false);
      setSelectedUnit(null);
      message.success("Featured setting completed");
    } catch (error) {
      console.error(error);
      message.error("Failed to set featured status");
    }
  };

  const handleFeaturedOnlyChange = (checked: boolean) => {
    setShowFeaturedOnly(checked);
    updateParams({ ...params, page: 1 });
  };

  const columns = [
    {
      title: "Property Info",
      key: "info",
      render: (unit: any) => (
        <div className="flex items-center gap-4">
          <div className="w-24 h-20 relative flex-shrink-0">
            {unit.images && JSON.parse(unit.images)[0] ? (
              <Image
                src={JSON.parse(unit.images)[0]}
                alt={unit.title}
                fill
                priority
                sizes="(max-width: 768px) 100px, 200px"
                className="object-cover rounded"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium">{unit.title}</h3>
            <p className="text-sm text-gray-600">
              {unit.type} | {unit.area}py | {unit.price?.toLocaleString()}won
            </p>
            <p className="text-sm text-gray-600">
              {unit.address1} {unit.address2} {unit.address3}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Featured Status",
      key: "featured",
      width: 200,
      render: (unit: any) => (
        <div>
          <Button
            type={unit.featuredUnit ? "default" : "primary"}
            onClick={() => handleFeaturedClick(unit)}
          >
            {unit.featuredUnit ? "Remove Featured" : "Set Featured"}
          </Button>
          {unit.featuredUnit && (
            <div className="mt-2 text-sm text-gray-600">
              {unit.featuredUnit.label}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-4">
        <Checkbox
          checked={showFeaturedOnly}
          onChange={(e) => handleFeaturedOnlyChange(e.target.checked)}
        >
          Featured Units Only
        </Checkbox>
      </div>
      <DataTable
        columns={columns}
        params={params}
        onParamsChange={updateParams}
        searchPlaceholder="Search by property name"
        dataSource={data.units}
        total={data.total}
        loading={loading}
        className="w-full"
      />
      <Modal
        title="Enter Featured Label"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedUnit(null);
        }}
      >
        <Input
          placeholder="Enter label (e.g. Special Sale)"
          value={labelText}
          onChange={(e) => setLabelText(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default FeaturedUnitList;
