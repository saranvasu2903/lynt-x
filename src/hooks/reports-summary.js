import { get } from "@/utils/apiHelper"
import { useQuery } from "@tanstack/react-query"
import toast from "react-hot-toast"

export function useGetReportsSummary() {
  const {
    data: summary,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: () => get("/reportsummary"),
    onError: (error) => {
      console.error("Error fetching reports summary:", error)
      toast.error("Failed to fetch reports summary.")
    },
  })

  return {
    summary,
    isLoading,
    isError,
  }
}
