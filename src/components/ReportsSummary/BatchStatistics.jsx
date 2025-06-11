import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function BatchStatistics({ data }) {
  const chartData = useMemo(() => {
    const batchStats = {};
    data.forEach((item) => {
      if (!batchStats[item.batchname]) {
        batchStats[item.batchname] = {
          name: item.batchname,
          totalImages: 0,
          submittedImages: 0,
          pendingImages: 0,
        };
      }
      batchStats[item.batchname].totalImages += item.totalImages;
      batchStats[item.batchname].submittedImages += item.submittedImagesCount;
      batchStats[item.batchname].pendingImages += item.pendingImagesCount;
    });
    return Object.values(batchStats);
  }, [data]);

  return (
    <div className="grid grid-cols-1">
      <Card>
        <CardHeader>
          <CardTitle>Batch Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div
                          className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm text-gray-600 text-sm"
                          style={{ backgroundColor: "#ffffff" }}
                        >
                          <p>
                            <strong className="text-gray-700">Batch:</strong>{" "}
                            {data.name}
                          </p>
                          <p>
                            <strong className="text-gray-700">
                              Total Images:
                            </strong>{" "}
                            {data.totalImages}
                          </p>
                          <p>
                            <strong className="text-gray-700">
                              Submitted Images:
                            </strong>{" "}
                            {data.submittedImages}
                          </p>
                          <p>
                            <strong className="text-gray-700">
                              Pending Images:
                            </strong>{" "}
                            {data.pendingImages}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="totalImages" fill="#8884d8" name="Total Images" />
                <Bar
                  dataKey="submittedImages"
                  fill="#82ca9d"
                  name="Submitted Images"
                />
                <Bar
                  dataKey="pendingImages"
                  fill="#ffc658"
                  name="Pending Images"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
