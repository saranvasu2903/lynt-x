import React, { useMemo, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import ExpandTable from "@/components/ExpandTable";
import { Drawer, DrawerTrigger, DrawerContent, DrawerClose, DrawerTitle } from "@/components/ui/drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import LoadingSpinner from "../LoadingSpinner";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

export default function BatchTable({ data }) {
  const [isConverting, setIsConverting] = useState(false);
  const [convertedImages, setConvertedImages] = useState([]);

  const batchColumns = useMemo(
    () => [
      { header: "Batch Name", accessor: "batchname" },
      { header: "Total Images", accessor: "totalImages" },
      { header: "Pending Images", accessor: "pendingImagesCount" },
      { header: "Submitted Images", accessor: "submittedImagesCount" },
    ],
    []
  );

  const convertPdfToImage = async (pdfUrl) => {
    try {
      setIsConverting(true);
      setConvertedImages([]);

      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      const numPages = pdf.numPages;
      const images = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const imageData = canvas.toDataURL("image/png");
        images.push({ page: pageNum, data: imageData });
      }

      setConvertedImages(images);
    } catch (error) {
      console.error("Error converting PDF to images:", error);
      setConvertedImages([]);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <ExpandTable
      columns={batchColumns}
      data={data}
      enableSorting={true}
      enableFiltering={false}
      enablePagination={true}
      rowsPerPage={5}
      renderRow={(item) => (
        <>
          <td className="py-2 px-4 max-w-xs truncate">{item.batchname}</td>
          <td className="py-2 px-4">{item.totalImages}</td>
          <td className="py-2 px-4">{item.submittedImagesCount}</td>
          <td className="py-2 px-4">{item.pendingImagesCount}</td>
        </>
      )}
      renderExpandedRow={(item) => (
        <div className="py-4 bg-white border border-gray-300 rounded-b-lg">
          {item.imagecollection && item.imagecollection.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full w-auto text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-2 px-4 max-w-xs">Filename</th>
                    <th className="pb-2 px-4">Image</th>
                    <th className="pb-2 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {item.imagecollection.map((image, idx) => (
                    <tr key={idx} className="">
                      <td className="py-2 px-4 max-w-xs truncate">
                        {image.filename}
                      </td>
                      <td className="py-2 px-4">
                        <Drawer direction="right">
                          <DrawerTrigger asChild>
                            <button
                              className="flex items-center cursor-pointer gap-2 bg-blue-500 text-white px-3 py-1 rounded-xl hover:bg-blue-600 transition-colors"
                              onClick={() => convertPdfToImage(image.image)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 576 512"
                                className="w-4 h-4"
                                fill="currentcolor"
                              >
                                <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z" />
                              </svg>
                              <span>View Image</span>
                            </button>
                          </DrawerTrigger>
                          <DrawerContent className="custom-drawer-content bg-white rounded-l-xl shadow-xl p-6 overflow-y-auto max-w-[80vw] md:max-w-[50vw]">
                            <VisuallyHidden>
                              <DrawerTitle>Image Preview</DrawerTitle>
                            </VisuallyHidden>
                            <DrawerClose className="absolute top-4 right-4">
                              <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
                            </DrawerClose>
                            {isConverting ? (
                              <LoadingSpinner/>
                            ) : convertedImages.length > 0 ? (
                              <div className="space-y-4">
                                {convertedImages.map((img, index) => (
                                  <div key={index} className="text-center">
                                    <p className="text-sm text-gray-600 mb-2">Page {img.page}</p>
                                    <img
                                      src={img.data}
                                      alt={`${image.filename} - Page ${img.page}`}
                                      className="max-w-full h-auto mx-auto"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-600">
                                No images available.
                              </p>
                            )}
                          </DrawerContent>
                        </Drawer>
                      </td>
                      <td className="py-2 px-4 capitalize">
                        <span
                          className={`rounded-md px-2 py-0.5 leading-[1.2] text-[0.7rem] ${
                            image.status === "pending"
                              ? "bg-blue-100 text-yellow-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {image.status === "pending" ? "Pending" : "Completed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No Data's Found</p>
          )}
        </div>
      )}
      className="w-full"
    />
  );
}