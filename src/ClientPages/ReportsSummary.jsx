"use client";

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Download, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MetricCard from "@/components/MetricCard";
import { useGetReportsSummary } from "@/hooks/reports-summary";
import { useBatches } from "@/hooks/dashboard";
import BatchTable from "@/components/ReportsSummary/BatchTable";
import BatchStatistics from "@/components/ReportsSummary/BatchStatistics";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ReportsSummary() {
  const [batchFilter, setBatchFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: batches, isLoading: batchesLoading } = useBatches();
  const { summary, isLoading } = useGetReportsSummary();

  if (isLoading || batchesLoading) {
    <LoadingSpinner />;
  }

  const data = useMemo(() => {
    if (!summary || !Array.isArray(summary.completedBatches)) return [];
    return summary.completedBatches;
  }, [summary]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const batchMatch =
        batchFilter === "all" || item.batchname === batchFilter;
      const searchMatch =
        searchQuery === "" ||
        item.batchname.toLowerCase().includes(searchQuery.toLowerCase());
      return batchMatch && searchMatch;
    });
  }, [batchFilter, searchQuery, data]);

  const batchOptions = useMemo(
    () =>
      batches ? [...new Set(batches.map((batch) => batch.batchname))] : [],
    [batches]
  );

  const handleExport = () => {
    const exportData = filteredData.flatMap((batch) => [
      {
        "Batch Name": batch.batchname,
        "Total Images": batch.totalImages,
        "Submitted Images": batch.submittedImagesCount,
        "Pending Images": batch.pendingImagesCount,
      },
      ...batch.imagecollection.map((image) => ({
        "Batch Name": "",
        Filename: image.filename,
        Status: image.status === "pending" ? "Pending" : "Completed",
      })),
    ]);
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "reports_summary.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports Summary</h1>
        <p className="text-gray-600 mt-1">
          View and manage detailed reports of batches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Batches"
          value={data.length}
          change={0}
          changeType="neutral"
          onViewClick={() => {}}
        />
        <MetricCard
          title="Total Images"
          value={data.reduce((sum, batch) => sum + batch.totalImages, 0)}
          change={0}
          changeType="neutral"
          onViewClick={() => {}}
        />
        <MetricCard
          title="Submitted Images"
          value={data.reduce(
            (sum, batch) => sum + batch.submittedImagesCount,
            0
          )}
          change={0}
          changeType="neutral"
          onViewClick={() => {}}
        />
      </div>

      <BatchStatistics data={data} />

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search batches..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700">
                Batch:
              </Label>
              <Select value={batchFilter} onValueChange={setBatchFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batchOptions.map((batchName) => (
                    <SelectItem key={batchName} value={batchName}>
                      {batchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleExport} className="ml-auto">
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
      <BatchTable data={filteredData} />
    </div>
  );
}
