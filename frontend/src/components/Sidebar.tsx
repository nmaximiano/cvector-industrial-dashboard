import { useMemo, useState, useEffect } from "react";
import { Input, Tree, Layout, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { Facility, Asset } from "../api/client";

interface SidebarProps {
  facilities: Facility[];
  allAssets: Asset[];
  selectedFacility: number | undefined;
  selectedAsset: number | undefined;
  onFacilityChange: (id: number | undefined) => void;
  onAssetChange: (id: number | undefined) => void;
}

export default function Sidebar({
  facilities,
  allAssets,
  selectedFacility,
  selectedAsset,
  onFacilityChange,
  onAssetChange,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const query = search.toLowerCase();

  const allFacilityKeys = useMemo(() => facilities.map((f) => `facility-${f.id}`), [facilities]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(allFacilityKeys);

  // expand all when facilities first load
  useEffect(() => {
    setExpandedKeys(allFacilityKeys);
  }, [allFacilityKeys]);

  const treeData = useMemo(() => {
    return facilities
      .filter((f) => {
        if (!query) return true;
        const assets = allAssets.filter((a) => a.facility_id === f.id);
        return (
          f.name.toLowerCase().includes(query) ||
          f.location.toLowerCase().includes(query) ||
          assets.some((a) => a.name.toLowerCase().includes(query))
        );
      })
      .map((f) => {
        const assets = allAssets.filter((a) => a.facility_id === f.id);
        const filteredAssets = query
          ? assets.filter((a) => a.name.toLowerCase().includes(query) || f.name.toLowerCase().includes(query))
          : assets;

        return {
          title: (
            <div>
              <div style={{ fontWeight: 500 }}>{f.name}</div>
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>{f.location}</div>
            </div>
          ),
          key: `facility-${f.id}`,
          children: filteredAssets.map((a) => ({
            title: a.name,
            key: `asset-${a.id}`,
          })),
        };
      });
  }, [facilities, allAssets, query]);

  // expand all when searching
  useEffect(() => {
    if (query) setExpandedKeys(treeData.map((n) => n.key));
  }, [query, treeData]);

  const selectedKeys: string[] = [];
  if (selectedFacility) selectedKeys.push(`facility-${selectedFacility}`);
  if (selectedAsset) selectedKeys.push(`asset-${selectedAsset}`);

  function onSelect(_keys: React.Key[], info: { node: { key: React.Key } }) {
    const key = String(info.node.key);

    if (key.startsWith("asset-")) {
      const id = Number(key.replace("asset-", ""));
      const asset = allAssets.find((a) => a.id === id);
      if (asset) {
        onFacilityChange(asset.facility_id);
        onAssetChange(id);
      }
    } else if (key.startsWith("facility-")) {
      const id = Number(key.replace("facility-", ""));
      onFacilityChange(id);
      onAssetChange(undefined);
    }
  }

  const allExpanded = expandedKeys.length >= allFacilityKeys.length;

  return (
    <Layout.Sider
      width={320}
      theme="light"
      style={{
        borderRight: "1px solid #e8e8e8",
        height: "calc(100vh - 56px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "16px 16px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: "#595959", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Assets
          </span>
          <Button
            size="small"
            onClick={() => setExpandedKeys(allExpanded ? [] : allFacilityKeys)}
            style={{ fontSize: 12 }}
          >
            {allExpanded ? "Collapse All" : "Expand All"}
          </Button>
        </div>
        <Input
          placeholder="Search facilities or assets..."
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        <Tree
          treeData={treeData}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          selectedKeys={selectedKeys}
          onSelect={onSelect}
          multiple
          blockNode
        />
      </div>
    </Layout.Sider>
  );
}
