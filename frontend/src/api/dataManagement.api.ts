import apiClient from './client';

/**
 * Update publisher information for a data in process record
 */
export const updatePublisherInProcess = async (
  id: string,
  publisherName: string,
  publisherEmail: string
): Promise<{
  success: boolean;
  message: string;
  data: {
    record: any;
    matched: boolean;
    publisherId: string | null;
  };
}> => {
  const response = await apiClient.put(`/data-in-process/${id}/publisher`, {
    publisherName,
    publisherEmail,
  });
  return response.data;
};

/**
 * Update publisher information for a data final record
 */
export const updatePublisherInFinal = async (
  id: string,
  publisherName: string,
  publisherEmail: string
): Promise<{
  success: boolean;
  message: string;
  data: {
    record: any;
    matched: boolean;
    publisherId: string | null;
  };
}> => {
  const response = await apiClient.put(`/data-final/${id}/publisher`, {
    publisherName,
    publisherEmail,
  });
  return response.data;
};
