
const API_BASE_URL = 'http://localhost:8000';

export interface ProjectData {
  id: string;
  data: any;
}

export const apiClient = {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload image: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return `${API_BASE_URL}${data.url}`;
  },

  async saveProject(id: string, data: any): Promise<void> {
    const payload: ProjectData = { id, data };
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save project: ${response.status} - ${errorText}`);
    }
  },

  async loadProject(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load project: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    return json.data;
  }
};
