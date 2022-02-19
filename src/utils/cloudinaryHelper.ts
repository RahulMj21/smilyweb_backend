import cloudinary from "cloudinary";

export const uploadImage = async (avatar: string, options: {}) => {
  try {
    const result = await cloudinary.v2.uploader.upload(avatar, {
      ...options,
    });
    return result;
  } catch (error: any) {
    return false;
  }
};

export const deleteImage = async (public_id: string) => {
  try {
    await cloudinary.v2.uploader.destroy(public_id);
    return true;
  } catch (error) {
    return false;
  }
};
