import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  complaintQueryKeys,
  complaintService,
  type ComplaintFilterParams,
} from "@/services/complaint";
import {
  disputeResolutionQueryKeys,
  disputeResolutionService,
  type CreateDisputeResolutionPayload,
} from "@/services/disputeResolution";

export const useEnterpriseComplaints = (params?: ComplaintFilterParams, enabled = true) =>
  useQuery({
    queryKey: complaintQueryKeys.enterprise(params),
    queryFn: () => complaintService.getEnterpriseComplaints(params),
    enabled,
  });

export const useEnterpriseComplaintDetail = (id?: string | null) =>
  useQuery({
    queryKey: complaintQueryKeys.detail(id),
    queryFn: () => complaintService.getComplaintById(id!),
    enabled: !!id,
  });

export const useDisputeResolutionsByComplaint = (complaintId?: string | null) =>
  useQuery({
    queryKey: disputeResolutionQueryKeys.byComplaint(complaintId),
    queryFn: () => disputeResolutionService.getDisputeResolutionsByComplaintId(complaintId!),
    enabled: !!complaintId,
  });

export const useCreateDisputeResolution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDisputeResolutionPayload) =>
      disputeResolutionService.createDisputeResolution(payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: disputeResolutionQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: complaintQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: complaintQueryKeys.enterprise() }),
        queryClient.invalidateQueries({ queryKey: complaintQueryKeys.detail(variables.complaintId) }),
        queryClient.invalidateQueries({
          queryKey: disputeResolutionQueryKeys.byComplaint(variables.complaintId),
        }),
      ]);

      await queryClient.refetchQueries({
        queryKey: complaintQueryKeys.detail(variables.complaintId),
        exact: true,
      });
    },
  });
};
