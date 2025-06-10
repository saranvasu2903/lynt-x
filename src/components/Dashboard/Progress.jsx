"use client";

import { useGetMetricsData } from "@/hooks/dashboard";
import LoadingSpinner from "../LoadingSpinner";
import { motion } from "framer-motion";

export default function Progress() {
  const { metrics, isLoading, isError } = useGetMetricsData();

  if (isLoading) return <LoadingSpinner />;
  if (isError || !metrics)
    return (
      <div className="text-center text-red-500">
        Failed to load progress data.
      </div>
    );

  const { finishedbatchcount, pendingbatchescount, totalbatch } = metrics;

  const completed = finishedbatchcount ?? 0;
  const pending = pendingbatchescount ?? 0;
  const inProgress = totalbatch - (completed + pending);

  const completedPercentage = totalbatch ? Number(((completed / totalbatch) * 100).toFixed(2)) : 0;
  const inProgressPercentage = totalbatch ? Number(((inProgress / totalbatch) * 100).toFixed(2)) : 0;
  const pendingPercentage = totalbatch ? Number(((pending / totalbatch) * 100).toFixed(2)) : 0;

  const cx = 100;
  const cy = 100;
  const r = 90;
  const strokeWidth = 20;

  const totalAngle = 180;
  const completedAngle = (completedPercentage / 100) * totalAngle;
  const inProgressAngle = (inProgressPercentage / 100) * totalAngle;
  const pendingAngle = (pendingPercentage / 100) * totalAngle;

  const getArcPath = (startAngle, endAngle) => {
    const startRad = ((180 + startAngle) * Math.PI) / 180;
    const endRad = ((180 + endAngle) * Math.PI) / 180;
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    return `M ${x1}, ${y1} A ${r}, ${r}, 0, ${largeArc}, 1, ${x2}, ${y2}`;
  };

  const completedStart = 0;
  const completedEnd = completedStart + completedAngle;
  const inProgressStart = completedEnd;
  const inProgressEnd = inProgressStart + inProgressAngle;
  const pendingStart = inProgressEnd;
  const pendingEnd = inProgressEnd + pendingAngle;

  const pathVariants = {
    hidden: { strokeDashoffset: 283 },
    visible: { strokeDashoffset: 0, transition: { duration: 1, ease: "easeInOut" } },
  };

  return (
    <div className="w-full bg-[#f9f8f6] rounded-xl p-5 text-center max-w-md mx-auto">
      <div className="text-lg font-semibold text-black mb-4">Batches Progress</div>

      <div className="bg-white rounded-xl relative w-80 h-50 mx-auto pt-4">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {completedPercentage > 0 && (
            <motion.path
              d={getArcPath(completedStart, completedEnd)}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="283"
              variants={pathVariants}
              initial="hidden"
              animate="visible"
            />
          )}

          {inProgressPercentage > 0 && (
            <motion.path
              d={getArcPath(inProgressStart, inProgressEnd)}
              fill="none"
              stroke="#facc15"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="283"
              variants={pathVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 1, ease: "easeInOut", delay: 0.5 }}
            />
          )}

          {pendingPercentage > 0 && (
            <motion.path
              d={getArcPath(pendingStart, pendingEnd)}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="283"
              variants={pathVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 1, ease: "easeInOut", delay: 1 }}
            />
          )}
        </svg>

        <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-3xl font-bold text-gray-900">
            {Math.round(completedPercentage)}%
          </div>
          <div className="text-sm text-gray-500">Batches Completed</div>
        </div>
      </div>

      <div className="flex justify-around text-sm text-gray-700 mt-6">
        <motion.div
          className="flex items-center gap-2 relative"
          whileHover={{ scale: 1.05 }}
        >
          <span className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
          Completed
          <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm -top-10 left-1/2 -translate-x-1/2">
            {completedPercentage}% Completed
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        </motion.div>
        <motion.div
          className="flex items-center gap-2 relative"
          whileHover={{ scale: 1.05 }}
        >
          <span className="w-3 h-3 rounded-full bg-[#facc15]" />
          In Progress
          <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm -top-10 left-1/2 -translate-x-1/2">
            {inProgressPercentage}% In Progress
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        </motion.div>
        <motion.div
          className="flex items-center gap-2 relative"
          whileHover={{ scale: 1.05 }}
        >
          <span className="w-3 h-3 rounded-full bg-[#e5e7eb] border" />
          Pending
          <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm -top-10 left-1/2 -translate-x-1/2">
            {pendingPercentage}% Pending
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .group:hover .group-hover\\:visible {
          visibility: visible;
        }
        .group:hover .group-hover\\:opacity-100 {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}