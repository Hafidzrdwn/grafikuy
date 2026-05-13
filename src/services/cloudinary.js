export const uploadFile = async (file) => {
  if (!file) throw new Error('No file to upload');

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const allowedExtensions = ['csv', 'xls', 'xlsx'];
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error('Format file ditolak! Hanya menerima CSV atau Excel.');
  }

  const maxSizeInMB = 3;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
  if (file.size > maxSizeInBytes) {
    throw new Error(`Ukuran file terlalu besar! Maksimal ${maxSizeInMB}MB.`);
  }

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary credentials missing in .env');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset); 
  
  formData.append('folder', 'grafikuy_upload');

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload to Cloudinary');
    }

    const data = await response.json();
    return {
      secure_url: data.secure_url, 
      public_id: data.public_id,
      original_filename: data.original_filename,
      format: data.format 
    };
  } catch (error) {
    throw new Error('Cloudinary upload error: ' + error.message);
  }
};