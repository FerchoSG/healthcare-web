import { getAccessToken, getClinicId } from "@/lib/api-client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface UploadResponse {
  files: Array<{
    key: string;
    filename: string;
    contentType: string;
  }>;
}

export async function uploadClinicalFiles(files: File[]): Promise<UploadResponse["files"]> {
  const token = getAccessToken();
  const clinicId = getClinicId();

  if (!token || !clinicId) {
    throw new Error("No hay sesión activa para subir archivos clínicos.");
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${BASE_URL}/storage/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-clinic-id": clinicId,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message ?? "No se pudieron subir los archivos.");
  }

  return (data as UploadResponse).files;
}
